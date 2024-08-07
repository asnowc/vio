import {
  ChartUpdateData,
  VioChartBase,
  ServerObjectExposed,
  VioObjectCreateDto,
  ClientObjectExposed,
  Column,
  TableCreateOption,
  ServerTableExposed,
  Key,
  TableChanges,
  StackChangeData,
  ChartDataItem,
  ChartInfo,
  TableFilter,
  TableRow,
  VioChartCreateConfig,
  VioObject,
  DebugCommand,
  ServerStepRunnerExposed,
} from "@asla/vio/client";
import { EventTrigger } from "evlib";
import { MakeCallers, RpcService, RpcExposed } from "cpcall";

class CachePromise<K extends string | number | symbol, T> {
  constructor(private create: (key: K) => Promise<T>) {
    this.#cache = {} as any;
  }
  #cache: Record<K, T | Promise<T>>;
  clear() {
    this.#cache = {} as any;
  }
  async get(key: K) {
    if (this.#cache[key]) return this.#cache[key];
    const promise = this.create(key);
    promise.then(
      (val) => {
        this.#cache[key] = val;
      },
      () => {
        delete this.#cache[key];
      },
    );
    return promise;
  }
  getExist(key: K): T | undefined {
    const value = this.#cache[key];
    if (value instanceof Promise) return;
    return value as T;
  }
  delete(key: K) {
    return delete this.#cache[key];
  }
}
@RpcService()
export class ClientVioObjectService implements ClientObjectExposed {
  protected uiObjects = new Map<number, VioObject>();
  @RpcExposed()
  deleteObject(...idList: number[]): void {
    let deleted: Record<string, boolean> = {};
    for (const id of idList) {
      let obj = this.uiObjects.get(id);
      if (!obj) {
        console.error("RPC 删除不存在的 VioObject", id);
        continue;
      }
      deleted[obj.type] = true;
      this.uiObjects.delete(id);
    }
    this.deleteObjEvent.emit(new Set(idList));
  }
  @RpcExposed()
  createObject(info: VioObjectCreateDto): void {
    this.uiObjects.set(info.id, info);
    this.createObjEvent.emit(info);
  }
  readonly createObjEvent = new EventTrigger<undefined | VioObject>();
  readonly deleteObjEvent = new EventTrigger<Set<number>>();
  private async unwatchObject(objectId: number) {}

  clearObject() {
    const keys = new Set(this.uiObjects.keys());
    this.uiObjects.clear();
    this.#watchingChart.clear();
    this.#watchingTable.clear();
    this.deleteObjEvent.emit(keys);
  }
  *getSampleList(filter: { type?: string } = {}) {
    const { type } = filter;
    if (!type) return this.uiObjects.values();
    for (const obj of this.uiObjects.values()) {
      if (obj.type === type) yield obj;
    }
  }

  /* Chart */

  @RpcExposed()
  writeChart(chartId: number, data: ChartUpdateData<any>): void {
    this.writeChartEvent.emit({ id: chartId, data });
  }

  #serverApi?: MakeCallers<ServerObjectExposed>;
  init(serverApi?: MakeCallers<ServerObjectExposed>) {
    this.#serverApi = serverApi;
    if (serverApi) {
      this.uiObjects.clear();
      serverApi.getObjects().then(({ list }) => {
        for (const item of list) {
          if (this.uiObjects.has(item.id)) continue;
          this.uiObjects.set(item.id, item);
        }
        if (list?.length) {
          this.createObjEvent.emit(undefined);
        }
      });
    }
  }
  #watchingChart = new CachePromise<number, any>(async () => {});
  async getChart(chartId: number): Promise<ChartInfo<number> | undefined> {
    return this.#serverApi!.getChartInfo(chartId);
  }
  async unwatchChart(chartId: number) {
    this.#watchingChart.delete(chartId);
    await this.unwatchObject(chartId);
  }
  async requestUpdate(chartId: number): Promise<ChartDataItem<any> | undefined> {
    if (!this.#serverApi) throw new Error("没有连接");
    return this.#serverApi.requestUpdateChart(chartId);
  }

  readonly writeChartEvent = new EventTrigger<{ id: number; data: ChartUpdateData<any> }>();

  /* Table */

  #watchingTable = new CachePromise<number, TableClientAgent>((tableId) => {
    return this.#serverApi!.getTable(tableId).then(({ columns, id, ...option }) => {
      return new TableClientAgent(tableId, columns, option, this.#serverApi!);
    });
  });
  async getTable(tableId: number): Promise<TableClientAgent> {
    return this.#watchingTable.get(tableId);
  }
  async getTableData(tableId: number, filter?: TableFilter) {
    return this.#serverApi!.getTableData(tableId, filter);
  }
  async unwatchTable(tableId: number) {
    await this.#watchingTable.delete(tableId);
    await this.unwatchObject(tableId);
  }

  @RpcExposed()
  updateTable(tableId: number): void {
    const table = this.#watchingTable.getExist(tableId);
    if (!table) return;
    table.needReloadEvent.emit();
  }
  @RpcExposed()
  tableChange(tableId: number, changes: TableChanges<TableRow>): void {
    const table = this.#watchingTable.getExist(tableId);
    if (!table) return;
    table.needReloadEvent.emit();
  }
  /* StepTask  */
  #watchingTask = new CachePromise<number, StepStackClient>((id) => {
    return this.#serverApi!.getStepTaskCommand(id).then((init) => new StepStackClient(this.#serverApi!, id, init));
  });
  async getStepTask(id: number) {
    return this.#watchingTask.get(id);
  }
  @RpcExposed()
  stepTaskStackChange(objId: number, change: StackChangeData): void {
    const obj = this.#watchingTask.getExist(objId);
    console.log(change);
    
    if (!obj) return;
    obj.change(change);
  }
  @RpcExposed()
  stepTaskStatusChange(objId: number, pause: boolean): void {
    const obj = this.#watchingTask.getExist(objId);
    if (!obj) return;
    if (pause) obj.pause();
    else obj.continue();
  }
}

export class ChartClientAgent<T = number> extends VioChartBase<T> {
  constructor(config: VioChartCreateConfig<T>) {
    super(config);
  }
  pushCache(...items: ChartDataItem<T>[]): void {
    super.pushCache(...items);
  }
  updateData(data: T, timeName?: string | undefined): void {
    this.pushCache({ data: data, timestamp: Date.now(), timeName: timeName });
  }
}
export class TableClientAgent<Row extends TableRow = TableRow, Add extends object = Row, Update extends object = Add> {
  constructor(
    readonly id: number,
    readonly columns: Readonly<Column<TableRow>>[],
    option: TableCreateOption,
    private api: MakeCallers<ServerTableExposed>,
  ) {
    this.config = option ?? {};
  }
  readonly config: TableCreateOption;
  readonly needReloadEvent = new EventTrigger<void>();
  async onRowAction(opKey: string, rowKey: Key) {
    await this.api.onTableRowAction(this.id, opKey, rowKey);
  }
  async onTableAction(opKey: string, selectedKeys: Key[]) {
    await this.api.onTableAction(this.id, opKey, selectedKeys);
  }
  async onAdd(param: Add) {
    await this.api.onTableRowAdd(this.id, param);
  }
  async onUpdate(rowKey: Key, param: Update) {
    await this.api.onTableRowUpdate(this.id, rowKey, param);
  }
}

export class StepStackClient<T = any> {
  constructor(
    private api: MakeCallers<ServerStepRunnerExposed>,
    private id: number,
    init: { list: T[]; paused: boolean },
  ) {
    this.#stack = init.list;
    this.paused = init.paused;
  }
  #stack: T[];
  get eachStackList() {
    return this.#stack;
  }
  readonly onChange = new EventTrigger<void>();
  readonly onStatusChange = new EventTrigger<boolean>();
  paused = false;
  pause() {
    if (this.paused) return;
    this.paused = true;
    this.onStatusChange.emit(true);
  }
  continue() {
    if (this.paused) {
      this.onStatusChange.emit(false);
      this.paused = false;
    }
  }
  change(changes: StackChangeData) {
    if (changes.pop) {
      this.#stack.length -= changes.pop;
    }
    this.#stack.push(...changes.push);
    this.onChange.emit();
  }
  execCommand(cmd: DebugCommand) {
    this.api.execStepTaskCommand(this.id, cmd);
  }
}
export type { Key };
