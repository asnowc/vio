import { IncomingMessage, ServerResponse } from "node:http";
import { ReadableStream, TransformStream } from "node:stream/web";
import { ServeHandlerInfo } from "./server.ts";
import { readableToReadableStream, writableToWritableStream } from "@eavid/lib-node/stream";

export function nodeReqToWebRequest(req: IncomingMessage, defaultUrl: string): Request {
  return new Request(genUrl(req, defaultUrl), nodeReqToWebReqInit(req));
}
export function genUrl(req: IncomingMessage, defaultUrl: string) {
  if (req.headers.origin) {
    return req.headers.origin + req.url;
  }
  return "http://" + defaultUrl + req.url!;
}
export function nodeReqToWebReqInit(req: IncomingMessage): RequestInit {
  let body: ReadableStream<Uint8Array> | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") body = readableToReadableStream(req);
  const headers: Record<string, string | string[]> = req.headers as any;
  return { method: req.method!, body, headers };
}

export function processResponse(response: Response, resp: ServerResponse): void;
export function processResponse(
  response: Response,
  resp: ServerResponse,
  body: ReadableStream<Uint8Array>,
): Promise<void>;
export function processResponse(
  response: Response,
  resp: ServerResponse,
  body?: ReadableStream<Uint8Array> | null,
): void | Promise<void>;
export function processResponse(response: Response, resp: ServerResponse, body?: ReadableStream<Uint8Array> | null) {
  let headers: Record<string, string | string> = {};
  for (const item of response.headers) {
    headers[item[0]] = item[1];
  }
  resp.writeHead(response.status, response.statusText, headers);
  if (body) {
    const writable = writableToWritableStream(resp);
    return body.pipeTo(writable);
  } else resp.end();
}
export function nodeReqToInfo(req: IncomingMessage): ServeHandlerInfo {
  return {
    remoteAddr: { hostname: req.socket.remoteAddress!, port: req.socket.remotePort!, transport: "tcp" },
  };
}
