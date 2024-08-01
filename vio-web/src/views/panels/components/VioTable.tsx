import { Key } from "@/services/VioApi.ts";
import type { TableRenderFn, TableFilter, Column, TableRow, UiButton, UiAction } from "@asla/vio/client";
import { Button, Space, Table, TableProps } from "antd";
import React, { ReactNode, useMemo, useRef, useState } from "react";
import { VioUi } from "./ui_object.tsx";
type AntColumn = NonNullable<TableProps["columns"]>;

export function VioTable<
  Row extends TableRow = TableRow,
  Add extends object = Row,
  Update extends object = Add,
>(props: {
  columns: Column<Row>[];
  data?: Row[];
  total?: number;
  loading?: boolean;

  keyField: string;
  name?: string;
  operations?: UiAction[];
  updateAction?: boolean;
  addAction?: UiButton["props"];
  onTableAction?(opKey: string, selectedKeys: Key[]): void;
  onRowAction?(opKey: string, rowKey: Key): void;
  onChange?(filter: TableFilter): void;
  onCreate?(param: Add): void;
  onUpdate?(rowKey: string, param: Update): void;
}) {
  const { data, total = 0, onRowAction, onTableAction, onChange, onCreate, onUpdate, operations, keyField } = props;

  const [dataFilter, setDataFilter] = useState<{
    pageSize: number;
    page: number;
    filters?: Record<string, any>;
    sorter?: Record<string, any>;
  }>({ page: 1, pageSize: 10 });
  const columns: AntColumn = useMemo(() => {
    return props.columns.map((column): AntColumn[0] => {
      let render: TableRenderFn<any> | undefined;
      if (column.render) {
        try {
          render = Function("args", column.render) as any;
        } catch (error) {
          console.error("处理渲染函数时出现异常", error);
        }
      }

      return {
        dataIndex: column.dataIndex,
        title: column.title ?? String(column.dataIndex),
        width: column.width,
        render: (item, record, index) => {
          if (render) {
            try {
              item = render({ record, index, column });
            } catch (error) {
              console.error("渲染函数执行时抛出异常", error);
              return "";
            }
            const onAction = (key: string) => {
              onRowAction?.(key, record[keyField]);
            };

            if (item instanceof Array) {
              return (
                <Space>
                  {item.map((item) => (
                    <VioUi object={item} onAction={onAction} key={item.key} />
                  ))}
                </Space>
              );
            } else {
              return <VioUi object={item} onAction={onAction} key={item.key} />;
            }
          }
          return item;
        },
      };
    });
  }, [props.columns]);
  const [selectedKeys, setSelectedKeys] = useState<(string | number)[]>([]);

  const ope = useMemo((): ReactNode[] | undefined => {
    return operations?.map((item) => (
      <VioUi object={item} onAction={() => onTableAction?.(item.key, selectedKeys)} key={item.key} />
    ));
  }, [operations, selectedKeys]);
  return (
    <div style={{ padding: 8, overflow: "auto" }}>
      <Space style={{ margin: "8px 0" }}>
        {props.addAction && (
          <Button type="primary" onClick={() => onCreate?.({} as Add)}>
            {props.addAction.text}
          </Button>
        )}
        {ope}
      </Space>
      <Table
        loading={props.loading}
        size="middle"
        columns={columns}
        dataSource={data}
        rowKey={keyField}
        rowSelection={{
          onChange(selectedRowKeys, selectedRows, info) {
            setSelectedKeys(selectedRowKeys as (string | number)[]);
          },
          selectedRowKeys: selectedKeys,
        }}
        pagination={{
          total: total,
          showSizeChanger: total > 2,
          showQuickJumper: total / dataFilter.pageSize > 5,
          showTitle: true,
          current: dataFilter.page,
          pageSize: dataFilter.pageSize,
        }}
        onChange={(pagination, filters, sorter) => {
          const filter: typeof dataFilter = {
            pageSize: pagination.pageSize ?? 10,
            page: pagination.current ?? 1,
            filters,
            sorter,
          };
          setDataFilter(filter);

          const number = filter.pageSize;
          const skip = number * (filter.page - 1);
          onChange?.({ number, skip });
        }}
      ></Table>
    </div>
  );
}
