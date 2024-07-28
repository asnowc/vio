export * from "./tty/tty.dto.ts";
export * from "./vio_object/object.dto.ts";
export * from "./vio_object/chart/chart.dto.ts";
export * from "./vio_object/table/table.dto.ts";

import type { ServerTtyExposed, ClientTtyExposed } from "./tty/tty.dto.ts";
import type { ClientObjectExposed, ServerObjectExposed } from "./vio_object/object.dto.ts";
import type { ClientChartExposed, ServerChartExposed } from "./vio_object/chart/chart.dto.ts";
import type { ClientTableExposed, ServerTableExposed } from "./vio_object/table/table.dto.ts";

export interface VioClientExposed {
  chart: ClientChartExposed;
  table: ClientTableExposed;
  object: ClientObjectExposed;
  tty: ClientTtyExposed;
}

export interface VioServerExposed {
  table: ServerTableExposed;
  chart: ServerChartExposed;
  object: ServerObjectExposed;
  tty: ServerTtyExposed;
}
