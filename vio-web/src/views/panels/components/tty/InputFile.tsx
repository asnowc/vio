import { TtyInputReq, VioFileData } from "@asnc/vio/client";
import { ListItem } from "@/views/components/ListItem.tsx";
import { INPUT_TYPE_INFO } from "./const.tsx";
import React, { useState } from "react";
import { Button, Space, Upload, UploadFile } from "antd";

export type InputFileProps = {
  req: TtyInputReq.File;
  date?: string;
  onSend?: (value: VioFileData) => void;
};

export function InputFile(props: InputFileProps) {
  const { req, date } = props;
  const [value, setValue] = useState<UploadFile[]>([]);
  const { maxSize } = req;
  const onSend = async () => {
    const file = value[0].originFileObj!;
    if (maxSize && file.size > maxSize) throw new Error(`文件限制大小：${maxSize}`);

    const bin = await file.arrayBuffer().then((buf) => new Uint8Array(buf, 0, buf.byteLength));
    const fileData = { name: file.name, data: bin, mime: file.type };
    props.onSend?.(fileData);
  };
  return (
    <ListItem contentIndent={false} icon={INPUT_TYPE_INFO.file.icon} title={req.title} extra={date}>
      <Space size="large">
        <Button disabled={value.length === 0} onClick={onSend}>
          发送
        </Button>
        <Upload.Dragger
          customRequest={({ file, onError, onSuccess }) => {
            if (typeof file === "string") return;
            if (maxSize && file.size > maxSize) {
              onError?.(new Error(`文件限制大小：${maxSize} 字节`));
              return;
            }
            onSuccess?.({});
          }}
          onChange={(e) => {
            setValue(e.fileList);
          }}
          fileList={value}
          maxCount={1}
          accept={req.mime}
        >
          点击上传或将文件拖拽到此区域
        </Upload.Dragger>
      </Space>
    </ListItem>
  );
}
