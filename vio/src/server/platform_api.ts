import type { HttpServer, ServeHandler, ServeOptions, WebSocket } from "../lib/deno/http.ts";

type HttpApi = {
  upgradeWebSocket(request: Request): {
    socket: WebSocket;
    response: Response;
  };
  serve(option: ServeOptions, handler: ServeHandler): HttpServer;
  responseFile(opts: ResponseFileInfo): Promise<Response>;
};
function unset(...args: any[]): never {
  throw new Error("Unset http api");
}
// 根据运行时设置
export const platformApi: HttpApi = {
  upgradeWebSocket: unset,
  serve: unset,
  responseFile: unset,
};

export interface ResponseFileInfo {
  filename: string;
  size: string;
  mime?: string;
  headers?: Record<string, string>;
}
