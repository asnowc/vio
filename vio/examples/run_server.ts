import vio, { Vio, VioHttpServer } from "@asla/vio";
import { inputSelect } from "./cases/action.ts";
import { intervalOutput } from "./cases/output.ts";
import { memoryChart } from "./cases/chart.ts";
import { appendTable } from "./cases/table.ts";
export async function startDefaultServer(vio: Vio, port: number = 8887, hostname: string = "127.0.0.1") {
  intervalOutput(vio.tty.get(0));
  inputSelect(vio.tty.get(1));
  memoryChart(vio);
  appendTable(vio);

  const server = new VioHttpServer(vio);
  await server.listen(port, hostname);
  console.log(`server listened ${hostname}:${port}`);

  return server;
}
const server = await startDefaultServer(vio);
