import { STATUS_CODES } from "node:http";
import { Buffer } from "node:buffer";
const badRequestResponse = Buffer.from(`HTTP/1.1 400 ${STATUS_CODES[400]}\r\n` + "Connection: close\r\n\r\n", "ascii");
const requestTimeoutResponse = Buffer.from(
  `HTTP/1.1 408 ${STATUS_CODES[408]}\r\n` + "Connection: close\r\n\r\n",
  "ascii",
);
const requestHeaderFieldsTooLargeResponse = Buffer.from(
  `HTTP/1.1 431 ${STATUS_CODES[431]}\r\n` + "Connection: close\r\n\r\n",
  "ascii",
);
const requestChunkExtensionsTooLargeResponse = Buffer.from(
  `HTTP/1.1 413 ${STATUS_CODES[413]}\r\n` + "Connection: close\r\n\r\n",
  "ascii",
);
