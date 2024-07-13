import { TtyOutputMsg, TtyInputMsg } from "@/services/VioApi.ts";
import { TtyOutputData, TtyOutputsData, TtyInputReq } from "@asla/vio/client";
import { randomInt } from "evlib/math";
import { randomString, createList } from "evlib/mock";
const data: TtyOutputsData[] = [];

const MSG_TYPE: TtyOutputData.Text["msgType"][] = ["error", "info", "log", "warn", undefined];
for (let i = 0; i < 30; i++) {
  data[i] = randomInputText();
}
function randomInputText(): TtyOutputData.Text {
  return {
    type: "text",
    title: randomInt(10) < 3 ? "title可视对讲工卡三等奖观看手机搭嘎凯撒鲸打卡估计双打卡高级啊SDK国际三大； " : "标题",
    content: randomInt(10) > 4 ? undefined : "xxxxxxkkdgk",
    msgType: MSG_TYPE[randomInt(MSG_TYPE.length - 1)],
  };
}
function randomItem(key: number): TtyOutputMsg {
  return { type: "output", date: Date.now(), msg: randomInputText(), key };
}

export const MOCK_MSG_LIST: TtyOutputMsg[] = createList(randomItem, 30);

const INPUT_TYPE: TtyInputMsg["req"]["type"][] = ["confirm", "file", "select", "text"];
function mockInput(key: number): TtyInputMsg {
  const type = INPUT_TYPE[randomInt(INPUT_TYPE.length - 1)];

  let req: TtyInputMsg["req"];
  switch (type) {
    case "confirm":
      req = { type, title: "xxxxy", content: randomInt(10) > 4 ? undefined : "xxxxxxkkdgk" };
      break;
    case "file":
      req = { type, mime: "image/png" };
      break;
    case "select":
      req = randomSelect();
      break;
    default:
      //text
      req = { type };
      break;
  }
  const date = Date.now();
  return {
    date,
    key,
    reject: () => {},
    resolve: (data: any) => {},
    req,
  } as any;
}
export const MOCK_INPUT_REQ_LIST = createList(mockInput, 15);

function randomSelect(): TtyInputReq.Select {
  const max = randomInt(1, 2);
  return {
    type: "select",
    options: createList((i) => ({ label: randomString(5), value: i }), randomInt(1, 10)),
    title: "xxxxx",
    max: randomInt(1, 2),
    min: randomInt(1, max),
  };
}
