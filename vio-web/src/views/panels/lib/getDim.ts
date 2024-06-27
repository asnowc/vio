import { EChartsPruneOption } from "@/lib/echarts.ts";

export function getDim(data: any): number {
  if (!(data instanceof Array)) return 0;
  return getDim(data[0]) + 1;
}

export function toDim(data: any, dim: 0): number | undefined;
export function toDim(data: any, dim: 1): number[] | undefined;
export function toDim(data: any, dim: 2): number[][] | undefined;
export function toDim(data: any, dim: 3): number[][][] | undefined;
export function toDim(data: any, dim: number): any[];
export function toDim(data: any, dim: number) {
  if (!(data instanceof Array || typeof data === "number")) return;
  const dataDim = getDim(data);
  if (dataDim === dim) return data;
  else if (dataDim > dim) {
    let x = dataDim - dim;
    for (let i = 0; i < x; i++) {
      data = data[0];
    }
    return data;
  }

  let x = dim - dataDim;
  for (let i = 0; i < x; i++) {
    data = [data];
  }
  return data;
}
export function finalBaseOptions(opts: EChartsPruneOption = {}): EChartsPruneOption {
  if (!opts.yAxis && !opts.xAxis) {
    opts.yAxis = { type: "value" };
    opts.xAxis = { type: "category" };
  }
  return opts;
}
