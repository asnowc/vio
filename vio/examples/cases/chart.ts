import { Vio } from "@asla/vio";
import process from "node:process";

const indexNames = ["external", "heapUsed", "heapTotal", "rss"] as (keyof NodeJS.MemoryUsage)[];
function getMemoryChartData() {
  const data = process.memoryUsage();
  return [data.external, data.heapUsed, data.heapTotal, data.rss]; // 应与 indexNames 对应
}

/** 内存图。每两秒更新一次图 */
export async function memoryChart(vio: Vio) {
  const chart = vio.object.createChart(2, {
    name: "内存",
    meta: {
      chartType: "line", //折线图
      title: "内存", // 图表标题
      enableTimeline: true,
      requestInterval: 2000, // web 端自动请求
    },
    dimensions: [, { indexNames }], //设置 x轴的刻度名称
    updateThrottle: 1000, // 更新频率限制，单位毫秒
    onRequestUpdate: getMemoryChartData, // process.memoryUsage() 是耗时的，所以设置 onRequestUpdate() 让 web 端进行更新
  });
  return chart;
}
