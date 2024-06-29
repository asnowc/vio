import React, { FC, ReactNode, useMemo, useReducer, useRef, useState } from "react";
import { useListenable } from "@/hooks/event.ts";
import { ChartClientAgent } from "@/services/VioApi.ts";
import { EChartsPruneOption } from "@/lib/echarts.ts";
import { Button, Empty, Form, FormInstance, Input, Select, Switch } from "antd";
import { mapDimension } from "@/lib/calc_dimesion.ts";
import { CloseOutlined, SettingOutlined } from "@ant-design/icons";
import { Title } from "@/components/Title.tsx";
import { ChartCommonProps, GaugePie, XYCoordChart } from "./ConfigurableChart/mod.ts";
import {
  BarChartOutlined,
  DashboardOutlined,
  DotChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
} from "@ant-design/icons";
import { Rule } from "antd/es/form/index.js";
import { ChartDataItem } from "@asnc/vio/client";

type ChartDefine = {
  name: string;
  Icon?: FC;
  maxDimension: number;
  Render?: (props: ChartCommonProps<any>) => ReactNode;
};
export const CHART_TYPE_RENDER_MAP: Record<string, ChartDefine | undefined> = {
  // timeline: {
  //   name: "时间线",
  //   Icon: Timeline,
  //   maxDimension: 2,
  //   Render: TimelineChart,
  // },
  gauge: {
    name: "仪表盘",
    Icon: DashboardOutlined,
    maxDimension: 2,
    Render: GaugePie,
  },
  pie: {
    name: "饼图",
    Icon: PieChartOutlined,
    maxDimension: 2,
    Render: GaugePie,
  },
  bar: {
    name: "柱状图",
    Icon: BarChartOutlined,
    maxDimension: 3,
    Render: XYCoordChart,
  },
  line: {
    name: "折线图",
    Icon: LineChartOutlined,
    maxDimension: 3,
    Render: XYCoordChart,
  },
  scatter: {
    name: "散点图",
    Icon: DotChartOutlined,
    maxDimension: 3,
    Render: XYCoordChart,
  },
};
const DIMENSION_DEFAULT = [CHART_TYPE_RENDER_MAP.gauge, CHART_TYPE_RENDER_MAP.line, CHART_TYPE_RENDER_MAP.line];

export const CHARTS_OPTIONS = Object.entries(CHART_TYPE_RENDER_MAP).map(
  ([value, item]): { label?: ReactNode; value: string } => {
    let label: ReactNode = undefined;
    if (item?.name) {
      if (item.Icon) {
        label = (
          <span>
            <item.Icon />
            <span style={{ marginLeft: 4 }}>{item.name}</span>
          </span>
        );
      } else label = item.name;
    }
    return {
      value,
      label,
    };
  },
);

export interface ConfigurableChartChartProps {
  chart: ChartClientAgent<any>;
  chartSize?: object;
  visible?: boolean;
}
export function ConfigurableChart(props: ConfigurableChartChartProps) {
  const { chart, chartSize, visible } = props;
  const [resizeDep2, resizeChart] = useReducer(() => ({}), {});
  const { slot, config: boardConfig } = useConfigBoard({
    defaultChatType: chart.meta.chartType,
    onOpenChange: resizeChart,
  });
  const { chartType: displayChartType = chart.meta.chartType ?? "unknown", enableTimeline } = boardConfig;
  const [dimensionIndexNames, setDimensionIndexNames] = useState<Record<number, (string | undefined)[] | undefined>>(
    {},
  );
  const [data, updateData] = useReducer<any>(function updateData() {
    let data: undefined | any[];
    if (enableTimeline) {
      setDimensionIndexNames(updateDimensionIndexNames(true, chart));
      data = Array.from(chart.getCacheData());
      if (chart.dimension === 2 && data) {
        try {
          data = mapDimension(data, 2, [1, 0]);
        } catch (error) {
          console.error(error);
        }
      }
    } else {
      setDimensionIndexNames(updateDimensionIndexNames(false, chart));
      data = chart.data;
    }

    return data;
  }, []);

  const Render = useMemo(() => {
    let render: FC<ChartCommonProps<any>> | undefined;
    if (displayChartType) {
      render = CHART_TYPE_RENDER_MAP[displayChartType]?.Render;
    }
    if (!render) render = () => <UnknownChart type={displayChartType} />;
    return render;
  }, [displayChartType]);

  useListenable(chart.changeEvent, () => visible && updateData());
  useMemo(() => visible && updateData, [visible]);

  const dimensionNames = useMemo(() => {
    let names: Record<number, string | undefined> = {};
    let baseName = ["Y", "X", "Z"];
    if (enableTimeline) {
      baseName = insertToArrBefore(baseName, "Time", 1);
      baseName[1] = "Time";
    }
    for (let i = 0; i < baseName.length; i++) {
      names[i] = baseName[i];
    }
    updateData();
    return names;
  }, [chart, enableTimeline]);

  const config = useMemo((): EChartsPruneOption => {
    const echartsOption: Record<string, any> = boardConfig.echartsOption ?? {};
    return {
      ...echartsOption,
      legend: { show: true, ...echartsOption.legend },
      tooltip: { show: true, ...echartsOption.tooltip },
    };
  }, [boardConfig.echartsOption]);

  const chartTitle = chart.meta.title;

  return (
    <flex-row style={{ height: "100%", position: "relative" }}>
      {/* <div style={{ whiteSpace: "break-spaces", overflow: "auto" }}>{genDebug()}</div> */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <Render
          chartMeta={chart.meta}
          chartType={displayChartType}
          data={data}
          resizeDep={[chartSize, resizeDep2]}
          dimensionIndexNames={dimensionIndexNames}
          dimensionNames={dimensionNames}
          staticOptions={config}
          staticSeries={boardConfig.echartsSeries}
        />
      </div>
      {slot}
    </flex-row>
  );
}
function UnknownChart(props: { type?: string }) {
  return (
    <div style={{ height: "100%", paddingTop: 32 }}>
      <Empty description={"未知图表类型：" + props.type} />
    </div>
  );
}
function useConfigBoard(props: { defaultChatType: string; onOpenChange?(): void }) {
  const { defaultChatType, onOpenChange } = props;
  const [form] = Form.useForm();
  useMemo(() => {
    form.setFieldsValue({
      echartsOption: "{\n\n}",
      echartsSeries: "{\n\n}",
    } satisfies ChartFormValues);
  }, []);
  useMemo(() => {
    form.setFieldValue("chartType", defaultChatType);
  }, [defaultChatType]);
  const [config, setConfig] = useState<ChartConfig>({});
  const [configBoardOpen, setConfigBoardOpen] = useState(false);

  const openBoard = (open: boolean) => {
    setConfigBoardOpen(open);
    onOpenChange?.();
  };

  const slot = configBoardOpen ? (
    <ConfigBoard form={form} onClose={() => openBoard(false)} onChange={setConfig} />
  ) : (
    <div>
      <Button
        type="text"
        onClick={() => openBoard(true)}
        style={{ position: "absolute", top: 8, right: 8, zIndex: 10 }}
        icon={<SettingOutlined />}
      ></Button>
    </div>
  );
  return {
    slot,
    config,
  };
}

interface ChartConfig {
  chartType?: string;
  enableTimeline?: string;
  echartsOption?: object;
  echartsSeries?: object;
}
interface ChartFormValues {
  chartType?: string;
  enableTimeline?: string;
  echartsOption?: string;
  echartsSeries?: string;
}
interface ConfigBoardProps {
  onChange?(values: ChartConfig): void;
  onClose?(): void;
  form: FormInstance<ChartFormValues>;
}
function ConfigBoard(props: ConfigBoardProps) {
  const { onChange, onClose, form } = props;
  const jsonRule: Rule = {
    validateTrigger: "on", //onBlur 不工作
    async validator(rule, value: string, callback) {
      JSON.parse(value);
    },
  };
  const optsRef = useRef<{
    echartsOption?: object;
    echartsSeries?: object;
    echartsOptionStr?: string;
    echartsSeriesStr?: string;
  }>({});
  const onFormChange = (changedValues: ChartFormValues, values: ChartFormValues) => {
    const { echartsOption, echartsSeries, ...opts } = values;
    if (changedValues.echartsOption || changedValues.echartsSeries) {
    } else onChange?.({ ...opts, ...optsRef.current });
  };
  const onBlur = async () => {
    const { echartsOption, echartsSeries, ...opts } = await form.validateFields();
    const before = optsRef.current;
    if (echartsOption === before.echartsOptionStr && echartsSeries === before.echartsSeriesStr) return;
    else {
      before.echartsOptionStr = echartsOption;
      before.echartsSeriesStr = echartsSeries;
    }
    before.echartsOption = parseJson(echartsOption);
    before.echartsSeries = parseJson(echartsSeries);
    onChange?.({ ...opts, ...optsRef.current });
  };
  return (
    <div style={{ overflow: "auto", padding: "12px" }}>
      <flex-row style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <Title level={5}>配置</Title>
        <Button type="text" icon={<CloseOutlined />} onClick={onClose}></Button>
      </flex-row>
      <Form layout="vertical" form={form} onValuesChange={onFormChange}>
        <Form.Item layout="horizontal" name="chartType" label="图表类型">
          <Select options={CHARTS_OPTIONS} />
        </Form.Item>
        <Form.Item layout="horizontal" name="enableTimeline" label="启用时间轴">
          <Switch />
        </Form.Item>
        {/* <Form.Item name="reverseAxis" label="反转 X-Z 轴">
        <Switch />
      </Form.Item> */}
        <Form.Item name="echartsOption" label="Echarts Option" rules={[jsonRule]}>
          <Input.TextArea onBlur={onBlur} autoSize />
        </Form.Item>
        <Form.Item name="echartsSeries" label="Echarts Series" rules={[jsonRule]}>
          <Input.TextArea onBlur={onBlur} autoSize />
        </Form.Item>
      </Form>
    </div>
  );
}
function parseJson(str?: string) {
  if (str === undefined) return;
  try {
    return JSON.parse(str);
  } catch (error) {}
}

function updateDimensionIndexNames(
  timelineEnable: boolean,
  chart: ChartClientAgent<unknown>,
): Record<number, (string | undefined)[] | undefined> {
  let indexNames = indexRecordToArray(chart.dimensionIndexNames, chart.dimension) as (string | undefined)[][];

  const formatTime = (item: Readonly<ChartDataItem<unknown>>) => {
    if (item.timeName) return item.timeName;
    return new Date(item.timestamp).toLocaleString();
  };
  if (timelineEnable) {
    const timelineNames = Array.from(chart.getCacheDateItem()).map(formatTime);
    indexNames = insertToArrBefore(indexNames, timelineNames, 1);
  } else {
    if (chart.lastDataItem) indexNames.push([formatTime(chart.lastDataItem)]);
  }
  return indexNames;
}
function insertToArrBefore<T>(arr: T[], item: T, index: number): T[] {
  let len = arr.length + 1;
  let newArr = new Array(len);
  let i: number;
  for (i = 0; i < index; i++) {
    newArr[i] = arr[i];
  }
  newArr[index] = item;
  for (i = index; i < len; i++) {
    newArr[i + 1] = arr[i];
  }
  return newArr;
}
function indexRecordToArray<T>(form: Record<number, T>, length: number): T[] {
  let arr = new Array<T>(length);
  for (let i = 0; i < length; i++) {
    arr[i] = form[i];
  }
  return arr;
}
