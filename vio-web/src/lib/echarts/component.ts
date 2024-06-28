import React, { PropsWithChildren, createContext, useContext, useEffect, useMemo } from "react";
import { useECharts, EChartsInitOpts, EChartsProps, EChartLocaleObject } from "echarts-comp/react";
interface ChartsContext {
  locale: string | EChartLocaleObject;
  theme: string | object;
}

const DEFAULT_CHART_CONFIG: ChartsContext = { theme: "dark", locale: "zh" };

const ChartsConfig = createContext<Readonly<ChartsContext>>(DEFAULT_CHART_CONFIG);
export type EchartsConfigProviderProps = PropsWithChildren<{
  locale?: string | EChartLocaleObject;
  theme?: string | object;
  registerTheme?: Record<string, object>;
  registerLocale?: Record<string, EChartLocaleObject>;
}>;
/** 提供 Echarts 默认配置 */
export function EchartsConfigProvider(props: EchartsConfigProviderProps) {
  const {
    theme = DEFAULT_CHART_CONFIG.theme,
    locale = DEFAULT_CHART_CONFIG.locale,
    registerLocale,
    registerTheme,
  } = props;
  const value = useMemo((): ChartsContext => {
    let localeObj: string | EChartLocaleObject = locale;
    let themeObj: string | object = theme;
    if (typeof locale === "string" && registerLocale && registerLocale[locale]) {
      localeObj = registerLocale[locale];
    }
    if (typeof theme === "string" && registerTheme && registerTheme[theme]) {
      themeObj = registerTheme[theme];
    }
    return { locale: localeObj, theme: themeObj };
  }, [theme, locale, registerLocale, registerTheme]);

  return React.createElement(ChartsConfig.Provider, { value }, props.children);
}

export type EChartProps = Omit<EChartsProps, "init"> & {
  init?: Omit<EChartsInitOpts, "locale">;
  resizeDep?: any[];
};

export function EChart(props: EChartProps) {
  return useEChart(props).chartElement;
}
export function useEChart(props: EChartProps = {}) {
  const { resizeDep = [], init } = props;
  const globalCOnfig = useContext(ChartsConfig);
  const res = useECharts({
    ...props,
    init: init ? { ...init, locale: globalCOnfig?.locale, theme: globalCOnfig?.theme } : globalCOnfig,
  });
  useEffect(res.resize, resizeDep);

  return res;
}
