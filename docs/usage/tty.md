## TTY

### 创建多个 TTY

```ts
const tty8: VioTty = vio.tty.get(8); // 获取 id为 8 的 tty. 如果不存在，则创建 TTY
tty8.log("hi");
vio.tty.dispose(tty8); // 如果不再使用，应销毁
```

### TTY 缓存

默认情况下 TTY 会缓存20条消息，可以在web终端连接时加载历史。
你可以更改缓存条数：

```ts
const tty8 = vio.tty.get(8);
tty8.cacheSize = 0; // 更改缓存条数
```

## 输出

可向 Web 终端输出多种不同类型的输出，包括图片、以及不同类型的文本等

```ts
import { readFile } from "node:fs/promises";

vio.error("输出一段文本");
vio.warn("输出一段文本");
vio.log("输出一段文本");
vio.info("输出一段文本", "text text text text text ");

const data = await readFile(import.meta.dirname + "/test_image.png");
vio.writeImage({ mime: "image/png", data });
```

## 输入

可发起多种不同类型的输入请求，请求将在web端输入后解决。

```ts
const text = await vio.readText(); // 从 web 端读取一段文本
const files = await vio.readFiles(); // 从 web 端读上传文件
const res = await vio.confirm("yes or no?"); // 从 web 端确认

const options = [{ value: 1, label: "option 1" }];

const selectedList = await vio.select("select", options); // 多选
const selected = await vio.pick("pick", options); // 单选
```

## 命令

可以设定一些命令，在 Web端触发执行

```ts
const tty = await vio.tty.get(0);
tty.setCommand("test.command", {
  description: "输出测试日志",
  call: (args, info) => tty.log(info.command, "输出测试日志"),
});
tty.setCommand("test.args", {
  description: "测试命令参数",
  args: [
    { key: "confirm", required: true, type: { type: "confirm", title: "hhh", content: "xx" } },
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
```
