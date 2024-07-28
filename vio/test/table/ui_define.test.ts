import { describe, expect, vi } from "vitest";
import { afterTime } from "evlib";
import { vioServerTest as test } from "../_env/test_port.ts";
import { Columns, Operation, TableRenderFn } from "@asla/vio";
import { VioObjectCreateDto } from "../../src/client.ts";

type Process = {
  swapFile: string;
  args: string[];
  createTime: number;
  status: 0 | 1;
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

test.todo("createTable", async function ({ vio, connector }) {
  const { clientApi, serverApi } = connector;
  const table = vio.object.createTable<Process>(columns, {
    addAction: { text: "创建进程" },
    updateAction: true,
    operations: commonOperation,
  });

  table.onRowAdd = vi.fn(() => {
    table.addRow({ args: [], createTime: Date.now(), swapFile: "xxx", status: 0 });
  });
  table.onRowAction = vi.fn();

  await afterTime();
  expect(clientApi.object.createObject).toBeCalledWith({
    type: "table",
    name: "进程",
    id: table.id,
  } satisfies VioObjectCreateDto);
});
