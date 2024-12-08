import { Tag } from "antd";
import React, { PropsWithChildren } from "react";

export function JsData(props: { children?: any }) {
  const { children: object } = props;
  switch (typeof object) {
    case "object": {
      if (object === null) {
        return (
          <Tag color="blue" bordered={false}>
            null
          </Tag>
        );
      }
      return <JsObjectTree>{object}</JsObjectTree>;
    }
    case "function":
      return (
        <Tag color="yellow" bordered={false}>
          {String(object)}
        </Tag>
      );
    case "string":
      return object;
    case "number":
      return <Tag color="yellow">{object}</Tag>;
    case "bigint":
      return <Tag color="yellow">{object.toString() + "n"}</Tag>;
    case "boolean":
      return (
        <Tag color="blue" bordered={false}>
          {String(object)}
        </Tag>
      );
    case "symbol":
      return (
        <Tag color="blue" bordered>
          {String(object)}
        </Tag>
      );
    case "undefined":
      return (
        <Tag color="blue" bordered={false}>
          undefined
        </Tag>
      );
    default:
      return String(object);
  }
}

function JsObjectTree(props: { children?: any }) {
  let { children: object } = props;
  let prefix: string | undefined = object.constructor?.name;
  if (object instanceof Map) object = Object.fromEntries(object);
  else if (object instanceof Set) object = Array.from(object);
  let str = JSON.stringify(object, null, 2); //TODO 动态结构展示
  if (prefix)
    return (
      <>
        <Tag color="green" bordered={false}>
          {prefix}
        </Tag>
        {str}
      </>
    );
  else return str;
}
