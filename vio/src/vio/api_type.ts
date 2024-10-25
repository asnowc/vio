export * from "./tty/tty.dto.ts";
export * from "./vio_object/object.dto.ts";

import type { ServerTtyExposed, ClientTtyExposed } from "./tty/tty.dto.ts";
import type { ClientObjectExposed, ServerObjectExposed } from "./vio_object/object.dto.ts";

export interface VioClientExposed {
  readonly object: ClientObjectExposed;
  readonly tty: ClientTtyExposed;
}

export interface VioServerExposed {
  readonly object: ServerObjectExposed;
  readonly tty: ServerTtyExposed;
}
