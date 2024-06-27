import { BrowserContext, Page, test } from "@playwright/test";
import { Vio, createVio, VioHttpServer } from "@asnc/vio";
import process from "node:process";
import { webServerInfo } from "./playwright.ci.config.ts";
const visitUrl = `http://${webServerInfo.hostname}:${webServerInfo.port}`;
export interface Context {
  visitUrl: string;
  appPage: Page;
  vioServerInfo: { port: number; hostname: string };
  vio: Vio;
}
const VIO_SERVER_BASE_PORT = 7001;
export const vioServerTest = test.extend<Context>({
  visitUrl({}, use) {
    return use(visitUrl);
  },
  vioServerInfo({}, use) {
    const port = VIO_SERVER_BASE_PORT + parseInt(process.env.TEST_PARALLEL_INDEX!);
    return use({ port, hostname: "127.0.0.1" });
  },
  async vio({ vioServerInfo }, use) {
    const vio = createVio();
    const vioServer = new VioHttpServer(vio);
    await vioServer.listen(vioServerInfo.port, vioServerInfo.hostname);
    await use(vio);
    await vioServer.close();
  },
  async appPage({ context, vioServerInfo }, use) {
    const page = await createAppPage(context, vioServerInfo);
    await use(page);
  },
});
export async function createAppPage(context: BrowserContext, info: Context["vioServerInfo"]) {
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
