import { TtyInputReq } from "@asla/vio/client";
import { ListItem } from "@/views/components/ListItem.tsx";
import React, { ReactNode, useMemo, useState } from "react";
import { Button, Checkbox, Radio, Select, Space } from "antd";
import { ArrowUpOutlined } from "@ant-design/icons";
import { INPUT_TYPE_INFO } from "./const.tsx";

export type InputTextProps = {
  req: TtyInputReq.Select;
  date?: string;
  onSend?: (value: (string | number)[]) => void;
  expandLimit?: number;
};

export function InputSelect(props: InputTextProps) {
  const { req, date, onSend, expandLimit = 4 } = props;
  const [value, setValue] = useState<(string | number)[]>([]);
  const { max, min } = useMemo(() => {
    let { max = Infinity, min = 0 } = req;
    if (min > max) min = max;
    return { min, max };
  }, [req]);
  let tip: string;
  if (max === min) tip = `选择 ${max} 个选项`;
  else if (max === Infinity) {
    tip = min === 0 ? `请选择` : `至少选择 ${min} 个选项: `;
  } else tip = `选择 ${min}-${max} 个选项: `;

  return (
    <ListItem title={req.title} extra={date} contentIndent={false} icon={INPUT_TYPE_INFO.select.icon}>
      <Space size="large">
        <Button
          disabled={value.length < min || value.length > max}
          icon={<ArrowUpOutlined />}
          size="small"
          onClick={() => onSend?.(value)}
        >
          发送
        </Button>
        <Space size="middle">
          {tip}
          <InputSelectContent value={value} req={req} expandLimit={expandLimit} onChange={setValue} />
        </Space>
      </Space>
    </ListItem>
  );
}
export function InputSelectContent<T extends string | number = string | number>(props: {
  req: TtyInputReq.Select;
  value?: T[];
  onChange?: (value: T[]) => void;
  expandLimit?: number;
}) {
  const { req, value, expandLimit = 4 } = props;
  const options = useMemo((): { value: any; label: any }[] => {
    return req.options.map(({ value, label = value }) => ({ value, label }));
  }, [req.options]);
  const { isMul, max } = useMemo(() => {
    let { max = Infinity, min = 0 } = req;
    if (min > max) min = max;
    return { min, max, isMul: max > 1 };
  }, [req]);

  if (options.length > 6) {
    return (
      <Select
        onChange={props.onChange}
        value={value}
        options={options}
        mode={isMul ? "multiple" : undefined}
        maxCount={isMul ? max : undefined}
        style={{ minWidth: 100 }}
        placeholder={`一共 ${options.length} 个选项`}
        allowClear
        filterOption
        showSearch
      />
    );
  } else {
    if (isMul) {
      return <Checkbox.Group value={value} onChange={props.onChange} options={options}></Checkbox.Group>;
    } else {
      return (
        <Radio.Group
          value={value?.[0]}
          onChange={(e) => props.onChange?.([e.target.value])}
          options={options}
        ></Radio.Group>
      );
    }
  }
}
