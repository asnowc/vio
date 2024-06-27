import { setInterval } from "evlib";

import { ChartClientAgent, ChartsDataCenterService, useVioApi } from "@/services/VioApi.ts";
import { useLayoutEffect, useMemo } from "react";

export class MockChart<T> extends ChartClientAgent<T> {
  constructor(
    private dimensionIndexSizes: number[],
    type: string,
    dimensionIndexNames?: string[][],
    private time: number = 2000,
  ) {
    super({
      dimension: dimensionIndexSizes.length + 1,
      id: 0,
      dimensionIndexNames,
      maxCacheSize: 10,
      meta: { chartType: type, title: "xxx标题" },
    });
  }
  private i = 0;
  start() {
    this.dispose();
    this.dispose = setInterval(() => {
      const randomData = genArr(...this.dimensionIndexSizes);
      this.i++;
      this.updateData(randomData);
    }, this.time);
  }
  dispose() {}
}

export function useMockChart(type: string, dimensionIndexNames: string[][], ...args: number[]) {
  const chart = useMemo(() => new MockChart<number[][][]>(args, type, dimensionIndexNames), []);
  useLayoutEffect(() => {
    chart.start();
    return () => chart.dispose();
  }, [chart]);
  return chart;
}

function genArr(...args: number[]): any;
function genArr(size: number, ...args: number[]): any {
  const max = 100;
  if (size === undefined) return radomInt(max);
  const arr = new Array(size);
  if (args.length === 0) {
    for (let i = 0; i < size; i++) {
      arr[i] = radomInt(max);
    }
  } else {
    for (let i = 0; i < size; i++) {
      arr[i] = genArr.apply(undefined, args);
    }
  }
  return arr;
}
function radomInt(max: number) {
  const min = 0;
  return Math.floor(min + Math.random() * (max - min));
}

export function startMockUpdateData(
  id: number,
  api: ChartsDataCenterService,
  dimensionIndexSizes: number[],
  time: number = 2000,
) {
  return setInterval(() => {
    const randomData = genArr(...dimensionIndexSizes);
    api.writeChart(id, { value: randomData });
  }, time);
}
export function useStartMockUpdateData(
  api: ChartsDataCenterService,
  config: {
    id: number;
    dimensionIndexSizes?: number[];
    time?: number;
  },
) {
  const { connected } = useVioApi();
}
