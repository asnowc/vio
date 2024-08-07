import type { ClientObjectBaseExposed, ServerObjectBaseExposed } from "./_object_base.dto.ts";
import type { ClientTableExposed, ServerTableExposed } from "./table/table.dto.ts";
import type { ClientChartExposed, ServerChartExposed } from "./chart/chart.dto.ts";
import type { ServerStepRunnerExposed, ClientStepRunnerExposed } from "./step_runner/step_run.dto.ts";

export * from "./_object_base.dto.ts";
export * from "./chart/chart.dto.ts";
export * from "./table/table.dto.ts";
export * from "./step_runner/step_run.dto.ts";

export type ServerObjectExposed = ServerObjectBaseExposed &
  ServerChartExposed &
  ServerTableExposed &
  ServerStepRunnerExposed;
export type ClientObjectExposed = ClientObjectBaseExposed &
  ClientChartExposed &
  ClientTableExposed &
  ClientStepRunnerExposed;
