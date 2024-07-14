## 创建图与更新图

以显示 node 进程内存的图表为例子：

```ts
import vio, { Vio } from "@asla/vio";
import process from "node:process";

const indexNames = ["external", "heapUsed", "heapTotal", "rss"];
function getMemoryChartData() {
  const data = process.memoryUsage();
  return [data.external, data.heapUsed, data.heapTotal, data.rss]; // 应与 indexNames 对应
}

const chart = vio.chart.create(2, {
  meta: {
    chartType: "line", //折线图
    title: "内存", // 图表标题
    enableTimeline: true, // 启用时间线。web端会将 x 轴映射为时间轴
  },
  dimensions: [, { indexNames }], //设置 x轴的刻度名称
});

setInterval(() => {
  chart.updateData(getMemoryChartData()); // 每秒更新一次图的数据
}, 1000);
vio.chart.dispose(chart); // 如果不再使用，应销毁
```

#### 被动更新

有时候，我们不想在没有连接的时候去更新图的数据，因为获取图的数据可能是非常耗费性能的，我们可以让客户端决定何时更新图的数据

```ts
const chart = vio.chart.create(2, {
  meta: {
    chartType: "line",
    title: "内存",
    enableTimeline: true,
    requestInterval: 2000, // 当 web 端连接并打开这个图的面板后，每2秒向服务器请求一次更新
  },
  dimensions: [, { indexNames }],
  updateThrottle: 1000, // 更新频率限制，单位毫秒. 例如当多个web端同时请求时，将返回上次更新的值。
  onRequestUpdate: getMemoryChartData, // 当 web端请求更新的时候，会调用该函数
});
```

### ChartMeta

web 终端根据 ChartMeta 来显示不同类型的图，以及图行为。ChartMeta 可以在 web 终端临时更改。 不同的 chartType 有不同的设置。

### 维度信息

维度信息，其接口为：

```ts
interface DimensionInfo {
  /** 维度名称 */
  name?: string;
  /** 维度单位 */
  unitName?: string;
  indexNames?: string[]; // 轴的刻度名称
}
```

一般情况下，数值轴的0维刻度名称会被忽略不显示。

饼图、仪表盘是一维图, 0维的刻度对应Y轴刻度

折线图、柱状图、三点图是二维图，0维的刻度对应Y轴刻度，1维刻度对应 X 轴刻度。开启时间轴变成三维图，X轴会变成时间轴，1维刻度对应图的系列。

```ts
const meta = { chartType: "line" };
const dimensions = {
  0: {
    name: "Y",
    unitName: "Byte",
  },
  1: {
    name: "X", // 维度名称（坐标轴名称）
    indexNames: ["external", "heapUsed", "heapTotal", "rss"],
  },
};
const chart = vio.chart.create(2, {
  meta,
  dimensions: dimensions, //设置 维度信息
});
```
