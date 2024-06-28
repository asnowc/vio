import { IncomingMessage, ServerResponse, createServer, STATUS_CODES } from "node:http";
import type { Duplex } from "node:stream";
import { Buffer } from "node:buffer";
import { createHttpResHeaderFrame } from "../http/http_frame.ts";
import {
  genUrl,
  nodeReqToInfo,
  nodeReqToWebReqInit,
  nodeReqToWebRequest,
  processResponse,
} from "./node_http_transf.ts";
import { WebSocket, genResponseWsHeader } from "../websocket/websocket.ts";
import { genErrorInfo } from "../../parse_error.ts";
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
  #onInternalReq = async (req: IncomingMessage, resp: ServerResponse) => {
    const request = nodeReqToWebRequest(req, this.addr.hostname);
    const info = nodeReqToInfo(req);
    try {
      const response = await this.#onRequest(request, info);
      processResponse(response, resp, response.body);
    } catch (error) {
      let info = genInternalError(error);
      resp.writeHead(info.status, undefined, info.headers);
      resp.write(info.body);
      resp.end();
    }
  };
  #onUpgrade = async (req: IncomingMessage, socket: Duplex, buffer: Buffer) => {
    const request = new UpgRequest(socket, genUrl(req, this.addr.hostname), nodeReqToWebReqInit(req));
    const info = nodeReqToInfo(req);
    let response: Response;
    try {
      response = await this.#onRequest(request, info);
      const headerInfo = {
        status: response.status,
        statusText: response.statusText,
        version: "1.1",
        headers: response.headers,
      };
      const frameHeader = createHttpResHeaderFrame(headerInfo);
      socket.write(frameHeader);
      if (response.status !== 101) {
        socket.end();
      }
    } catch (error) {
      const { body, headers, status } = genInternalError(error);

      const frameHeader = createHttpResHeaderFrame({
        status: status,
        statusText: STATUS_CODES[status] ?? "",
        version: "1.1",
        headers,
      });
      socket.write(frameHeader);
      socket.write(body);
      socket.end();
    }
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

function genInternalError(err: any) {
  const info = JSON.stringify(genErrorInfo(err));
  const buf = Buffer.from(info);
  return {
    status: 500,
    body: buf,
    headers: { "content-length": buf.length.toString(), "content-type": "application/json" },
  };
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
