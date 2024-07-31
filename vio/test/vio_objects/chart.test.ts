import { describe, expect, vi } from "vitest";
import { connectWebsocket } from "../../src/lib/websocket.ts";
import { ChartCreateOption, ChartInfo, DimensionInfo } from "@asla/vio";
import { createWebSocketCpc } from "cpcall";
import { afterTime } from "evlib";
import { vioServerTest as test } from "../_env/test_port.ts";
import { VioObjectCreateDto, VioObjectDto } from "../../src/vio/api_type.ts";

test("createChart-getObjects", async function ({ vio, connector }) {
  const { clientApi, serverApi } = connector;
  function getList() {
    return serverApi.object.getObjects().then((res) => res.list);
  }

  await expect(getList()).resolves.toEqual([]);

  const config: ChartCreateOption<number> = { name: "内存图", meta: { chartType: "progress" }, maxCacheSize: 20 };
  const chart = vio.object.createChart<number>(1, config); //创建
  expect(chart).toMatchObject(config);

  const createdDto: VioObjectCreateDto = { id: chart.id, name: "内存图", type: "chart" };
  await expect(getList()).resolves.toEqual([createdDto] satisfies VioObjectDto[]);

  expect(clientApi.object.createObject).toBeCalledWith(createdDto);
});

test("dimensionsInfo", async function ({ vio }) {
  const chart = vio.object.createChart(2, { dimensions: { 1: { name: "Y" } } }); //创建
  expect(chart.dimensions.length).toBe(2);
  expect(chart.dimensions[1]).toMatchObject({ name: "Y" } satisfies DimensionInfo);
});
test("dispose chart", async function ({ vio, connector }) {
  const { clientApi, serverApi } = connector;
  const chart0 = vio.object.createChart(0);
  const chart1 = vio.object.createChart(2);
  await expect(serverApi.object.getObjects().then((res) => res.list)).resolves.toHaveLength(2);
  let chart3 = vio.object.createChart(3);
  await expect(serverApi.object.getObjects().then((res) => res.list)).resolves.toHaveLength(3);

  vio.object.disposeObject(chart1);

  await expect(serverApi.object.getObjects().then((res) => res.list.map((info) => info.id))).resolves.toEqual([0, 2]);

  expect(clientApi.object.deleteObject).toBeCalledWith(chart1.id);
});
test("update", async function ({ vio, connector }) {
  const { clientApi, serverApi } = connector;

  const config: ChartCreateOption<number> = { maxCacheSize: 20 };
  const chart = vio.object.createChart<number>(1, config); //创建

  await expect(serverApi.object.getChartInfo(chart.id)).resolves.toMatchObject({
    cacheList: [],
  } satisfies Partial<ChartInfo>);
  chart.updateData(1); //更新
  chart.updateData(2); //更新
  chart.updateData(3); //更新

  expect(Array.from(chart.getCacheData())).toEqual([1, 2, 3]);

  await expect(
    serverApi.object.getChartInfo(chart.id).then((res) => res?.cacheList.map((item) => item.data)),
  ).resolves.toEqual([1, 2, 3]);

  expect(clientApi.object.writeChart).toBeCalledTimes(3);

  expect(clientApi.object.writeChart.mock.calls.map((item) => item[1])).toMatchObject([
    { data: 1 },
    { data: 2 },
    { data: 3 },
  ]);

  vio.object.disposeObject(chart);
});

test("cache", async function ({ vio }) {
  const config: ChartCreateOption<number> = { maxCacheSize: 4 };
  const chart = vio.object.createChart<number>(1, config); //创建

  for (let i = 0; i < chart.maxCacheSize; i++) {
    chart.updateData(i);
  }
  expect(Array.from(chart.getCacheData())).toEqual([0, 1, 2, 3]);
  chart.updateData(4);
  expect(Array.from(chart.getCacheData())).toEqual([1, 2, 3, 4]);
});

test("Proactive update", async function ({ vio, connector }) {
  const { clientApi, serverApi } = connector;
  const chart1 = vio.object.createChart(1);

  let i = 0;
  const onRequestUpdate = vi.fn(() => i++);
  const chart2 = vio.object.createChart(2, { onRequestUpdate, updateThrottle: 20 });

  await expect(
    serverApi.object.requestUpdateChart(chart1.id),
    "Chart1 没有设置更新函数，应抛出异常",
  ).rejects.toThrowError();
  await expect(serverApi.object.requestUpdateChart(chart2.id)).resolves.toMatchObject({ data: 0 });
  await expect(
    serverApi.object.requestUpdateChart(chart2.id),
    "请求频率超过设定的节流时间，返回的值还是原来的",
  ).resolves.toMatchObject({ data: 0 });
  expect(onRequestUpdate).toBeCalledTimes(1);

  await afterTime(40);
  await expect(serverApi.object.requestUpdateChart(chart2.id)).resolves.toMatchObject({ data: 1 });

  await expect(
    serverApi.object.getChartInfo(chart2.id).then((info) => info!.cacheList.map((item) => item.data)),
    "通过 requestUpdateChart 获取的数据应该被推送到缓存",
  ).resolves.toEqual([0, 1]);
});

describe.todo("updateSub", function () {
  test("updateLine", function ({ vio }) {
    const chart = vio.object.createChart(2);
    const data = [
      [0, 1, 3],
      [2, 2, 3],
      [3, 2, 3],
    ];
    chart.updateData(data);

    // chart.updateSubData([7, 3, 9], 1); // 横向更新线

    expect(chart.data).toEqual([
      [0, 1, 3],
      [7, 3, 9],
      [3, 2, 3],
    ]);

    // chart.updateSubData([4, 5, 6], [undefined, 2]); // 纵向更新线
    // expect(chart.data).toEqual([
    // [0, 1, 4],
    // [7, 3, 5],
    // [3, 2, 6],
    // ]);

    // chart.updateSubData(99, [1, 1]); // 更新点

    // expect(chart.data).toEqual([
    //   [0, 1, 4],
    //   [7, 99, 5],
    //   [3, 2, 6],
    // ]);
  });
  test("updateLine", function ({ vio }) {
    const chart = vio.object.createChart(1);
    const data = [0, 1, 3];
    chart.updateData(data);

    // const [axis0, axis1] = chart.dimensionIndexNames;
  });
});

export function connectRpc(host: string) {
  return connectWebsocket(`ws://${host}/api/rpc`).then((ws) => createWebSocketCpc(ws));
}
