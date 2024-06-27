import vio, { EncodedImageData, TTY, TtyWriteTextType } from "@asnc/vio";
import { readFile } from "node:fs/promises";

/**
 * 每两秒输出一个文本
 */
export function intervalOutput(vio: TTY) {
  let i = 0;
  const MSG_TYPE: (TtyWriteTextType | undefined)[] = ["error", "info", "log", "warn", undefined];
  const id = setInterval(() => {
    const index = i % (MSG_TYPE.length - 1);
    vio.writeText("hhh" + i++, {
      msgType: MSG_TYPE[index],
      content: "ksdkgasdkg\ndsgasdgsdf文本文本",
    });
  }, 2000);
  return () => clearInterval(id);
}
export async function genImageData(): Promise<EncodedImageData> {
  const data = await readFile(import.meta.dirname + "/test_image.png");
  return { mime: "image/png", data };
}
