import { expect, vi, describe, beforeEach } from "vitest";
import { vioServerTest as test, VioServerTestContext } from "../_env/test_port.ts";
import { Columns, Operation, TableRenderFn, TableRow, VioTable } from "@asla/vio";
import { TableDataDto, VioObjectCreateDto, VioTableDto } from "../../src/client.ts";
import { afterTime } from "evlib";

test("createTable", async function ({ vio, connector }) {
  const { clientApi, serverApi } = connector;
  function getList() {
    return serverApi.object.getObjects().then((res) => res.list);
  }
  const table = vio.object.createTable<Process>(columns, {
    name: "进程",
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
  });

  await expect(serverApi.object.getTable(table.id)).resolves.toEqual({
    columns,
    operations: commonOperation,
    addAction: { text: "创建进程" },
    name: "进程",
    id: table.id,
    updateAction: true,
  } satisfies VioTableDto);
});
describe("action", async function () {
  type AddParam = Pick<Process, "args" | "swapFile">;
  let table: VioTable<Process, AddParam>;

  beforeEach<VioServerTestContext>(function ({ vio }) {
    table = vio.object.createTable<Process>(columns, {
      name: "进程",
      addAction: { text: "创建进程" },
      // updateAction: true, // 默认为 true
      operations: commonOperation,
    });
  });
  test("onAdd", async function ({ connector }) {
    const { serverApi } = connector;

    const onAdd = vi.fn((param: AddParam) => {});
    table.onRowAdd = onAdd;
    const row: AddParam = {
      args: ["-a"],
      swapFile: "xxx",
    };
    await serverApi.object.onTableRowAdd(table.id, row);
    expect(onAdd).toBeCalledWith(row);
  });
  test("addRow", async function ({ connector }) {
    const { clientApi } = connector;

    table.addRow(createRow(0)); //0
    expect(() => table.addRow(createRow(1), 2)).toThrowError(RangeError);
    expect(() => table.addRow(createRow(2), -1)).toThrowError(RangeError);

    table.addRow(createRow(1)); //1
    table.addRow(createRow(2), 0); //2
    table.addRow(createRow(3)); //3
    table.addRow(createRow(4), 3); //4

    expect(table.getRows().rows.map((item) => item.id)).toEqual([2, 0, 1, 4, 3]);

    await afterTime(30);

    const calls = clientApi.object.addTableRow.mock.calls;
    expect(calls[0], "first-push").toEqual([table.id, createRow(0), 0]);
    expect(calls[1], "push1").toEqual([table.id, createRow(1), 1]);
    expect(calls[2], "insert after 0").toEqual([table.id, createRow(2), 0]);
    expect(calls[3], "push2").toEqual([table.id, createRow(3), 3]);
    expect(calls[4], "insert after -1").toEqual([table.id, createRow(4), 3]);
  });
  test("getRows", async function ({ connector }) {
    const { clientApi, serverApi } = connector;
    table.updateTable([createRow(1), createRow(2), createRow(3), createRow(4)]);
    const tablePage = await serverApi.object.getTableData(table.id, { page: 1, pageSize: 2 });
    const expectData: TableDataDto<TableRow> = { rows: [createRow(2), createRow(3)], index: [1, 2] };
    expect(tablePage).toEqual(expectData);
  });
  test("deleteRow", async function ({ connector }) {
    const { clientApi, serverApi } = connector;
    table.updateTable([createRow(1), createRow(2), createRow(3), createRow(4)]);
    table.deleteRow(1, 2);

    const tableIdList = table.getRows().rows.map((item) => item.id);
    expect(tableIdList).toEqual([1, 4]);

    const list = await serverApi.object.getTableData(table.id);
    expect(list.rows.map((item) => item.id)).toEqual([1, 4]);

    expect(clientApi.object.deleteTableRow).toBeCalledWith(table.id, 1, 2);
  });
  test("updateRow", async function ({ connector }) {
    const { clientApi, serverApi } = connector;
    table.updateTable([createRow(1), createRow(2), createRow(3), createRow(4)]);

    table.updateRow(createRow(5), 1);

    const res = await serverApi.object.getTableData(table.id);

    expect(res.rows.map((item) => item.id)).toEqual([1, 5, 3, 4]);
    expect(clientApi.object.updateTableRow).toBeCalledWith(table.id, createRow(5), 1);
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

const commonOperation: Operation[] = [
  { key: "run", ui: "operation", text: "运行" },
  { key: "stop", ui: "operation", text: "停止" },
];

const columns: Columns<Process>[] = [
  { dataIndex: "swapFile" },
  { dataIndex: "args" },
  { title: "创建事件", dataIndex: "createTime" },
  {
    title: "操作",
    operations: commonOperation,
    render: (
      ((record, info, column): Operation[] => {
        const oper = column.operations!;
        if (record.status) {
          return [{ ...oper[0], disable: true }, oper[1]];
        } else {
          return [oper[0], { ...oper[1], disable: true }];
        }
      }) satisfies TableRenderFn<Process>
    ).toString(),
  },
];
