import { IncomingMessage, ServerResponse, createServer, STATUS_CODES } from "node:http";
import https from "node:https";
import type { Duplex } from "node:stream";
import { Buffer } from "node:buffer";
import { createHttpResHeaderFrame } from "../http_server/http/http_frame.ts";
import { genUrl, nodeReqToInfo, nodeReqToWebReqInit } from "./node_http_transf.ts";
import { WebSocket, genResponseWsHeader } from "../websocket.ts";
import { genErrorInfo } from "../parse_error.ts";
import type {
  NetAddr,
  ServeHandler,
  ServeHandlerInfo,
  ServeOptions,
  HttpServer as DenoHttpServer,
  TlsCertifiedKeyPem,
} from "./type.ts";
import { nodeHttpReqToRequest, responsePipeToNodeRes } from "@eavid/lib-node/http";
import { withPromise } from "evlib";

/** @public */
export class HttpServer implements DenoHttpServer {
  static listen(server: HttpServer) {
    server.#server.listen({ port: server.addr.port, host: server.addr.hostname });
  }
  #onInternalReq = async (req: IncomingMessage, resp: ServerResponse) => {
    const request = nodeHttpReqToRequest(req);
    const info = nodeReqToInfo(req);
    try {
      const response = await this.#onRequest(request, info);
      responsePipeToNodeRes(response, resp, response.body);
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
    const tlsConfig = opts as Partial<TlsCertifiedKeyPem>;
    if (tlsConfig.cert && tlsConfig.key) {
      this.#server = https.createServer({ key: tlsConfig.key, cert: tlsConfig.cert }, this.#onInternalReq);
    } else {
      this.#server = createServer(this.#onInternalReq);
    }
    const { hostname = "localhost", port = 80, onListen = defaultOnListen, onError } = opts;
    if (onRequest) this.#onRequest = onRequest;
    this.#closeCall.promise;
    this.#server.once("close", () => {
      this.#closeCall.resolve();
    });
    this.#server.on("upgrade", this.#onUpgrade);
    this.#server.on("listening", () => onListen(this.addr));
    onError && this.#server.on("error", onError);

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
  #closeCall = withPromise<void>();
  #closing = false;

  shutdown(): Promise<void> {
    if (this.#closing) return this.finished;
    this.#server.close();
    this.#server.closeAllConnections();
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
type RequestInit = NonNullable<ConstructorParameters<typeof Request>[1]>;
class UpgRequest extends Request {
  static upgradeWebSocket(req: UpgRequest): { socket: WebSocket; response: Response } {
    const ws = new WebSocket(req.#socket);
    const response = new UpgResponse(
      new ReadableStream({
        pull: (ctrl) => {
          req.#socket.emit("wsOpen");
          return ctrl.close();
        },
      }),
      {
        status: 101,
        headers: genResponseWsHeader(req.headers.get("sec-websocket-key")!),
      },
    );
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
