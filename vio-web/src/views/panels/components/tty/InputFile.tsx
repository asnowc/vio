import { TtyInputReq } from "@asla/vio/client";
import { ListItem } from "@/views/components/ListItem.tsx";
import { INPUT_TYPE_INFO } from "./const.tsx";
import React, { useState } from "react";
import { Button, Space, Upload, UploadFile } from "antd";
import { autoUnitByte } from "evlib/math";
import { VioFileData } from "@asla/vio/client";

export type InputFileProps = {
  req: TtyInputReq.File;
  date?: string;
  onSend?: (value: TtyInputReq.FileResult) => void;
};
const MAXIMUM_BEARING_SIZE = 1024 * 1024 * 100; //100 MB。 因为要转为ArrayBuffer, 所以不能太大。
export function InputFile(props: InputFileProps) {
  const { req, date } = props;
  // const [selectedFiles, setFiles] = useState<VioFileData[]>([]);
  const [selectedFiles, setFiles] = useState<UploadFile[]>([]);
  const { minNumber = 1 } = req;
  const onSend = async () => {
    props.onSend?.({ list: await getInputReqFileResult(selectedFiles) });
  };
  return (
    <ListItem contentIndent={false} icon={INPUT_TYPE_INFO.file.icon} title={req.title} extra={date}>
      <Space size="large">
        <Button disabled={selectedFiles.length < minNumber} onClick={onSend}>
          发送
        </Button>
        <InputFileContent onChange={setFiles} req={req} />
      </Space>
    </ListItem>
  );
}
export function InputFileContent(props: {
  value?: UploadFile[];
  onChange?(value: UploadFile[]): void;
  req: TtyInputReq.File;
}) {
  const { req } = props;
  const { maxSize, maxNumber } = req;

  return (
    <Upload.Dragger
      customRequest={({ file, onError, onSuccess }) => {
        if (typeof file === "string") return;
        if (maxSize && file.size > maxSize) {
          onError?.(new Error(`文件限制大小：${autoUnitByte(maxSize)}`));
          return;
        }
        if (file.size > MAXIMUM_BEARING_SIZE) {
          onError?.(new Error(`超过 ${autoUnitByte(MAXIMUM_BEARING_SIZE)} 的上传最大承载大小`));
        }
        onSuccess?.({});
      }}
      onChange={(e) => props.onChange?.(e.fileList)}
      fileList={props.value}
      maxCount={maxNumber}
      accept={req.mime}
    >
      点击上传或将文件拖拽到此区域
    </Upload.Dragger>
  );
}
export async function getInputReqFileResult(selectedFiles: UploadFile[]) {
  const file = selectedFiles[0].originFileObj!;

  const fileDataLIst: Uint8Array[] = await Promise.all(
    selectedFiles.map((item) =>
      item.originFileObj!.arrayBuffer().then((buf): Uint8Array => new Uint8Array(buf, 0, buf.byteLength)),
    ),
  );
  return fileDataLIst.map((buf): VioFileData => {
    return { name: file.name, data: new Uint8Array(buf.buffer, 0, buf.byteLength), mime: file.type };
  });
}
