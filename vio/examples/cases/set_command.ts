import { TtyCenter } from "@asla/vio";

export function setCommand(center: TtyCenter) {
  const tty = center.get(0);
  tty.setCommand("test.command", {
    description: "输出测试日志",
    exec: (args, info) => tty.log(info.command, "输出测试日志"),
  });
  tty.setCommand("test.args", {
    description: "测试命令参数",
    args: [
      { key: "confirm", required: true, type: { type: "confirm", title: "hhh", content: "xx" } },
      { key: "file", type: { type: "file", title: "hhh" } },
      {
        key: "select",
        type: {
          type: "select",
          title: "hhh",
          options: [
            { value: 1, label: "x1" },
            { value: 2, label: "x2" },
            { value: 3, label: "x3" },
          ],
        },
      },
      { key: "text", type: { type: "text", title: "hhh" } },
    ],
    exec: (args, info) => tty.log("输出参数", args),
  });

  const tty1 = center.get(1);

  tty1.setCommand("test.error", {
    description: "执行会错误的命令",
    args: [{ key: "tt", type: { type: "text" } }],
    exec: (args, info) => {
      throw new Error("执行出错");
    },
  });
  tty1.setCommand("async-error", async function () {
    throw Error("异步错误");
  });
}
