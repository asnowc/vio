import { describe, expect, beforeEach } from "vitest";
import { connectWebsocket } from "../../src/lib/websocket.ts";
import { TtyOutputsData, VioServerExposed, TtyOutputData, TtyInputReq } from "../../src/client.ts";
import { createWebSocketCpc } from "cpcall";
import { afterTime } from "evlib";
import { vioServerTest as test, VioServerTestContext as TestContext } from "../_env/test_port.ts";

describe("tty-read", function () {
  beforeEach<TestContext>(async ({ connector }) => {
    const { clientApi, serverApi } = connector;
    clientApi.sendTtyReadRequest.mockImplementation((index, reqId, req) => {
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
      serverApi.resolveTtyReadRequest(index, reqId, res).then((res) => {
        res;
      });
    });
    const result = await serverApi.setTtyReadEnable(0, true);
  }, 500);
  test("input", async function ({ task, vio }) {
    task.suite.tasks[0].result;

    const res = await vio.readText("title");
    expect(res).toBe("res-title");
  });
  test("pick", async function ({ vio }) {
    const res = await vio.pick<string | number>("title", [
      { label: "aa", value: 1 },
      { label: "aa2", value: "a" },
    ]);
    expect(res).toBe(1);
  });
  test("select", async function ({ vio, connector }) {
    const { clientApi, serverApi } = connector;
    clientApi.sendTtyReadRequest.mockImplementationOnce((index, reqId, req) => {
      if (req.type === "select") {
        const res = (req as TtyInputReq.Select).options.map((item) => item.value);
        serverApi.resolveTtyReadRequest(index, reqId, res);
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
    tty.writeText("xxxx");
    await afterTime(50);

    const calls = clientApi.writeTty.mock.calls;
    expect(calls[0][0], "id").toBe(8);
    expect(calls[0][1]).toEqual({ type: "text", title: "xxxx" } satisfies TtyOutputData.Text);
  });
});
test("重新获取输入权", async function ({ vio, connectVioSever }) {
  const p1 = vio.confirm("h1"); //请求确认

  const c1 = await connectVioSever(); // 客户端连接

  await expect(c1.serverApi.setTtyReadEnable(0, true), "tty0 成功获取输入权").resolves.toBe(true);

  expect(c1.clientApi.sendTtyReadRequest, "应收到一次请求").toBeCalledTimes(1);

  c1.cpc.onClose.catch(() => {});
  c1.cpc.dispose(); // 模拟断开连接

  const c2 = await connectVioSever(); //模拟重新连接
  await expect(c2.serverApi.setTtyReadEnable(0, true), "获取到输入权").resolves.toBe(true);
  expect(c2.clientApi.sendTtyReadRequest, "应收到一次请求").toBeCalledTimes(1);
  const reqId = c2.clientApi.sendTtyReadRequest.mock.calls[0][1];
  await expect(c2.serverApi.resolveTtyReadRequest(0, reqId, true), "c2 成功解决请求").resolves.toBe(true);
  await expect(p1).resolves.toBe(true);
});

test("切换输入权", async function ({ vio, connectVioSever }) {
  const c1 = await connectVioSever(); // 客户端连接
  const p1 = vio.readText("h1"); //请求确认

  await expect(c1.serverApi.setTtyReadEnable(0, true), "tty0 成功获取输入权").resolves.toBe(true);
  expect(c1.clientApi.sendTtyReadRequest, "应收到一次请求").toBeCalledTimes(1);

  const c2 = await connectVioSever(); //模拟另一个连接
  await expect(c2.serverApi.setTtyReadEnable(0, true), "成功夺取 tty0 的输入权").resolves.toBe(true);

  await afterTime();
  expect(c1.clientApi.ttyReadEnableChange, "通知c1 输入权被关闭").toBeCalledWith(0, false);
  const reqId1 = c1.clientApi.sendTtyReadRequest.mock.calls[0][1];
  await expect(c1.serverApi.resolveTtyReadRequest(0, reqId1, "111"), "输入权被夺走，解决失败").resolves.toBe(false);

  const reqId2 = c2.clientApi.sendTtyReadRequest.mock.calls[0][1];
  await expect(c2.serverApi.resolveTtyReadRequest(0, reqId2, "222")).resolves.toBe(true);
  await expect(p1).resolves.toBe("222");
});

test("cache", async function ({ vio, connector }) {
  const { clientApi, serverApi, cpc } = connector;
  const caller = cpc.genCaller<VioServerExposed>();
  const tty = vio.tty.get(3); //创建
  tty.cacheSize = 4;
  const cachedData: TtyOutputsData[] = [];
  for (let i = 0; i < tty.cacheSize; i++) {
    const data: TtyOutputData.Text = { title: i.toString(), type: "text" };
    tty.writeText(i.toString());
    cachedData.push(data);
  }
  await expect(caller.getTtyCache(3)).resolves.toEqual(cachedData);
  tty.writeText("hh");
  await expect(caller.getTtyCache(3)).resolves.toEqual([...cachedData.slice(1), { title: "hh", type: "text" }]);
});
test("dispose", async function ({ vio, connector }) {
  const { clientApi, serverApi, cpc } = connector;
  clientApi.sendTtyReadRequest.mockImplementation(() => new Promise(() => {}));
  const tty = vio.tty.get(1); //创建
  vio.tty.delete(tty);
  await expect(() => tty.readText()).rejects.toThrowError();
});
export function connectRpc(host: string) {
  return connectWebsocket(`ws://${host}/api/rpc`).then((ws) => createWebSocketCpc(ws));
}
