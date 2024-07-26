[![JSR version][jsr]][jsr-url]
[![NPM version][npm]][npm-url]
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

[API Document](https://jsr.io/@asla/vio/doc)

## Web 终端

提供各种图形化的控件。通过基于 WebSocket 的 RPC ([cpcall](https://github.com/asnowc/cpcall)) 通信，在浏览器中与进程进行交互

<img src="https://github.com/asnowc/vio/raw/main/docs/img/vio.png"/>

上图的示例见 [/vio/examples/run_server.ts](https://github.com/asnowc/vio/blob/main/vio/examples/run_server.ts)

## Usage

## Node

```ts
import vio, { VioHttpServer } from "@asla/vio";
```

## Deno

### 权限

- `--allow-net`：启动 web 服务器
- `--allow-read`：web 服务器读取文件

```ts
import vio, { VioHttpServer } from "jsr:@asla/vio";
```

```ts
import vio, { VioHttpServer } from "npm:@asla/vio";
```

需要注意的是，如果通过 jsr 导入，启动的服务器将不会包含静态资源文件，你可以查看 [自定义前端](https://github.com/asnowc/vio/blob/main/docs/usage/config.md)

## Examples

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

[输出图表的示例](https://github.com/asnowc/vio/blob/main/docs/usage/chart.md)\
[WEB终端 输出与输入示例](https://github.com/asnowc/vio/blob/main/docs/usage/tty.md)
