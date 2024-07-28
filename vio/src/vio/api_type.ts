export * from "./tty/tty.dto.ts";
export * from "./vio_object/object.dto.ts";
export * from "./vio_object/chart/chart.dto.ts";

import type { ServerTtyExposed, ClientTtyExposed } from "./tty/tty.dto.ts";
import type { ClientObjectExposed, ServerObjectExposed } from "./vio_object/object.dto.ts";
import type { ClientChartExposed, ServerChartExposed } from "./vio_object/chart/chart.dto.ts";

export interface VioClientExposed {
  chart: ClientChartExposed;
  object: ClientObjectExposed;
  tty: ClientTtyExposed;
}

export interface VioServerExposed {
  chart: ServerChartExposed;
  object: ServerObjectExposed;
  tty: ServerTtyExposed;
}
