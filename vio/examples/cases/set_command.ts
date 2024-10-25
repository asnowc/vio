import { VioTty } from "@asla/vio";

export function setCommand(tty: VioTty) {
  tty.setCommand("test.command", {
    description: "输出测试日志",
    call: (args, info) => tty.log(info.command, "输出测试日志"),
  });
  tty.setCommand("test.args", {
    description: "测试命令参数",
    args: {
      yes_no: { type: "confirm", title: "hhh", content: "xx" },
    },
    call: (args, info) => tty.log("输出参数", args),
  });
}
