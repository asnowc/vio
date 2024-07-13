import type { ServeHandlerInfo } from "../lib/deno/http.ts";

export function createRequestContext(req: Request, info: ServeHandlerInfo): RequestContext {
  const url = new URL(req.url);
  return { request: req, url };
}
export type RequestHandler = (context: RequestContext) => Response | Promise<Response>;
export interface RequestContext {
  request: Request;
  url: URL;
}

export class Router {
  constructor() {}
  private routers: Record<string, RequestHandler> = {};
  set(path: string, handler: RequestHandler) {
    this.routers[path] = handler;

    return this;
  }
  get(path: string): RequestHandler | undefined {
    return this.routers[path];
  }
}
