import { vioServerTest as test } from "../../test.ts";
import { afterTime } from "evlib";
const { expect, beforeEach } = test;

beforeEach(async ({ appPage, vioServerInfo: { vio, visitUrl } }) => {
  vio; // 依赖 vio, 必须先启动 vio 服务器
  await appPage.goto(visitUrl);
});
test("output text", async function ({ vioServerInfo: { vio: tty }, appPage: page }) {
  await afterTime(1000); //等待连接
  expect(tty.viewerNumber).toBe(1);

  tty.writeText("default title");
  tty.writeText("warn title", "warn");
  tty.writeText("error title", "error");
  tty.writeText("info title", { msgType: "info", content: "this is a content" });
  const textFlag = " title";
  await expect(page.getByText(textFlag).count(), "内容被输出").resolves.toBe(4);

  await page.getByRole("button", { name: "warning" }).click(); //过滤警告
  await expect(page.getByText("warn title").count(), "警告被隐藏").resolves.toBe(0); //
  await expect(page.getByText(textFlag).count(), "警告被隐藏，其余显示").resolves.toBe(3);
});

test.skip("output image", async function ({ vioServerInfo: { vio: tty } }) {
  tty.writeImage;
});
test.skip("output ui link", async function ({ vioServerInfo: { vio: tty } }) {
  tty.writeUiLink;
});

test("recover output", async function ({ vioServerInfo: { vio }, appPage: page }) {
  //打开 tty1
  await page.locator("svg").first().click();
  await page.getByRole("button", { name: "打 开" }).click();
  const tty = vio.tty.get(1);

  const textFlag = " title";
  tty.writeText("default title");
  tty.writeText("warn title", "warn");
  await afterTime(1000);

  await expect(page.getByText(textFlag).count(), "内容被输出").resolves.toBe(2);

  await page.getByRole("button", { name: "clear" }).click(); //清除历史
  await expect(page.getByText(textFlag).count(), "输出缓存被清空").resolves.toBe(0);

  await page.locator("flex-col > flex-col > div > div").first().click(); //断开连接
  await expect(page.getByRole("button", { name: "history" })).toBeDisabled(); //按钮被禁用

  await page.reload();

  //打开 tty1
  await page.locator("svg").first().click();
  await page.getByRole("button", { name: "打 开" }).click();
  await afterTime(500); // 等待连接成功

  await page.getByRole("button", { name: "history" }).click(); //从服务器恢复
  await expect(page.getByText(textFlag).count(), "从服务器恢复缓存").resolves.toBe(2);
});
