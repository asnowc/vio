import { VioTty } from "@asla/vio";

export function setCommand(tty: VioTty) {
  tty.setCommand("test.command", {
    description: "输出测试日志",
    call: (args, info) => tty.log(info.command, "输出测试日志"),
  });
  tty.setCommand("test.error", {
    description: "执行会错误的命令",
    args: [{ key: "tt", type: { type: "text" } }],
    call: (args, info) => {
      throw new Error("执行出错");
    },
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
    call: (args, info) => tty.log("输出参数", args),
  });
}
