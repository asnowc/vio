export * from "./api_type/chart.type.ts";
export * from "./api_type/tty.type.ts";

import { MaybePromise } from "../type.ts";
import type { ChartCreateInfo, ChartInfo, ChartUpdateData, RequestUpdateRes } from "./api_type/chart.type.ts";
import type { TtyOutputsData, TtyInputsReq } from "./api_type/tty.type.ts";

export interface VioClientExposed {
  chart: ChartController;
  tty: {
    /** 在指定 TTY 输出数据 */
    writeTty(ttyId: number, data: TtyOutputsData): void;
    /** 在指定 TTY 发送读取请求 */
    sendTtyReadRequest(ttyId: number, requestId: number, opts: TtyInputsReq): void;
    /** 切换 TTY 读取权限 */
    ttyReadEnableChange(ttyId: number, enable: boolean): void;
  };
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
  chart: {
    /** 获取所有图表的信息 */
    getCharts(): MaybePromise<{ list: ChartInfo<any>[] }>;
    /** 获取指定图表的信息 */
    getChartInfo(chartId: number): MaybePromise<ChartInfo | undefined>;
    /** 主动请求更新图 */
    requestUpdateChart(chartId: number): MaybePromise<RequestUpdateRes<any>>;
  };
  tty: {
    /** 获取 TTY 输出缓存日志 */
    getTtyCache(ttyId: number): MaybePromise<TtyOutputsData[]>;
    /** 切换 TTY 读取权限 */
    setTtyReadEnable(ttyId: number, enable: boolean): MaybePromise<boolean>;
    /** 解决 tty 输入请求 */
    resolveTtyReadRequest(ttyId: number, requestId: number, res: any): MaybePromise<boolean>;
    /** 拒绝 tty 输入请求 */
    rejectTtyReadRequest(ttyId: number, requestId: number, reason?: any): MaybePromise<boolean>;

    inputTty(ttyId: number, data: any): MaybePromise<boolean>;
  };
}
