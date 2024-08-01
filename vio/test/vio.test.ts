import { expect } from "vitest";
import { afterTime } from "evlib";
import { vioServerTest as test } from "./_env/test_port.ts";
import { VioHttpServer, createVio } from "@asla/vio";

test("connect-disconnect", async function ({ vio, connector }) {
  const { cpc } = connector;
  expect(vio.viewerNumber).toBe(1);

  await cpc.close();
  await afterTime();
  expect(vio.viewerNumber).toBe(0);
});
test("connect-dispose", async function ({ vio, connector }) {
  const { cpc } = connector;
  cpc.onClose.catch(() => {});
  expect(vio.viewerNumber).toBe(1);

  cpc.dispose();
  await afterTime(100);
  expect(vio.viewerNumber).toBe(0);
});

const version = parseInt(process.version.slice(1, 3));

test.skipIf(version < 22)("close server", async function ({ vioServerInfo }) {
  const vio = createVio();
  const server = new VioHttpServer(vio);
  await server.listen(vioServerInfo.port, vioServerInfo.hostname);

  let wsList = await Promise.all([1, 2, 3].map(() => connectWs(`ws://${vioServerInfo.host}/api/rpc`)));
  await afterTime(100);
  await expect(vio.viewerNumber).toBe(3);

  await wsList[0].close();
  await afterTime(100);
  await expect(vio.viewerNumber).toBe(2);
  wsList[1].close();
  await server.close();

  await afterTime(100);
  expect(vio.viewerNumber).toBe(0);
});
async function connectWs(url: string) {
  return new Promise<any>((resolve, reject) => {
    //@ts-ignore
    const ws = new WebSocket(url);
    ws.onopen = () => {
      resolve(ws);
      ws.onerror = null;
    };
    ws.onerror = (e: any) => {
      reject(e);
    };
  });
}
