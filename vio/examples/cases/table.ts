import { Column, UiButton, Vio, VioTable, Key } from "@asla/vio";

type Process = {
  swapFile: string;
  args: string[];
  createTime: number;
  status: 0 | 1;
  id: string;
};

const columns: Column<Process>[] = [
  { dataIndex: "swapFile" },
  {
    dataIndex: "args",
  },
  { title: "创建事件", dataIndex: "createTime" },
  {
    title: "状态",
    dataIndex: "status",
    render: `
  const { record } = args;
  const status = record.status;
  return {
    key: record.status ? "stop" : "run",
    ui: "tag",
    props: { text: status ? "running" : "stopped", color: status ? "green" : "red" },
  }; 
    `,
  },
  {
    title: "操作",
    render: `
  const { record } = args;
  return [
    { key: "stop", ui: "button", props: { disable: record.status === 0, text: "停止", type: "text" } },
    { key: "run", ui: "button", props: { disable: record.status === 1, text: "启动", type: "text" } },
  ];
    `,
  },
];

export function appendTable(vio: Vio) {
  const t1 = vio.object.createTable(columns, {
    keyField: "id",
    name: "只读表格",
  });
  let rows: Process[] = [];
  for (let i = 0; i < 100; i++) {
    rows[i] = createRow("ps-" + i);
  }
  t1.updateTable(rows);
  const t2 = vio.object.createTable(columns, {
    keyField: "id",
    name: "可编辑表格",
    addAction: { text: "添加进程" },
    updateAction: true,
    operations: [
      new UiButton("run", {
        text: "批量启动",
        icon: "https://search-operate.cdn.bcebos.com/e8cbce1d53432a6950071bf26b640e2b.gif",
      }),
      new UiButton("stop", { text: "批量停止" }),
    ],
  });
  t2.addRow(createRow("p2-1"));
  t2.addRow(createRow("p2-2"));
  t2.addRow(createRow("p2-4"));

  const onAction = function (this: VioTable<Process>, opKey: string, rowKey: Key) {
    const index = this.getRowIndexByKey(rowKey);
    const row = this.getRow(index);

    switch (opKey) {
      case "run":
        return new Promise<void>((resolve, reject) => {
          setTimeout(() => {
            resolve();
            this.updateRow({ ...row, status: 1 }, index);
          }, 1000);
        });
      case "stop":
        this.updateRow({ ...row, status: 0 }, index);
        break;
      default:
        break;
    }
  };
  const onTableAction = function (this: VioTable<Process>, opKey: string, selectedKeys: Key[]) {
    const status = opKey === "run" ? 1 : 0;
    for (const key of selectedKeys) {
      const index = this.getRowIndexByKey(key);
      const row = this.getRow(index);
      this.updateRow({ ...row, status }, index);
    }
  };
  t1.onRowAction = onAction;
  t2.onRowAction = onAction;

  t1.onTableAction = onTableAction;
  t2.onTableAction = onTableAction;

  return { t1, t2 };
}
function createRow(id: string): Process {
  return {
    args: ["-a"],
    swapFile: "xxx" + id,
    createTime: Date.now(),
    id,
    status: Math.random() > 0.5 ? 1 : 0,
  };
}
