## vio web服务器

### 自定义前端资源

如果是通过 npm 安装，默认的前端资源文件在 `node_module/@asla/vio/assets/web/` 目录下
如果是通过jsr安装，则不会包含 静态资源文件，你需要自己构建静态资源文件。

定制前端有以下三种方式

#### 指定静态资源文件目录

```ts
const vioServer = new VioHttpServer(vio, { vioStaticDir: "你的静态资源文件根目录" });
```

#### 手动处理静态资源的请求

```ts
const vioServer = new VioHttpServer(vio, {
  staticHandler: (request): Response | Promise<Response> => {
    // 处理响应
  },
});
```

#### 代理

vio 使用了基于 WebSocket 的 远程过程调用的库 [cpcall](https://github.com/asnowc/cpcall)。你可以将前端的 WebSocket 代理到 vio 服务器，WebSocket连接地址为 `/api/rpc`

## 前端配置

可通过更改前端资源文件的 `/config.json` 文件更改一些前端配置，
其接口为

```ts
interface AppWebConfig {
  themeName?: "dark" | "light";
  rpcConnect?: {
    /** 连接 websocket 的 url。如果存在，将忽略 connectOrigin、connectProtocol、connectPath */
    connectUrl?: string;
    /**
     * 进入页面后是否自动连接
     * @defaultValue true
     */
    autoConnect?: boolean;
    /**
     * 意外断开连接后是否自动重新连接尝试的次数。设置为0，将会自动重连，设置位-1 将不限次数。
     * @defaultValue 10
     */
    reconnectTryMax?: number;
    /**
     * 自动重新连接等待时间。单位为毫秒。
     * @defaultValue 2000
     */
    wait?: number;

    /** 连接 websocket 的域。默认位 web 服务器的域 */
    connectHost?: string;
    /** 连接 websocket 的协议，可选 "ws"或 "wss". 默认 "ws" */
    connectProtocol?: "ws" | "wss";
    /** 连接 websocket 的路径，默认 "/api/rpc" */
    connectPath?: string;
  };
}
```

示例

```jsonc
{
  "themeName": "dark",
  "rpcConnect": {
    "connectProtocol": "ws",
    "connectPath": "/api/rpc",
    "autoConnect": true,
    "reconnectTryMax": 10,
    "wait": 5000,
  },
}
```
