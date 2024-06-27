import { ReadableStream, TextDecoderStream } from "node:stream/web";
import { STATUS_CODES } from "node:http";

interface HttpReqHeader {
  method: string;
  path: string;
  version: string;
  headers: Record<string, string>;
  contentLength: number;
}
interface BodyReader {
  getBodyStream(): ReadableStream<Uint8Array>;
}

const textDecoder = new TextDecoder();

type BinLink = {
  data: Uint8Array;
  next?: BinLink;
};
class HttpHeaderParser {
  private headers: string[] = [];
  private binLink?: BinLink;
  private head?: BinLink;
  /** 当前已接收字段的字节长度 */
  private byteSize: number = 0;
  private isR = false;
  next(buf: Uint8Array) {
    for (let i = 0; i < buf.byteLength; i++) {
      if (buf[i] === 13) this.isR = true;
      else if (this.isR) {
        // \r ==13 \n ==10
        if (buf[i] === 10) {
          const byteSize = this.byteSize + i + 1;
          let { head, binLink } = this;
          this.binLink = undefined;
          this.head = undefined;
          this.byteSize = 0;

          const nextChunk = { data: buf.subarray(0, i + 1) };
          if (!head) head = nextChunk;
          else binLink!.next = nextChunk;

          if (byteSize === 2) {
            //请求头结束
            const headersRaw = this.headers;
            this.headers = [];
            return { res: buf.subarray(i + 1), headersRaw };
          } else {
            const textBuf = concatBufLink(head, byteSize).subarray(0, byteSize - 2);
            this.headers.push(textDecoder.decode(textBuf));
          }
        }
        this.isR = false;
      }
    }
  }
}
function parseReqHeader(headerRaw: string[]): HttpReqHeader {
  const headersMap: Record<string, string> = {};
  for (let i = 1; i < headerRaw.length; i++) {
    const kv = headerRaw[i].split(":");
    headersMap[kv[0]] = kv[1];
  }
  const info: string[] = [];
  let first = headerRaw[0];
  for (let i = 0; i < 2; i++) {
    let index = first.indexOf(" ");
    if (index <= 0) throw new Error("");
    info[i] = first.slice(0, index);
    first = first.slice(index + 1);
  }

  let contentLength = parseInt(headersMap["content-length"]);
  if (!(contentLength >= 0)) contentLength = 0;
  return { contentLength, method: info[0], path: info[1], version: first, headers: headersMap };
}

function concatBufLink(link: BinLink, size: number) {
  if (!link.next) return link.data;
  const buf = new Uint8Array(size);

  let offset = 0;
  do {
    buf.set(link.data);
    offset += link.data.byteLength;
    link = link.next!;
  } while (link);
  return buf;
}
