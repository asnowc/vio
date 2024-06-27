import {
  ExclamationCircleOutlined,
  FieldStringOutlined,
  FileOutlined,
  RightOutlined,
  SelectOutlined,
} from "@ant-design/icons";
import React from "react";

export const INPUT_TYPE_INFO = {
  all: { icon: <RightOutlined />, name: "全部", key: "all" },
  text: { icon: <FieldStringOutlined />, name: "文本", key: "text" },
  select: { icon: <SelectOutlined />, name: "选择", key: "select" },
  confirm: { icon: <ExclamationCircleOutlined />, name: "确认", key: "confirm" },
  file: { icon: <FileOutlined />, name: "文件", key: "file" },
};
