import { IncomingMessage, ServerResponse, createServer, STATUS_CODES } from "node:http";
import type { Duplex } from "node:stream";
import type { Buffer } from "node:buffer";
import { createHttpResHeaderFrame } from "../http/http_frame.ts";
import {
  genUrl,
  nodeReqToInfo,
  nodeReqToWebReqInit,
  nodeReqToWebRequest,
  processResponse,
} from "./node_http_transf.ts";
import { WebSocket, genResponseWsHeader } from "../websocket/websocket.ts";
import { ReadableStream } from "node:stream/web";
function withResolvers<T>(): PromiseWithResolvers<T> {
  let obj: PromiseWithResolvers<any> = {} as any;
  obj.promise = new Promise(function (resolve, reject) {
    obj.resolve = resolve;
    obj.reject = reject;
  });
  return obj;
}
/** @public */
export class HttpServer {
  static listen(server: HttpServer) {
    server.#server.listen({ port: server.addr.port, host: server.addr.hostname });
  }
  async #writeResponse(socket: Duplex, response: Response) {
    let { headers, body } = response;
    let bodyList: Uint8Array[] | undefined;
    if (body && !headers.has("content-length")) {
      headers = new Headers(headers);
      bodyList = [];
      let contentLength = 0;
      for await (const chunk of body as ReadableStream<Uint8Array>) {
        bodyList.push(chunk);
        contentLength += chunk.byteLength;
      }
      headers.set("content-length", contentLength.toString());
    }
    const headerInfo = {
      status: response.status,
      statusText: response.statusText,
      version: "1.1",
      headers,
    };
    const frameHeader = createHttpResHeaderFrame(headerInfo);
    socket.write(frameHeader);
    if (bodyList) {
      for (const chunk of bodyList) {
        socket.write(chunk);
      }
    } else if (body) {
      for await (const chunk of body) {
        socket.write(chunk);
      }
    }
  }
  #onInternalReq = async (req: IncomingMessage, resp: ServerResponse) => {
    const request = nodeReqToWebRequest(req, this.addr.hostname);
    const info = nodeReqToInfo(req);
    let response: Response;
    try {
      response = await this.#onRequest(request, info);
    } catch (error) {
      resp.writeHead(500);
      resp.end();
      return;
    }
    processResponse(response, resp, response.body);
  };
  #onUpgrade = async (req: IncomingMessage, socket: Duplex, buffer: Buffer) => {
    const request = new UpgRequest(socket, genUrl(req, this.addr.hostname), nodeReqToWebReqInit(req));
    const info = nodeReqToInfo(req);
    let response: Response;
    try {
      response = await this.#onRequest(request, info);
    } catch (error) {
      const headerInfo = { status: 500, statusText: STATUS_CODES[500] ?? "", version: "1.1" };
      const frameHeader = createHttpResHeaderFrame(headerInfo);
      socket.write(frameHeader);
      return;
    }
    const headerInfo = {
      status: 101, // 必须是 101， nodejs 不会处理101 以外的响应
      statusText: response.statusText,
      version: "1.1",
      headers: response.headers,
    };
    const frameHeader = createHttpResHeaderFrame(headerInfo);
    socket.write(frameHeader);
  };
  #server = createServer(this.#onInternalReq);
  #onRequest: ServeHandler = function (req: Request, info: ServeHandlerInfo): Promise<Response> | Response {
    return new Response(undefined, { status: 404 });
  };
  constructor(onRequest?: ServeHandler, opts: ServeOptions = {}) {
    const defaultOnListen = (addr: NetAddr) => {
      console.log(`Listening on http://${addr.hostname}:${addr.port}`);
    };
    const { hostname = "localhost", port = 80, onListen = defaultOnListen, onError, signal, reusePort } = opts;
    if (onRequest) this.#onRequest = onRequest;
    this.#closeCall.promise;
    this.#server.once("close", () => {
      this.#closeCall.resolve();
    });
    this.#server.on("upgrade", this.#onUpgrade);
    this.#server.on("listening", () => onListen(this.addr));
    onError && this.#server.on("error", onError);
    if (signal) {
      //TODO: signal、onError
    }

    this.addr = {
      hostname,
      port,
      transport: "tcp",
    };
    Object.freeze(this.addr);
  }
  readonly addr: NetAddr;
  get finished(): Promise<void> {
    return this.#closeCall.promise;
  }
  #closeCall = withResolvers<void>();
  #closing = false;

  shutdown(): Promise<void> {
    if (this.#closing) return this.finished;
    this.#server.close();
    return this.finished;
  }

  ref() {
    this.#server.ref();
  }
  unref() {
    this.#server.unref();
  }
}
export function upgradeWebSocket(request: Request) {
  if (request instanceof UpgRequest) return UpgRequest.upgradeWebSocket(request);
  else throw new Error("");
}
class UpgRequest extends Request {
  static upgradeWebSocket(req: UpgRequest): { socket: WebSocket; response: Response } {
    const ws = new WebSocket(req.#socket, { openEvent: true });
    const response = new UpgResponse(undefined, {
      status: 101,
      headers: genResponseWsHeader(req.headers.get("sec-websocket-key")!),
    });
    return { socket: ws, response };
  }
  constructor(socket: Duplex, url: string, init?: RequestInit) {
    super(url, init);
    this.#socket = socket;
  }
  #socket: Duplex;
}
/**
 * web 环境和node环境的Response.status 不能小于200
 */
class UpgResponse extends Response {
  constructor(...args: ConstructorParameters<typeof Response>) {
    const status = args[1]?.status;
    const changeStatus = status && status < 200 && status % 1 === 0;
    super(args[0], { ...args[1], status: changeStatus ? 200 : status });
    if (changeStatus)
      Reflect.defineProperty(this, "status", { value: status, configurable: false, writable: false, enumerable: true });
  }
}

/** @public */
export type ServeHandler = (request: Request, info: ServeHandlerInfo) => Response | Promise<Response>;

/** Additional information for an HTTP request and its connection.
 *
 * @public
 */
export interface ServeHandlerInfo {
  /** The remote address of the connection. */
  remoteAddr: NetAddr;
}
/** @public   */
export interface NetAddr {
  transport: "tcp" | "udp";
  hostname: string;
  port: number;
}
export interface ServeOptions {
  /** The port to listen on.
   *
   * @default {8000} */
  port?: number;

  /** A literal IP address or host name that can be resolved to an IP address.
   *
   * __Note about `0.0.0.0`__ While listening `0.0.0.0` works on all platforms,
   * the browsers on Windows don't work with the address `0.0.0.0`.
   * You should show the message like `server running on localhost:8080` instead of
   * `server running on 0.0.0.0:8080` if your program supports Windows.
   *
   * @default {"0.0.0.0"} */
  hostname?: string;

  /** An {@linkcode AbortSignal} to close the server and all connections. */
  signal?: AbortSignal;

  /** Sets `SO_REUSEPORT` on POSIX systems. */
  reusePort?: boolean;

  /** The handler to invoke when route handlers throw an error. */
  onError?: (error: unknown) => Response | Promise<Response>;

  /** The callback which is called when the server starts listening. */
  onListen?: (localAddr: NetAddr) => void;
}
