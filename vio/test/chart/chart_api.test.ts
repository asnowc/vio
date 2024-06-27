import { expect } from "vitest";
import { connectWebsocket } from "../../src/lib/http_server/mod.ts";
import { CreateChartOpts } from "@asnc/vio";
import { ChartUpdateData, ChartInfo, ChartCreateInfo, VioServerExposed } from "../../src/client.ts";
import { createWebSocketCpc } from "cpcall/web";
import { afterTime } from "evlib";
import { vioServerTest as test } from "../_env/test_port.ts";

test("flow", async function ({ vio, connector }) {
  const { cpc, clientApi } = connector;
  const caller = cpc.genCaller<VioServerExposed>();
  let allCharts = await caller.getCharts(); //客户端获取所有图信息
  expect(allCharts).toEqual({ list: [] });

  const config: CreateChartOpts = { meta: { chartType: "progress" }, maxCacheSize: 20 };
  const chart = vio.chart.create<number>(1, config); //创建
  expect(chart).toMatchObject(config);
  expect(chart.dimension).toBe(1);

  allCharts = await caller.getCharts();
  expect(allCharts).toEqual({
    list: [{ id: chart.id, dimension: chart.dimension, meta: config.meta!, cacheData: [], dimensionIndexNames: [[]] }],
  } satisfies typeof allCharts);

  expect(clientApi.createChart).toBeCalledWith({
    meta: config.meta!,
    dimension: chart.dimension,
    id: chart.id,
    dimensionIndexNames: [[]],
  } satisfies ChartCreateInfo);

  vio.chart.disposeChart(chart); //删除
  await afterTime(50);
  expect(clientApi.deleteChart).toBeCalledWith(chart.id);

  vio.chart.disposeChart(chart); //重复删除
  expect(clientApi.deleteChart).toBeCalledTimes(1);
});
test("update", async function ({ vio, connector }) {
  const { cpc, clientApi } = connector;
  const caller = cpc.genCaller<VioServerExposed>();

  const config: CreateChartOpts = { maxCacheSize: 20 };
  const chart = vio.chart.create<number>(1, config); //创建

  const find = ({ list }: { list: ChartInfo<any>[] }) => list.find((item) => item.id === chart.id);

  let created = await caller.getCharts().then(find);

  expect(created).toMatchObject({ cacheData: [] } satisfies Partial<ChartInfo>);
  chart.updateData(1); //更新
  chart.updateData(2); //更新
  chart.updateData(3); //更新

  expect(Array.from(chart.getCacheData())).toEqual([1, 2, 3]);

  created = await caller.getCharts().then(find);
  expect(created).toMatchObject({ cacheData: [1, 2, 3] } satisfies Partial<ChartInfo>);

  expect(clientApi.writeChart).toBeCalledTimes(3);
  expect(clientApi.writeChart).toBeCalledWith(chart.id, { value: 1 } satisfies ChartUpdateData<number>);

  vio.chart.disposeChart(chart);
});
test("cache", async function ({ vio }) {
  const config: CreateChartOpts = { maxCacheSize: 4 };
  const chart = vio.chart.create<number>(1, config); //创建

  for (let i = 0; i < chart.maxCacheSize; i++) {
    chart.updateData(i);
  }
  expect(Array.from(chart.getCacheData())).toEqual([0, 1, 2, 3]);
  chart.updateData(4);
  expect(Array.from(chart.getCacheData())).toEqual([1, 2, 3, 4]);
});
export function connectRpc(host: string) {
  return connectWebsocket(`ws://${host}/api/rpc`).then((ws) => createWebSocketCpc(ws));
}
