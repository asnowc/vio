import type { HttpServer, ServeHandler, ServeOptions, WebSocket } from "../lib/deno/http.ts";

export type HttpApi = {
  upgradeWebSocket(request: Request): {
    socket: WebSocket;
    response: Response;
  };
  serve(option: ServeOptions, handler: ServeHandler): HttpServer;
  responseFileHandler: ResponseFileHandler;
};
function unset(...args: any[]): never {
  throw new Error("Unset http api");
}
// 根据运行时设置
export const platformApi: HttpApi = {
  upgradeWebSocket: unset,
  serve: unset,
  responseFileHandler: { getResponse: unset, noCache: true },
};
export interface ResponseFileHandler {
  getResponse(
    filename: string,
    requestHeader: Headers,
    responseHeaderInit: Record<string, string>,
  ): Promise<Response | null> | Response | null;
  noCache: boolean;
}
