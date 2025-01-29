import type { WebSocket } from "../lib/deno/http.ts";
import { Vio, Disposable } from "../vio/vio.ts";
import { Router, createRequestContext } from "./router.ts";
import { FileServerHandler } from "./static_handler.ts";
import { packageDir } from "../const.ts";
import path from "node:path";
import { HttpServer, ServeHandlerInfo } from "../lib/deno/http.ts";
import { platformApi } from "./platform_api.ts";
/**
 * @public
 */
export interface VioHttpServerOption {
  /** web 静态资源目录 */
  vioStaticDir?: string;
  /** 覆盖静态资源响应头 */
  staticSetHeaders?: Record<string, string>;
  /** 自定义处理请求。请求处理在 api 之后，静态文件服务器之前。  */
  requestHandler?: (request: Request) => Response | undefined | Promise<Response | undefined>;
  /** web终端前端配置 */
  frontendConfig?: object;
  /** RPC 连接鉴权. 如果不通过，应抛出异常 */
  rpcAuthenticate?(request: Request): Promise<unknown> | void;
}
/**
 * vio http 服务器
 * @public
 */
export class VioHttpServer {
  constructor(
    private vio: Vio,
    opts: VioHttpServerOption = {},
  ) {
    let { vioStaticDir, staticSetHeaders, requestHandler, rpcAuthenticate } = opts;
    if (!vioStaticDir && packageDir) {
      vioStaticDir = path.resolve(packageDir, "assets/web");
    }
    if (requestHandler) {
      this.#customHandler = requestHandler;
    }
    if (vioStaticDir) {
      this.#fileServerHandler = new FileServerHandler(vioStaticDir, { setHeaders: staticSetHeaders });
    }
    if (opts.frontendConfig) {
      this.#frontendConfig = Response.json(opts.frontendConfig);
    }
    if (typeof rpcAuthenticate === "function") this.#rpcAuthenticate = rpcAuthenticate;

    const router = new Router();
    router.set("/api/test", function () {
      return Response.json({ value: "ok" });
    });
    router.set("/api/rpc", async ({ request: req }) => {
      if (req.headers.get("Upgrade") !== "websocket") return new Response(undefined, { status: 400 });
      if (this.#rpcAuthenticate) {
        try {
          await this.#rpcAuthenticate(req);
        } catch (error) {
          return new Response(null, { status: 403 });
        }
      }

      const { response, socket: websocket } = platformApi.upgradeWebSocket(req);
      this.#onWebSocketConnect(websocket);
      return response;
    });
    this.#router = router;
    this.#rpcAuthenticate;
  }

  #customHandler: VioHttpServerOption["requestHandler"];
  #fileServerHandler?: FileServerHandler;
  #frontendConfig?: Response;
  #handler = async (req: Request, info: ServeHandlerInfo) => {
    const context = createRequestContext(req, info);
    const pathname = context.url.pathname;

    if (pathname.startsWith("/api")) {
      const handler = this.#router.get(pathname);
      if (handler) {
        return handler(context);
      }
      return new Response(null, { status: 404 });
    }
    if (pathname === "/config.json" && this.#frontendConfig) {
      return this.#frontendConfig;
    }
    if (this.#customHandler) {
      const response = await this.#customHandler(req);
      if (response) return response;
    }
    if (this.#fileServerHandler) {
      const response = await this.#fileServerHandler.getResponse(pathname, req.headers);
      if (response) return response;
    }
    return new Response(null, { status: 404 });
  };
  #serve?: HttpServer;

  #router: Router;

  #rpcAuthenticate?: (request: Request) => Promise<unknown> | void;
  async #onWebSocketConnect(ws: WebSocket): Promise<Disposable> {
    if (!this.#serve) throw new Error("unable connect");
    if (ws.readyState === ws.CONNECTING) {
      let listener: (...args: any[]) => void;
      await new Promise<any>((resolve) => {
        ws.addEventListener("open", resolve);
        ws.addEventListener("error", resolve);
        listener = resolve;
      }).finally(() => {
        ws.removeEventListener("open", listener!);
        ws.removeEventListener("error", listener!);
      });
    } else if (ws.readyState !== ws.OPEN) {
      throw new Error("Wrong websocket state");
    }
    const dispose = this.vio.joinFormWebsocket(ws, (viewer) => {
      this.#connected.delete(viewer);
    });
    this.#connected.add(dispose);
    return dispose;
  }
  #connected = new Set<Disposable>();
  close(): Promise<void> {
    for (const item of this.#connected) {
      item.dispose();
    }
    this.#connected.clear();
    if (!this.#serve) return Promise.resolve();
    return this.#serve.shutdown();
  }
  listen(port?: number, hostname?: string): Promise<void> {
    if (this.#serve) throw new Error("");
    return new Promise<void>((resolve) => {
      this.#serve = platformApi.serve({ hostname, port, onListen: () => resolve() }, this.#handler);
      if (!this.#ref) this.#serve.unref();
    });
  }
  #ref = true;
  ref() {
    this.#serve?.ref();
    this.#ref = true;
  }
  unref() {
    this.#serve?.unref();
    this.#ref = false;
  }
}
