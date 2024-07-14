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
  /** 自定义处理静态资源请求。如果设置了这个处理函数，将忽略 vioStaticDir 和 staticSetHeaders */
  staticHandler?: (request: Request) => Response | undefined | Promise<Response | undefined>;
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
    let { vioStaticDir, staticSetHeaders, staticHandler } = opts;
    if (!vioStaticDir && packageDir) {
      vioStaticDir = path.resolve(packageDir, "assets/web");
    }
    if (staticHandler) {
      this.#staticHandler = staticHandler;
    } else if (vioStaticDir) {
      const staticHandler = new FileServerHandler(vioStaticDir, { setHeaders: staticSetHeaders });
      this.#staticHandler = (request) => {
        return staticHandler.getResponse(new URL(request.url).pathname, request.headers);
      };
    }

    const router = new Router();
    router.set("/api/test", function () {
      const res = { value: "ok" };
      return new Response(JSON.stringify(res));
    });
    router.set("/api/rpc", ({ request: req }) => {
      if (req.headers.get("Upgrade") !== "websocket") return new Response(undefined, { status: 400 });
      const { response, socket: websocket } = platformApi.upgradeWebSocket(req);
      this.#ontWebSocketConnect(websocket);
      return response;
    });
    this.#router = router;
  }
  #staticHandler: VioHttpServerOption["staticHandler"];
  #handler = async (req: Request, info: ServeHandlerInfo) => {
    const context = createRequestContext(req, info);
    const pathname = context.url.pathname;

    const handler = this.#router.get(pathname);
    if (handler) {
      return handler(context);
    }
    if (this.#staticHandler) {
      const response = await this.#staticHandler(req);
      if (response) return response;
    }
    return new Response(null, { status: 404 });
  };
  #serve?: HttpServer;

  #router: Router;
  async #ontWebSocketConnect(ws: WebSocket): Promise<Disposable> {
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
