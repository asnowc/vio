/** @public */
export type ServeHandler = (request: Request, info: ServeHandlerInfo) => Response | Promise<Response>;

/** Additional information for an HTTP request and its connection.
 *
 * @public
 */
export interface ServeHandlerInfo {
  /** The remote address of the connection. */
  remoteAddr: NetAddr;
}
/** @public   */
export interface NetAddr {
  transport: "tcp" | "udp";
  hostname: string;
  port: number;
}
/** @public */
export type ServeOptions = ServeTcpOption | (ServeTcpOption & TlsCertifiedKeyPem);
/** @public */
export interface ServeTcpOption {
  port?: number;

  /** A literal IP address or host name that can be resolved to an IP address.
   *
   * __Note about `0.0.0.0`__ While listening `0.0.0.0` works on all platforms,
   * the browsers on Windows don't work with the address `0.0.0.0`.
   * You should show the message like `server running on localhost:8080` instead of
   * `server running on 0.0.0.0:8080` if your program supports Windows.
   *  */
  hostname?: string;

  /** The handler to invoke when route handlers throw an error. */
  onError?: (error: unknown) => Response | Promise<Response>;

  /** The callback which is called when the server starts listening. */
  onListen?: (localAddr: NetAddr) => void;
}
/** @public */
export interface TlsCertifiedKeyPem {
  /** The format of this key material, which must be PEM. */
  keyFormat?: "pem";
  /** Private key in `PEM` format. RSA, EC, and PKCS8-format keys are supported. */
  key: string;
  /** Certificate chain in `PEM` format. */
  cert: string;
}

/** @public */
export interface HttpServer {
  readonly addr: NetAddr;
  finished: Promise<void>;
  shutdown(): Promise<void>;
  ref(): void;
  unref(): void;
}

type MessageEvent = Event & { data: any };
export interface WebSocket extends EventTarget {
  readonly CONNECTING: number;
  readonly OPEN: number;
  readyState: number;
  binaryType: string;
  close(): void;
  send(data: Uint8Array): void;

  addEventListener(type: "open", listener: (e: Event) => void): void;
  addEventListener(type: "error", listener: (e: Event) => void): void;
  addEventListener(type: "close", listener: (e: Event) => void): void;
  addEventListener(type: "message", listener: (e: MessageEvent) => void): void;
  addEventListener(type: string, listener: (e: Event) => void): void;
}
