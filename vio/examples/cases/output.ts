import { TTY } from "@asla/vio";
import { readFile } from "node:fs/promises";
/**
 * 每两秒输出一个文本
 */
export function intervalOutput(vio: TTY) {
  let i = 0;
  const MSG_TYPE: any[] = ["error", "info", "log", "warn"];
  const id = setInterval(() => {
    const index = i % (MSG_TYPE.length - 1);
    (vio as any)[MSG_TYPE[index]]("hhh" + i++, "ksdkgasdkg\ndsgasdgsdf文本文本");
  }, 2000);
  setTimeout(() => {
    vio.writeImage({ mime: "image/png", data: imgData });
  }, 4000);
  return () => clearInterval(id);
}

const imgData = await readFile(import.meta.dirname + "/test_image.png");
