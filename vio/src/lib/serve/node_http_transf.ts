//@deno-ignore

import { IncomingMessage } from "node:http";
import { ReadableStream } from "node:stream/web";
import { readableToReadableStream } from "@eavid/lib-node/stream";
import { ServeHandlerInfo } from "./type.ts";

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

export function nodeReqToInfo(req: IncomingMessage): ServeHandlerInfo {
  return {
    remoteAddr: { hostname: req.socket.remoteAddress!, port: req.socket.remotePort!, transport: "tcp" },
  };
}
