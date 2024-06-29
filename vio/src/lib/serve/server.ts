import { ServeOptions, ServeHandler } from "./type.ts";
import { HttpServer } from "./HttpServer.ts";

export function serve(handler: ServeHandler): HttpServer;
export function serve(opts: ServeOptions, handler: ServeHandler): HttpServer;
export function serve(handler_opts: ServeHandler | ServeOptions, handler?: ServeHandler) {
  let serve: HttpServer;
  if (typeof handler_opts === "function") serve = new HttpServer(handler_opts);
  else serve = new HttpServer(handler, handler_opts);
  HttpServer.listen(serve);
  return serve;
}
