import { Vio } from "@asnc/vio";
import process from "node:process";
/** 内存图。每两秒更新一次图 */
export async function memoryChart(vio: Vio) {
  const indexNames = ["external", "heapUsed", "heapTotal", "rss"] as (keyof NodeJS.MemoryUsage)[];
  const chart = vio.chart.create(2, {
    meta: { chartType: "line", title: "内存", min: 0, max: 4 * 1024, unit: "MB" },
    dimensionIndexNames: [, indexNames],
  });
  const id = setInterval(() => {
    const data = process.memoryUsage();
    chart.updateData(indexNames.map((key) => data[key] / 1024 / 1024));
  }, 2000);
  return () => clearInterval(id);
}
