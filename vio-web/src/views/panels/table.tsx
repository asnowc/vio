import { IDockviewPanelProps } from "dockview";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Key, RpcConnectStatus, useVioApi } from "@/services/VioApi.ts";
import { useListenable } from "@/hooks/event.ts";
import { ReactErrorBoundary } from "@/components/ErrorHander.tsx";
import { useAsync } from "@/hooks/async.ts";
import { Empty } from "antd";
import { VioTable } from "./components/VioTable.tsx";
import { TableFilter } from "@asla/vio/client";

export function VioTablePanel({ api, containerApi, params }: IDockviewPanelProps<{ objectId: number }>) {
  const vioApi = useVioApi();
  const chartCenter = vioApi.chart;
  const { objectId } = params;

  const {
    loading,
    run: loadTable,
    res: table,
  } = useAsync(function () {
    return chartCenter.getTable(objectId).then((table) => {
      loadTableData();
      return table;
    });
  });
  const { run: loadTableData, res: tableData = { total: 0, rows: [] as any[] } } = useAsync((filter?: TableFilter) =>
    vioApi.chart.getTableData(objectId, filter),
  );
  const visible = api.isVisible;
  const changedRef = useRef(false);

  useListenable(chartCenter.createObjEvent, (e) => {
    if (!e || e.id !== objectId) return;
    if (table) return;
    loadTable();
  });

  useListenable(vioApi.statusChange, (status) => {
    if (status === RpcConnectStatus.connected) {
      loadTable();
    }
  });
  useListenable(table?.needReloadEvent, () => {
    if (visible) loadTableData();
    else {
      changedRef.current = true;
    }
  });

  useMemo(() => {
    if (visible && changedRef.current) {
      loadTableData();
      changedRef.current = false;
    }
  }, [visible]);

  const [noExist, setNoExist] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      if (!loading && !table) setNoExist(true);
    }, 500);
    if (vioApi.connected) loadTable();
  }, []);

  return (
    <div style={{ height: "100%", overflow: "auto" }}>
      <ReactErrorBoundary>
        {table && (
          <VioTable
            loading={loading}
            columns={table.columns}
            data={tableData.rows}
            keyField={table.config.keyField}
            addAction={table.config.addAction}
            operations={table.config.operations}
            updateAction={table.config.updateAction}
            onRowAction={(opKey: string, rowKey: Key) => table.onRowAction(opKey, rowKey)}
            onTableAction={(opKey, selectedKeys: Key[]) => table.onTableAction(opKey, selectedKeys)}
            onCreate={(param) => table.onAdd(param)}
            onUpdate={(rowKey, param) => table.onUpdate(rowKey, param)}
            total={tableData.total}
            onChange={loadTableData}
          />
        )}
        {!table && noExist && <Empty description="对象不存在"></Empty>}
      </ReactErrorBoundary>
    </div>
  );
}
