import { test, vi } from "vitest";
import { Vio, VioHttpServer, createVio } from "@asla/vio";
import process from "node:process";
import { CpCall, MakeCallers, createWebSocketCpc } from "cpcall";
import { connectWebsocket } from "../../src/lib/websocket.ts";
import "@asla/vio";
import { VioClientExposed, VioServerExposed } from "../../src/client.ts";
const BASE_PORT = 7001;
const VITEST_POOL_ID = parseInt(process.env.VITEST_POOL_ID ?? "0");
export interface ClientConnector {
  cpc: CpCall;
  clientApi: ReturnType<typeof createMockClientApi>;
  serverApi: MakeCallers<VioServerExposed>;
}
export interface VioServerTestContext {
  vio: Vio;
  vioServerInfo: { port: number; hostname: string; host: string };
  connectVioSever: () => Promise<ClientConnector>;
  connector: ClientConnector;
}

export const vioServerTest = test.extend<VioServerTestContext>({
  async vioServerInfo({}, use) {
    const port = BASE_PORT + VITEST_POOL_ID;
    const hostname = "127.0.0.1";
    await use({ port, hostname, host: hostname + ":" + port });
  },
  async vio({ vioServerInfo }, use) {
    const vio = createVio();
    const server = new VioHttpServer(vio);
    await server.listen(vioServerInfo.port, vioServerInfo.hostname);
    await use(vio);
    await server.close();
  },
  async connectVioSever({ vioServerInfo, vio }, use) {
    await use(async () => {
      return connectVioServer(vioServerInfo.host);
    });
  },
  async connector({ vioServerInfo, vio }, use) {
    const connector = await connectVioServer(vioServerInfo.host);
    await use(connector);
  },
});

function connectRpc(host: string) {
  return connectWebsocket(`ws://${host}/api/rpc`).then((ws) => createWebSocketCpc(ws));
}
export async function connectVioServer(host: string) {
  const cpc = await connectRpc(host);

  const clientApi = createMockClientApi();
  cpc.exposeObject(clientApi);
  const serverApi: MakeCallers<VioServerExposed> = cpc.genCaller<VioServerExposed>();

  cpc.onClose.catch(() => {});

  return { cpc, clientApi, serverApi };
}

export function createMockClientApi() {
  return {
    object: {
      createObject: vi.fn(),
      deleteObject: vi.fn(),

      writeChart: vi.fn(),

      tableChange: vi.fn(),
      updateTable: vi.fn(),
    },
    tty: {
      sendTtyReadRequest: vi.fn(),
      writeTty: vi.fn(),
      cancelTtyReadRequest: vi.fn(),
    },
  } satisfies VioClientExposed;
}
