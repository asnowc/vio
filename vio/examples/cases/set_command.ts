import { TtyCenter } from "@asla/vio";
import { readFile } from "node:fs/promises";

const MSG_TYPE = ["error", "info", "log", "warn"] as const;

const imgData = await readFile(import.meta.dirname + "/test_image.png");

export function setCommand(center: TtyCenter) {
  const tty = center.get(0);
  tty.setCommand("test.command", {
    description: "输出测试日志",
    exec: (args, info) => tty.log(info.command, "输出测试日志"),
  });
  tty.setCommand("test.command", {
    description: `输出${MSG_TYPE.length * 2}条日志`,
    exec: (args, { tty }) => {
      let num = MSG_TYPE.length * 2;
      for (let i = 0; i < num; i++) {
        const index = i % (MSG_TYPE.length - 1);
        tty[MSG_TYPE[index]]("hhh" + (i + 1), "ksdkgasdkg\ndsgasdgsdf文本文本");
      }
    },
  });
  tty.setCommand("test.writeImage", {
    description: "输出图片",
    exec: (args, info) => tty.writeImage({ mime: "image/png", data: imgData }),
  });
  tty.setCommand("test.writeTable", {
    description: "输出表格",
    exec(args, info) {
      tty.writeTable([], "空表格");
      tty.writeTable([{ name: "name1", age: 18 }, { name: "name2", size: 10 }, ["id2", 56]], "对象数组");
      tty.writeTable(
        [
          ["string", 56, 8345n, NaN, Infinity],
          [true, false, undefined, null],
          [
            { k: 1, k2: 2 },
            [1, 2, 3],
            Symbol("i'm symbol"),
            new Set([1, 2, 3]),
            new Map([
              ["k1", 1],
              ["k2", 2],
            ]),
          ],
        ],
        "不同类型",
      );
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
