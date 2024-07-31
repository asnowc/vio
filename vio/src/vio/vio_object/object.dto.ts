import type { ClientObjectBaseExposed, ServerObjectBaseExposed } from "./_object_base.dto.ts";
import type { ClientTableExposed, ServerTableExposed } from "./table/table.dto.ts";
import type { ClientChartExposed, ServerChartExposed } from "./chart/chart.dto.ts";

export * from "./_object_base.dto.ts";
export * from "./chart/chart.dto.ts";
export * from "./table/table.dto.ts";

export type ServerObjectExposed = ServerObjectBaseExposed & ServerChartExposed & ServerTableExposed;
export type ClientObjectExposed = ClientObjectBaseExposed & ClientChartExposed & ClientTableExposed;
