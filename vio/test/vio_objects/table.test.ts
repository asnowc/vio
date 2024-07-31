import { expect, vi, describe, beforeEach } from "vitest";
import { vioServerTest as test } from "../_env/test_port.ts";
import { Column, TableRenderFn, TableRow, Vio, VioTable } from "@asla/vio";
import { TableChanges, TableDataDto, VioObjectCreateDto, VioTableDto } from "../../src/client.ts";
import { UiButton } from "src/vio/vio_object/_ui/mod.ts";
import { afterTime } from "evlib";

test("createTable", async function ({ vio, connector }) {
  const { clientApi, serverApi } = connector;
  function getList() {
    return serverApi.object.getObjects().then((res) => res.list);
  }
  const table = vio.object.createTable<Process>(columns, {
    name: "进程",
    keyField: "id",
  });

  const createDto: VioObjectCreateDto = { type: "table", name: "进程", id: table.id };
  await expect(getList()).resolves.toEqual([createDto] satisfies VioObjectCreateDto[]);

  expect(clientApi.object.createObject).toBeCalledWith(createDto);
});

test("getTable", async function ({ vio, connector }) {
  const { clientApi, serverApi } = connector;

  const table = vio.object.createTable<Process>(columns, {
    name: "进程",
    addAction: { text: "创建进程" },
    updateAction: true,
    operations: commonOperation,
    keyField: "id",
  });

  await expect(serverApi.object.getTable(table.id)).resolves.toEqual({
    columns,
    operations: commonOperation,
    addAction: { text: "创建进程" },
    name: "进程",
    id: table.id,
    keyField: "id",
    updateAction: true,
  } satisfies VioTableDto);
});
describe("action", async function () {
  type AddParam = Pick<Process, "args" | "swapFile">;

  function createTable(vio: Vio): VioTable<Process, AddParam> {
    return vio.object.createTable<Process>(columns, {
      keyField: "id",
      name: "进程",
      addAction: { text: "创建进程" },
      // updateAction: true, // 默认为 true
      operations: commonOperation,
    });
  }

  test("getRows", async function ({ vio, connector }) {
    const { clientApi, serverApi } = connector;
    const table = createTable(vio);
    table.updateTable([createRow(1), createRow(2), createRow(3), createRow(4)]);
    const tablePage = await serverApi.object.getTableData(table.id, { skip: 1, number: 2 });
    const expectData: TableDataDto<TableRow> = { rows: [createRow(2), createRow(3)], index: [1, 2], total: 4 };
    expect(tablePage).toEqual(expectData);
  });

  test("addRow", async function ({ vio }) {
    const table = createTable(vio);
    table.addRow(createRow(0)); //0
    expect(() => table.addRow(createRow(1), 2)).toThrowError(RangeError);
    expect(() => table.addRow(createRow(2), -1)).toThrowError(RangeError);

    table.addRow(createRow(1)); //1
    table.addRow(createRow(2), 0); //2
    table.addRow(createRow(3)); //3
    table.addRow(createRow(4), 3); //4

    expect(table.getRows().rows.map((item) => item.id)).toEqual([2, 0, 1, 4, 3]);
  });
  test("tableChange", async function ({ vio, connector }) {
    const table = createTable(vio);
    const { clientApi, serverApi } = connector;
    table.updateTable([createRow(0), createRow(1)]); // 0,1

    table.addRow(createRow(2));
    table.addRow(createRow(3));
    table.addRow(createRow(4)); // 0,1,2,3,4  add 2,3,4

    table.updateRow(createRow(8), 1); // 0,8,2,3,4 update 1
    table.updateRow(createRow(9), 4); // 0,8,2,3,9 update 1 add 2,3,9
    table.deleteRow(1, 3); // 0,9 delete 1 add 9

    const tableIdList = table.getRows().rows.map((item) => item.id);
    expect(tableIdList).toEqual([0, 9]);

    await afterTime(200);
    const calls = clientApi.object.tableChange.mock.calls[0];
    expect(calls).toEqual([
      table.id,
      {
        delete: [1],
        // update: [],
        add: [createRow(9)],
      } satisfies TableChanges,
    ]);
  });

  const onAction = vi.fn();
  beforeEach(() => {
    onAction.mockRestore();
  });
  test("onAdd", async function ({ vio, connector }) {
    const table = createTable(vio);
    const { serverApi } = connector;

    table.onRowAdd = onAction;
    const row: AddParam = {
      args: ["-a"],
      swapFile: "xxx",
    };
    await serverApi.object.onTableRowAdd(table.id, row);
    expect(onAction).toBeCalledWith(row);
  });
  test("onRowAction", async function ({ vio, connector }) {
    const table = createTable(vio);
    const { serverApi } = connector;
    table.onRowAction = onAction;
    await serverApi.object.onTableRowAction(table.id, "k", "rowKey");
    expect(onAction).toBeCalledWith("k", "rowKey");
  });
  test("onTableAction", async function ({ vio, connector }) {
    const table = createTable(vio);
    const { serverApi } = connector;
    table.onTableAction = onAction;
    await serverApi.object.onTableAction(table.id, "k", [1, 2]);
    expect(onAction).toBeCalledWith("k", [1, 2]);
  });

  let time = Date.now();
  function createRow(id: number): Process {
    return {
      args: ["-a"],
      swapFile: "xxx",
      createTime: time,
      id,
      status: 1,
    };
  }
});

type Process = {
  swapFile: string;
  args: string[];
  createTime: number;
  status: 0 | 1;
  id: number;
};

const commonOperation: UiButton[] = [new UiButton("run", { text: "运行" }), new UiButton("stop", { text: "停止" })];

const actionRender: TableRenderFn<Process> = (args): UiButton[] => {
  const { record } = args;
  return [
    { key: "stop", ui: "button", props: { disable: record.status === 0, text: "停止", type: "text" } },
    { key: "run", ui: "button", props: { disable: record.status === 1, text: "启动", type: "text" } },
  ];
};

const columns: Column<Process>[] = [
  { dataIndex: "swapFile" },
  { dataIndex: "args" },
  { dataIndex: "createTime", title: "创建时间" },
  { dataIndex: "status" },
  {
    title: "操作",
    render: actionRender.toString(),
  },
];
