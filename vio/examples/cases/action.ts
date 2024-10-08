import { SelectItem, TTY } from "@asla/vio";
import { toErrorStr } from "evlib";

async function nextInput(i: number, tty: TTY) {
  const opts: SelectItem[] = [
    { label: "文件", value: "file" },
    { label: "文本", value: "text" },
    { label: "确认", value: "confirm" },
  ];
  return tty.select(i + ". 选择测试内容", opts);
}

export async function inputSelect(tty: TTY) {
  let i = 0;
  while (true) {
    const types = await nextInput(i++, tty).catch((e) => {
      tty.error(toErrorStr(e));
      return [];
    });
    for (const type of types) {
      let val: Promise<string | boolean>;
      switch (type) {
        case "file":
          val = tty
            .readFiles()
            .then((items) => items.map(({ data, mime, name }) => ({ mime, name, len: data.byteLength })))
            .then(JSON.stringify);
          break;
        case "text":
          val = tty.readText();
          break;
        case "confirm":
          val = tty.confirm("测试确认");
          break;
        default:
          val = Promise.resolve("unknown");
          break;
      }
      val.then(
        (value) => tty.log(`测试输入‘${type}’类型结果：` + value),
        (e) => {
          tty.error(toErrorStr(e));
        },
      );
    }
  }
}
