import { init as initEcharts, EChartsType, EChartsOption, EChartsInitOpts, registerLocale } from "echarts-comp/core";
import React, { CSSProperties, useRef, useCallback, useLayoutEffect, memo, useEffect, useMemo } from "react";
export const ECharts = memo(function ECharts(props: EChartsProps) {
  const resizeDeps = props.resizeDep ?? [];
  const { chartElement, echarts, resize } = useECharts(props);
  useMemo(resize, resizeDeps);
  return chartElement;
});

/** When the theme or initOption changes (shallow comparison), reinitialize Echarts */
export function useECharts(config: EChartsProps = {}) {
  const { fixedSize, loading, onChange, option, init, style } = config;
  const chartRef = useRef<EChartsType>();
  const needInit = useEchartsNeedInit(init); // 浅比较
  const oldOption = useOldValue(config.option);

  const dom: HTMLDivElement = useMemo(() => {
    const dom = document.createElement("div");
    dom.style.overflow = "hidden";
    dom.style.height = "100%";
    return dom;
  }, []);
  const echarts = useMemo(() => {
    const oldInstance = chartRef.current;

    let echarts: EChartsType;
    if (oldInstance) {
      const oldOptions = oldInstance.getOption();
      oldInstance.dispose();
      echarts = initEcharts(dom, init?.theme, init); //auto
      echarts.setOption(oldOptions, { lazyUpdate: true });
    } else {
      echarts = initEcharts(dom, init?.theme, { ...init, width: 1, height: 1 });
    }
    chartRef.current = echarts;
    onChange?.(echarts, oldInstance);
    return echarts;
  }, [needInit]);

  //update options
  useLayoutEffect(() => {
    if (objectIsEqual(oldOption, option)) return;
    updateEchartsOption(echarts, option ?? {});
  });
  //update loading
  useLayoutEffect(refreshLoading, [loading]);

  //unmount
  useLayoutEffect(() => {
    return () => chartRef.current!.dispose();
  }, []);

  //listen resize
  useEffect(() => {
    if (!fixedSize) {
      const onResize = () => {
        if (timeRef.current !== undefined) return;

        timeRef.current = setTimeout(() => {
          timeRef.current = undefined;
          resize();
        }, 40);
      };
      window.addEventListener("resize", onResize);
      return () => {
        //Maybe "Instance xxx has been disposed"
        if (timeRef.current !== undefined) clearTimeout(timeRef.current);
        window.removeEventListener("resize", onResize);
      };
    }
  }, [fixedSize]);

  const timeRef = useRef<number>();

  function refreshLoading() {
    const chart = chartRef.current;
    if (!chart) return;

    if (loading) chart.showLoading();
    else chart.hideLoading();
  }
  const resize = useCallback(() => {
    const echarts = chartRef.current!;
    const parent = dom.parentNode;
    if (!parent) return;

    echarts.resize({ width: dom.clientWidth, height: dom.clientHeight });
  }, []);

  const onDomReady = useCallback((container: HTMLDivElement | null) => {
    if (container) {
      container.appendChild(dom);
      resize();
    } else {
      //容器被卸载
      dom.parentNode?.removeChild(dom);
    }
  }, []);

  const chartElement = <div ref={onDomReady} style={{ height: "100%", ...style }}></div>;

  return { chartElement, echarts, resize, isReady: () => Boolean(dom.parentElement) };
}
function updateEchartsOption(instance: EChartsType, opts: EChartsOption) {
  instance.setOption(opts ?? {}, true, true);
}
function useOldValue<T>(value: T) {
  const ref = useRef<T>();
  const oldValue = ref.current;
  ref.current = value;
  return oldValue;
}
function useEchartsNeedInit(initOpts: any) {
  const oldOpts = useOldValue(initOpts);
  const changeObj = useRef({});
  if (!objectIsEqual(oldOpts, initOpts)) {
    changeObj.current = {};
  }
  return changeObj.current;
}
function objectIsEqual(obj1: any, obj2: any) {
  if (obj1 === obj2) return true;
  if (typeof obj1 !== "object" || typeof obj2 !== "object") return obj1 === obj2;
  if (obj1 === null) return obj1 === obj2;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;

  for (let i = 0; i < keys2.length; i++) {
    if (obj1[keys2[i]] !== obj2[keys2[i]]) return false;
  }
  return true;
}

export type { EChartsType, EChartsOption, EChartsInitOpts } from "echarts-comp/core";

export type EChartLocaleObject = Parameters<typeof registerLocale>[1];

export interface UseEchartsOption {
  /** echarts 初始化配置，变更会导致 echarts 变化 */
  init?: Omit<EChartsInitOpts, "width" | "height"> & { theme?: string | object }; //check
  /** echarts.setOption(option,true,false) */
  option?: EChartsOption;
  /** echarts loading 状态 */
  loading?: boolean;
  /** 固定渲染大小;  默认会自动监听 window resize 事件, 自动调用 Echarts.resize(); 设置为true将不会监听 */
  fixedSize?: boolean;
  /**
   * Echarts 实例发生变化时触发
   * @param oldInstance - 如果不存在，说明是第一次初始化
   */
  onChange?: (echarts: EChartsType, oldInstance?: EChartsType) => void;
}
export type EChartsProps = UseEchartsOption & {
  style?: CSSProperties;
  /** 依赖变化会触发 echarts.resize() */
  resizeDep?: any[];
};
