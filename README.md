[![NPM version][npm]][npm-url]
[![JSR version][jsr]][jsr-url]
[![Node version][node]][node-url]
[![Install size][size]][size-url]

[npm]: https://img.shields.io/npm/v/@asla/vio.svg
[npm-url]: https://npmjs.com/package/@asla/vio
[jsr]: https://jsr.io/badges/@asla/vio
[jsr-url]: https://jsr.io/@asla/vio
[node]: https://img.shields.io/node/v/@asla/vio.svg
[node-url]: https://nodejs.org
[size]: https://packagephobia.com/badge?p=@asla/vio
[size-url]: https://packagephobia.com/result?p=@asla/vio

## 图形界面式输入输出

提供各种图形化的控件。在浏览器中与进程进行交互

<img src="https://github.com/asnowc/vio/raw/main/blob/docs/img/vio.png"/>

上图的示例见 [/vio/examples/run_server.ts](https://github.com/asnowc/vio/blob/main/vio/examples/run_server.ts)

## Examples

### 启动 web 服务器

```ts
import vio, { VioHttpServer } from "@asla/vio";

const server = new VioHttpServer(vio);
await server.listen(8887, "127.0.0.1");
console.log(`server listened ${hostname}:${port}`);

let i = 0;
setInterval(() => {
  vio.writeText("输出一段文本" + i++);
}, 2000);
```

在浏览器访问 https://127.0.0.1:8887，你看到的就是 vio 的 WEB 终端。你可以与其进行交互

### 输出其他类型

```ts
import { readFile } from "node:fs/promises";

vio.writeText("输出一段文本", "error");
vio.writeText("输出一段文本", "warn");

const data = await readFile(import.meta.dirname + "/test_image.png");
vio.writeImage({ mime: "image/png", data });
```

### 输入示例

```ts
const text = vio.readText(); // 从 web 端读取一段文本
const files = vio.readFiles(); // 从 web 端读上传文件
const res = vio.confirm("yes or no?"); // 从 web 端确认

const options = [{ value: 1, label: "option 1" }];

const selectedList = vio.select("select", options); // 多选
const selected = vio.pick("pick", options); // 单选

const res = await Promise.all([text, files, res, selectedList, selected]);
console.log(res);
```

### 图表

```ts
import vio, { Vio } from "@asla/vio";
import process from "node:process";
/** 内存图。每两秒更新一次图 */
async function memoryChart(vio: Vio) {
  const indexNames = ["external", "heapUsed", "heapTotal", "rss"] as (keyof NodeJS.MemoryUsage)[];
  const chart = vio.chart.create(2, {
    meta: {
      chartType: "line", //折线图
      title: "内存", // 图表标题
      enableTimeline: true,
      requestInterval: 2000, // web 端自动请求
    },
    dimensions: [, { indexNames }], //设置 x轴的刻度名称
    updateThrottle: 1000, // 更新频率限制，单位毫秒
    onRequestUpdate: () => {
      // process.memoryUsage() 是耗时的，所以设置 onRequestUpdate() 让 web 端进行更新
      const data = process.memoryUsage();
      return indexNames.map((key) => data[key] / 1024 / 1024);
    },
  });
  return chart;
}
memoryChart(vio);
```
