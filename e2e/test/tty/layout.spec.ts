import { vioServerTest as test } from "../../test.ts";
const { beforeAll, beforeEach, expect } = test;

beforeEach(async function ({ visitUrl, page }) {
  await page.goto(visitUrl);
});
test("saveLayout", async function ({ page, context }, info) {
  await page.locator("path").first().click();
  await page.getByRole("button", { name: "打 开" }).click();
  await page.getByRole("button", { name: "打 开" }).click();
  await page.getByText("TTY 2").dragTo(await page.getByRole("button", { name: "vertical-align-bottom" }));
  await page.getByRole("button", { name: "save" }).click();

  await page.reload({ waitUntil: "domcontentloaded" });
  await new Promise((resolve) => page.once("console", resolve)); //等待页面载入
  await expect(page.getByText("TTY 0").count()).resolves.toBe(1);
  await expect(page.getByText("TTY 1").count()).resolves.toBe(1);
  await expect(page.getByText("TTY 2").count()).resolves.toBe(1);
});
