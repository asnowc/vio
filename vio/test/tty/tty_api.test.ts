import { describe, expect, beforeEach } from "vitest";
import { connectWebsocket } from "../../src/lib/websocket.ts";
import { TtyOutputsData, VioServerExposed, TtyOutputData, TtyInputReq } from "../../src/client.ts";
import { createWebSocketCpc } from "cpcall";
import { afterTime } from "evlib";
import { vioServerTest as test, VioServerTestContext as TestContext } from "../_env/test_port.ts";

describe("tty-read", function () {
  beforeEach<TestContext>(async ({ connector }) => {
    const { clientApi, serverApi } = connector;
    clientApi.tty.sendTtyReadRequest.mockImplementation((index, reqId, req) => {
      let res: any;
      switch (req.type) {
        case "text":
          res = "res-" + req.title;
          break;
        case "confirm":
          res = true;
          break;
        case "file":
          res = undefined;
          break;
        case "select":
          res = [req.options[0].value];
          break;
        default:
          break;
      }
      serverApi.tty.resolveTtyReadRequest(index, reqId, res).catch(() => {});
    });
  });
  test("input", async function ({ task, vio }) {
    const res = await vio.readText("title");
    expect(res).toBe("res-title");
  });
  test("pick", async function ({ vio }) {
    const res = await vio
      .pick<string | number>("title", [
        { label: "aa", value: 1 },
        { label: "aa2", value: "a" },
      ])
      .catch(() => {});
    expect(res).toBe(1);
  });
  test("select", async function ({ vio, connector }) {
    const { clientApi, serverApi } = connector;
    clientApi.tty.sendTtyReadRequest.mockImplementationOnce((index, reqId, req) => {
      if (req.type === "select") {
        const res = (req as TtyInputReq.Select).options.map((item) => item.value);
        serverApi.tty.resolveTtyReadRequest(index, reqId, res);
      }
    });
    const res = await vio.select<string | number>("title", [
      { label: "aa", value: 1 },
      { label: "aa2", value: "a" },
    ]);
    expect(res).toEqual([1, "a"]);
  });
  test("writeText", async function ({ vio, connector }) {
    const { clientApi, serverApi } = connector;
    const tty = vio.tty.get(8);
    tty.log("xxxx");
    await afterTime(50);

    const calls = clientApi.tty.writeTty.mock.calls;
    expect(calls[0][0], "id").toBe(8);
    expect(calls[0][1]).toEqual({ content: ["xxxx"], type: "log" } satisfies TtyOutputData.Text);
  });
});
test("多客户", async function ({ vio, connectVioSever }) {
  const p1 = vio.readText("h1").catch(() => {}); //请求确认

  const c1 = await connectVioSever(); // 客户端连接
  const c2 = await connectVioSever(); //模拟重新连接

  expect(c1.clientApi.tty.sendTtyReadRequest, "应收到一次请求").toBeCalledTimes(1);

  await afterTime(50);
  expect(c2.clientApi.tty.sendTtyReadRequest, "应收到一次请求").toBeCalledTimes(1);

  const reqId = c2.clientApi.tty.sendTtyReadRequest.mock.calls[0][1];
  await expect(c2.serverApi.tty.resolveTtyReadRequest(0, reqId, "11"), "c1 成功解决请求").resolves.toBe(true);
  await afterTime(50);
  expect(c2.clientApi.tty.cancelTtyReadRequest).not.toBeCalled();
  expect(c1.clientApi.tty.cancelTtyReadRequest).toBeCalled();
  await expect(c1.serverApi.tty.resolveTtyReadRequest(0, reqId, "22"), "c2 没有解决请求").resolves.toBe(false);

  expect(p1).resolves.toBe("11");
});

test("cache", async function ({ vio, connector }) {
  const { clientApi, serverApi, cpc } = connector;
  const caller = cpc.genCaller<VioServerExposed>();
  const tty = vio.tty.get(3); //创建
  tty.cacheSize = 4;
  const cachedData: TtyOutputsData[] = [];
  for (let i = 0; i < tty.cacheSize; i++) {
    const data: TtyOutputData.Text = { content: [i.toString()], type: "log" };
    tty.log(i.toString());
    cachedData.push(data);
  }
  await expect(caller.tty.getTtyCache(3)).resolves.toEqual(cachedData);
  tty.log("hh");
  await expect(caller.tty.getTtyCache(3)).resolves.toEqual([...cachedData.slice(1), { content: ["hh"], type: "log" }]);
});
test("dispose", async function ({ vio, connector }) {
  const { clientApi, serverApi, cpc } = connector;
  clientApi.tty.sendTtyReadRequest.mockImplementation(() => new Promise(() => {}));
  const tty = vio.tty.get(1); //创建
  vio.tty.delete(tty);
  await expect(() => tty.readText()).rejects.toThrowError();
});
export function connectRpc(host: string) {
  return connectWebsocket(`ws://${host}/api/rpc`).then((ws) => createWebSocketCpc(ws));
}
