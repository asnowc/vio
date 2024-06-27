import { describe, test, expect } from "vitest";
import { VioChart } from "@asnc/vio";

describe("chart", function () {
  test("cache", async function () {
    const chart = create(0); //创建

    for (let i = 0; i < chart.maxCacheSize; i++) {
      chart.updateData(i);
    }
    expect(Array.from(chart.getCacheData())).toEqual([0, 1, 2, 3]);
    chart.updateData(4);
    expect(Array.from(chart.getCacheData())).toEqual([1, 2, 3, 4]);
  });
  test("dimensionIndexNames", async function () {
    const chart = create(1); //创建

    expect(chart.dimensionIndexNames[0]).toEqual([]);

    //@ts-ignore
    expect(() => (chart.dimensionIndexNames[1] = [])).toThrowError();
  });
});
describe("二维", function () {
  test("updateLine", function () {
    const chart = create(2);
    const data = [
      [0, 1, 3],
      [2, 2, 3],
      [3, 2, 3],
    ];
    chart.updateData(data);

    chart.updateSubData([7, 3, 9], 1); // 横向更新线

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
  test("updateLine", function () {
    const chart = create(1);
    const data = [0, 1, 3];
    chart.updateData(data);

    // const [axis0, axis1] = chart.dimensionIndexNames;
  });
});

function create(dimension: 0): VioChart<number>;
function create(dimension: 1): VioChart<number[]>;
function create(dimension: 2): VioChart<number[][]>;
function create(dimension: 3): VioChart<number[][][]>;
function create<T>(dimension: number): VioChart<T>;
function create<T>(dimension: number): VioChart<T> {
  return new VioChart<T>({
    maxCacheSize: 4,
    meta: { chartType: "line" },
    dimension: dimension,
    id: 1,
    dimensionIndexNames: [],
  });
}
