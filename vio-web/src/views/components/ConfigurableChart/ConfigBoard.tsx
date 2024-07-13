import React, { ReactNode, useMemo, useRef, useState } from "react";
import { Button, Form, FormInstance, Input, InputNumber, Select, Switch, Tooltip } from "antd";
import { CloseOutlined, SettingOutlined } from "@ant-design/icons";
import { Title } from "@/components/Title.tsx";
import { CHART_TYPE_RENDER_MAP } from "./const.ts";
import { ChartConfig } from "./type.ts";
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

interface ConfigBoardProps {
  onChange?(values: ChartConfig): void;
  onClose?(): void;
  defaultValue?: ChartConfig;
  form: FormInstance<ChartConfig>;
}
function ConfigBoard(props: ConfigBoardProps) {
  const { onChange, onClose, form, defaultValue } = props;

  return (
    <div style={{ overflow: "auto", padding: "12px" }}>
      <flex-row style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <Title level={5}>配置</Title>
        <Button type="text" icon={<CloseOutlined />} onClick={onClose}></Button>
      </flex-row>
      <Form
        layout="vertical"
        form={form}
        onValuesChange={(i, values) => onChange?.(values)}
        initialValues={defaultValue}
      >
        <Form.Item layout="horizontal" name="chartType" label="图表类型">
          <Select options={CHARTS_OPTIONS} />
        </Form.Item>
        <Form.Item layout="horizontal" name="enableTimeline" label="启用时间轴">
          <Switch />
        </Form.Item>
        <Form.Item layout="horizontal" name="requestUpdate" label="自动请求更新">
          <Switch />
        </Form.Item>
        <Form.Item layout="horizontal" name="requestInternal" label="自动请求更新间隔">
          <InputNumber min={100} step={1000} />
        </Form.Item>
        <Form.Item name="echartsOption" label="Echarts Option">
          <JsonInput />
        </Form.Item>
        <Form.Item name="echartsSeries" label="Echarts Series">
          <JsonInput />
        </Form.Item>
      </Form>
    </div>
  );
}
function JsonInput(props: { value?: object; onChange?(data: object): void }) {
  const [pass, isPass] = useState(true);
  const [valueStr, setValueStr] = useState<string | undefined>();
  const foursValueRef = useRef<string | undefined>();
  const beforeValueRef = useRef<object | undefined>();

  useMemo(() => {
    if (props.value === beforeValueRef.current) return;
    beforeValueRef.current = props.value;
    setValueStr(JSON.stringify(props.value, null, 2));
  }, [props.value]);

  const onBlur = async () => {
    if (foursValueRef.current === valueStr) return;
    try {
      const json = valueStr ? JSON.parse(valueStr) : {};
      isPass(true);
      beforeValueRef.current = json;
      props.onChange?.(json);
    } catch (error) {
      isPass(false);
    }
  };
  const onValueChange = (value?: string) => {
    setValueStr(value);
  };
  return (
    <Input.TextArea
      value={valueStr}
      onChange={(e) => onValueChange(e.currentTarget.value)}
      onBlur={onBlur}
      onFocus={() => {
        foursValueRef.current = valueStr;
      }}
      autoSize
      status={pass ? undefined : "error"}
    />
  );
}
export function ConfigBoardCollapse(props: {
  defaultValue?: ChartConfig;
  onChange?(value: ChartConfig): void;
  form: FormInstance<ChartConfig>;
  open?: boolean;
  onOpenChange?(open: boolean): void;
  extra?: ReactNode;
}) {
  const { onChange, onOpenChange, form, open, defaultValue, extra } = props;
  return (
    <div style={{ position: "relative" }}>
      {open ? (
        <ConfigBoard
          defaultValue={defaultValue}
          form={form}
          onClose={() => onOpenChange?.(false)}
          onChange={onChange}
        />
      ) : (
        <flex-col style={{ gap: 8, position: "absolute", top: 8, right: 8, zIndex: 10 }}>
          <Tooltip title="配置面板" placement="left">
            <Button type="text" onClick={() => onOpenChange?.(true)} icon={<SettingOutlined />}></Button>
          </Tooltip>
          {extra}
        </flex-col>
      )}
    </div>
  );
}
