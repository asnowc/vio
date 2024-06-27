import { BrowserContext, Page, test } from "@playwright/test";
import { Vio, createVio, VioHttpServer } from "@asnc/vio";
import process from "node:process";
import { env } from "./playwright.ci.config.ts";

const { webServerInfo } = env;

export interface Context {
  appPage: Page;
  vioServerInfo: { port: number; hostname: string; visitUrl: string; vio: Vio };
  // 没什么用
  createAppPage(): Promise<Page>;
  getFreePort(): number;
}
const PROCESS_PORT_NUMBER = 10;
const VIO_SERVER_BASE_PORT = 7001;

export const vioServerTest = test.extend<Context>({
  async vioServerInfo({ getFreePort }, use) {
    const port = getFreePort();
    const hostname = "127.0.0.1";

    const vio = createVio();
    const vioServer = new VioHttpServer(vio);
    await vioServer.listen(port, hostname);

    await use({ port, hostname, visitUrl: `http://${hostname}:${port}`, vio });

    await vioServer.close();
  },

  async appPage({ createAppPage }, use) {
    const page = await createAppPage();
    await use(page);
  },
  async createAppPage({ context, vioServerInfo }, use) {
    await use(() => context.newPage());
  },
  async getFreePort({}, use) {
    const processIndex = parseInt(process.env.TEST_PARALLEL_INDEX!);
    let processPortBase = VIO_SERVER_BASE_PORT + processIndex * PROCESS_PORT_NUMBER;
    await use(() => {
      return processPortBase++;
    });
  },
});
async function createAppPage(context: BrowserContext, info: { port: number; hostname: string }) {
  const page = await context.newPage();
  await page.route(/\/config.json$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: mockConfig(info),
    });
  });
  return page;
}
function mockConfig(config: { port: number; hostname: string }) {
  return JSON.stringify({
    rpcConnect: {
      connectHost: `${config.hostname}:${config.port}`,
      autoConnect: true,
      reconnectTryMax: 2,
      wait: 1000,
    },
  });
}
