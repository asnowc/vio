import type { HttpServer, ServeHandlerInfo, WebSocket } from "../lib/http_server/mod.ts";
import { Vio, Disposable } from "../vio/vio.ts";
import { Router, createRequestContext } from "./router.ts";
import { FileServerHandler } from "./static_handler.ts";
import { packageDir, runtime } from "../const.ts";
import path from "node:path";

const httpApi: typeof import("../lib/http_server/mod.ts") = await (() => {
  //@ts-ignore
  if (runtime === "deno") return Deno;
  return import("../lib/http_server/mod.ts");
})();

const DEFAULT_VIO_ASSETS_DIR = path.resolve(packageDir, "assets/web");

/**
 * 启动 vio http 服务器
 * @public
 */
export class VioHttpServer {
  constructor(
    private vio: Vio,
    opts: { vioStaticDir?: string } = {},
  ) {
    const { vioStaticDir = DEFAULT_VIO_ASSETS_DIR } = opts;
    if (vioStaticDir) this.#staticFileHandler = new FileServerHandler(vioStaticDir);

    const router = new Router();
    router.set("/api/test", function () {
      const res = { value: "ok" };
      return new Response(JSON.stringify(res));
    });
    router.set("/api/rpc", ({ request: req }) => {
      if (req.headers.get("Upgrade") !== "websocket") return new Response(undefined, { status: 400 });
      const { response, socket: websocket } = httpApi.upgradeWebSocket(req);
      this.#ontWebSocketConnect(websocket);
      return response;
    });
    this.#router = router;
  }
  #staticFileHandler?: FileServerHandler;
  #handler = async (req: Request, info: ServeHandlerInfo) => {
    const context = createRequestContext(req, info);
    const pathname = context.url.pathname;

    const handler = this.#router.get(pathname);
    if (handler) {
      return handler(context);
    }
    if (this.#staticFileHandler) {
      const response = await this.#staticFileHandler.getResponse(pathname);
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
      this.#serve = httpApi.serve({ hostname, port, onListen: () => resolve() }, this.#handler);
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
