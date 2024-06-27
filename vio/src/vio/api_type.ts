export * from "./api_type/chart.type.ts";
export * from "./api_type/tty.type.ts";

import type { ChartCreateInfo, ChartInfo, ChartUpdateData } from "./api_type/chart.type.ts";
import type { TtyOutputsData, TtyInputsReq } from "./api_type/tty.type.ts";

export interface VioClientExposed extends ChartController {
  /** 在指定 TTY 输出数据 */
  writeTty(ttyId: number, data: TtyOutputsData): void;
  /** 在指定 TTY 发送读取请求 */
  sendTtyReadRequest(ttyId: number, requestId: number, opts: TtyInputsReq): void;
  /** 切换 TTY 读取权限 */
  ttyReadEnableChange(ttyId: number, enable: boolean): void;
}

export interface ChartController {
  /** 在指定图表输出数据 */
  writeChart(chartId: number, data: Readonly<ChartUpdateData<any>>): void;
  /** 删除指定图表 */
  deleteChart(chartId: number): void;
  /** 创建图表 */
  createChart(chartInfo: ChartCreateInfo): void;
}

export interface VioServerExposed {
  /** 获取所有图表的信息 */
  getCharts(): { list: ChartInfo<any>[] };
  /** 获取指定图表的信息 */
  getChartInfo(id: number): ChartInfo | undefined;
  /** 获取 TTY 输出缓存日志 */
  getTtyCache(ttyId: number): TtyOutputsData[];
  /** 切换 TTY 读取权限 */
  setTtyReadEnable(ttyId: number, enable: boolean): boolean;
  /** 解决 tty 输入请求 */
  resolveTtyReadRequest(ttyId: number, requestId: number, res: any): boolean;
  /** 拒绝 tty 输入请求 */
  rejectTtyReadRequest(ttyId: number, requestId: number, reason?: any): boolean;
}
