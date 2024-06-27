import { theme, GlobalToken } from "antd";
import { useMemo } from "react";
import { patchObject } from "evlib";

export function useThemeToken(): ThemeToken {
  return theme.useToken().token;
}
export type AppTheme = {
  colors: ThemeToken;
  changeTheme(name: string): void;
  themeName: string;
};
export type ThemeToken = {
  [key in keyof GlobalToken as key extends `${"color" | "font"}${string}` ? key : never]: GlobalToken[key];
};
type EchartsTheme = AxisConfigs & { [key: string]: any };

type AxisItem = {
  show?: boolean;
  color?: string;
  lineStyle?: {
    color?: string;
  };
};
type AxisConfig = {
  axisLine: AxisItem;
  axisTick: AxisItem;
  axisLabel: AxisItem;
  splitLine: {
    show?: boolean;
    lineStyle?: {
      color?: string[];
    };
  };
  splitArea: {
    show?: boolean;
    areaStyle?: {
      color?: string[];
    };
  };
};

type AxisConfigs = {
  logAxis?: AxisConfig;
  timeAxis?: AxisConfig;
  valueAxis?: AxisConfig;
  categoryAxis?: AxisConfig;
};
function genEchartsTheme(theme: GlobalToken, dark?: boolean): Partial<EchartsTheme> {
  const borderColor = theme.colorBorder;
  const borderWidth = 0;
  const labelColor = theme.colorText;

  const colors: string[] = [];
  const types = ["Primary", "Success", "Warning", "Error"];
  const picks = dark ? ["Bg", "BgHover", "BorderHover", "Hover"] : ["TextHover", "Text", "TextActive", "WarningActive"];

  for (const pick of picks) {
    for (const type of types) {
      let color = (theme as any)["color" + type + pick];
      if (color) colors.push(color);
    }
  }
  const axis: AxisConfig = {
    /** 轴线 */
    axisLine: {
      show: true,
      color: theme.colorTextTertiary,
    },
    /** 刻度 */
    axisTick: {
      show: false,
      color: theme.colorTextTertiary,
    },
    /** 网格 */
    splitLine: {
      show: true,
      lineStyle: {
        color: [theme.colorTextQuaternary],
      },
    },
    /** 填充 */
    splitArea: {
      show: false,
      areaStyle: {
        color: [theme.colorFillSecondary, theme.colorFillTertiary],
      },
    },
    /** 文字 */
    axisLabel: {
      show: true,
      color: theme.colorTextTertiary,
    },
  };

  const obj = {
    color: colors,
    backgroundColor: theme.colorFillQuaternary,
    title: {
      subtextStyle: {
        color: theme.colorTextSecondary,
      },
      textStyle: {
        color: theme.colorText,
      },
    },
    bar: {
      itemStyle: { barBorderColor: borderColor, barBorderWidth: borderWidth },
    },
    graph: {
      lineStyle: {
        width: 1,
        color: "#aaa",
      },
      symbolSize: 4,
      symbol: "emptyCircle",
      smooth: false,
      color: colors,
      label: {
        color: labelColor,
      },
    },
    legend: {
      textStyle: {
        color: theme.colorTextSecondary,
      },
    },
    visualMap: { color: ["#bf444c", "#d88273", "#f6efa6"] },
    toolbox: {
      iconStyle: {
        borderColor: theme.colorTextSecondary,
      },
      emphasis: {
        iconStyle: {
          borderColor: theme.colorTextTertiary,
        },
      },
    },
    /** 指示线 */
    tooltip: {
      axisPointer: {
        lineStyle: {
          color: theme.colorTextTertiary,
          width: 2,
        },
        crossStyle: {
          color: theme.colorTextTertiary,
          width: 2,
        },
      },
    },
    timeline: {
      lineStyle: {
        color: "#DAE1F5",
        width: 2,
      },
      itemStyle: {
        color: "#A4B1D7",
        borderWidth: 1,
      },
      controlStyle: {
        color: "#A4B1D7",
        borderColor: "#A4B1D7",
        borderWidth: 1,
      },
      checkpointStyle: {
        color: theme.colorPrimary,
        borderColor: "fff",
      },
      label: {
        color: "#A4B1D7",
      },
      emphasis: {
        itemStyle: {
          color: "#FFF",
        },
        controlStyle: {
          color: "#A4B1D7",
          borderColor: "#A4B1D7",
          borderWidth: 1,
        },
        label: {
          color: "#A4B1D7",
        },
      },
    },
    markPoint: {
      label: {
        color: labelColor,
      },
      emphasis: {
        label: {
          color: labelColor,
        },
      },
    },
  };
  const CHART_TYPES = ["pie", "scatter", "boxplot", "parallel", "sankey", "gauge", "graph"];

  for (const key of CHART_TYPES) {
    const specific = (obj as any)[key] ?? {};
    const defaultConfig = { itemStyle: { borderColor: borderColor, borderWidth: borderWidth } };
    (obj as any)[key] = patchObject(defaultConfig, specific);
  }

  const AXIS = ["log", "time", "value", "category"];
  for (const key of AXIS) {
    const name = key + "Axis";
    (obj as any)[name] = axis;
  }

  return obj;
}

export function useExtendsAntdTheme(dark?: boolean): object {
  const { token } = theme.useToken();
  return useMemo((): object => {
    if (import.meta.env.DEV) console.log("Echarts global theme changed");
    return genEchartsTheme(token, dark);
  }, [token, dark]);
}
