import type { Duplex } from "node:stream";
import { OutgoingHttpHeaders, request } from "node:http";
import { createHash } from "node:crypto";
import { WS_STATUS, WebSocketResolver } from "./websocket_resolver.ts";
import { Socket } from "node:net";
import { WebSocket as SampleWebSocket } from "../deno/http.ts";
function createWsConnection(url: string): Promise<Socket> {
  const req = request(url, {
    headers: {
      Upgrade: "websocket",
      Connection: "Upgrade",
      "Sec-WebSocket-Key": "CSZZ2veSXIGMaXK/5hd5mA==",
    },
  });
  return new Promise<Socket>(function (resolve, reject) {
    req.once("upgrade", (response, socket, head) => {
      const headers = response.headers;
      if (headers.upgrade === "websocket") {
        resolve(socket);
      } else reject(new Error("不支持的协议"));
    });
    req.once("response", (response) => {
      const status = response.statusCode;
      if (status !== 101) reject(new Error("服务器拒绝协议升级。返回状态码:" + status));
    });
    req.on("close", () => reject(new Error("服务器拒绝连接")));
    req.on("error", (err) => reject(new Error("Upgrade Request Error", { cause: err })));
    req.end();
  });
}

export async function connectWebsocket(url: string): Promise<WebSocket> {
  if (url.startsWith("ws")) url = "http" + url.slice(2);
  else {
    let i = url.indexOf(":");
    throw new Error(`Protocol "${url.slice(0, i + 1)}" not supported. Expected "http:"`);
  }
  // const socket = await createWsConnection(url);
  return createWsConnection(url).then((socket) => {
    const ws = new WebSocket(socket, { isOpened: true });
    return ws;
  });
}
export function genResponseWsHeader(oKey: string): Record<string, string> {
  const headers: OutgoingHttpHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS,PUT,DELETE",
    Upgrade: "websocket",
    Connection: "Upgrade",
    "Sec-WebSocket-Accept": SHA1(oKey + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"),
  };
  return headers as Record<string, string>;
}
function SHA1(str: string) {
  return createHash("sha1").update(str).digest().toString("base64");
}

/** 实现了 标准 WebSocket 部分接口 */
export class WebSocket extends EventTarget implements SampleWebSocket {
  /**
   * socket 触发 wsOpen 事件后将触发 WebSocket 实例的 open 事件
   */
  constructor(socket: Duplex, option: { isOpened?: boolean } = {}) {
    super();
    this.#resolver = new WebSocketResolver(socket);

    if (option.isOpened) this.#open();
    else {
      socket.once("wsOpen", () => {
        this.#open();
        this.dispatchEvent(new Event("open"));
      });
    }
  }

  async #open(): Promise<void> {
    const iter = this.#resolver.open();
    try {
      for await (const data of iter) {
        const e = new Event("message") as any;
        e.data = typeof data === "string" ? data : data.buffer;
        this.dispatchEvent(e);
      }
    } catch (error) {
      this.dispatchEvent(new Event("error"));
    } finally {
      this.dispatchEvent(new Event("close"));
    }
  }

  #resolver: WebSocketResolver;
  readonly CONNECTING = WS_STATUS.CONNECTING;
  readonly OPEN = WS_STATUS.OPEN;
  get readyState() {
    return this.#resolver.status;
  }
  binaryType = "arrayBuffer";
  close(): void {
    if (this.readyState !== this.OPEN) return;
    this.#resolver.close();
  }
  send(data: Uint8Array) {
    this.#resolver.send(data);
  }
}
export interface WebSocket extends EventTarget, SampleWebSocket {
  addEventListener(type: "error", listener: (e: Event) => void): void;
  addEventListener(type: "close", listener: (e: Event) => void): void;
  addEventListener(type: "message", listener: (e: Event & { data: any }) => void): void;
  addEventListener(type: string, listener: (e: Event) => void): void;
}
