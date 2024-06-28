import { vioServerTest as test, waitPageConnect, waitPageReady } from "../../test.ts";
const { beforeAll, beforeEach, expect } = test;

beforeEach(async function ({ vioServerInfo, appPage: page }) {
  await page.goto(vioServerInfo.visitUrl);
  await waitPageReady(page);
});
test("saveLayout", async function ({ appPage: page }, info) {
  await page.locator("path").first().click();
  await page.getByRole("button", { name: "打 开" }).click();
  await page.getByRole("button", { name: "打 开" }).click();
  await page.getByText("TTY 2").dragTo(await page.getByRole("button", { name: "vertical-align-bottom" }));
  await page.getByRole("button", { name: "save" }).click();

  await page.reload({ waitUntil: "domcontentloaded" });
  await new Promise((resolve) => setTimeout(resolve, 1000)); //等待页面载入
  await expect(page.getByText("TTY 0").count()).resolves.toBe(1);
  await expect(page.getByText("TTY 1").count()).resolves.toBe(1);
  await expect(page.getByText("TTY 2").count()).resolves.toBe(1);
});
