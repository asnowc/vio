/**
 */
export function createHttpReqHeaderFrame(headerInfo: ReqHeader) {
  let str = `${headerInfo.method} ${headerInfo.path} HTTP/${headerInfo.version}\r\n`;
  if (headerInfo.headers) str += headerToStr(headerInfo.headers);
  str += "\r\n";
  return str;
}

export function createHttpResHeaderFrame(headerInfo: ResHeader) {
  let statusText = headerInfo.statusText;
  if (!statusText) statusText = HTTP_STATUS_TEXT_MAP[headerInfo.status] ?? "Unknown";
  let str = `HTTP/${headerInfo.version} ${headerInfo.status} ${statusText} \r\n`;
  if (headerInfo.headers) str += headerToStr(headerInfo.headers);
  str += "\r\n";
  return str;
}
const HTTP_STATUS_TEXT_MAP: Record<number, string> = {
  200: "OK",
};

function headerToStr(headers: HeadersType) {
  let str = "";
  for (const [key, val] of headers instanceof Headers ? headers : Object.entries(headers)) {
    str += key + ":" + val + "\r\n";
  }
  return str;
}
type HeadersType = Record<string, string | number | undefined | null> | Headers;
type HeaderCommon = {
  version: string;
  headers?: HeadersType;
};
export type ReqHeader = HeaderCommon & {
  path: string;
  method: string;
};
export type ResHeader = HeaderCommon & {
  status: number;
  statusText: string;
};
