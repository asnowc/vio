import { Page } from "@playwright/test";
import { vioServerTest as test, waitPageConnect } from "../../test.ts";
import { E2E_SELECT_CLASS } from "../e2e_select_class.ts";
const { expect, beforeEach, describe } = test;

beforeEach(async ({ appPage: page, vioServerInfo: { visitUrl, vio } }) => {
  await page.goto(visitUrl);
  await waitPageConnect(page);
  const tty = vio.tty.get(0);

  const cmdFn = (args: any, info: { command: string }) => {
    vio.log("log-" + info.command, args);
  };

  tty.setCommand("cmd.test-0", { description: "desc:test-0", call: cmdFn });
  tty.setCommand("cmd.test-1", {
    description: "desc:test-0",
    args: [
      { key: "txt", type: { type: "text" } },
      {
        key: "select",
        type: {
          type: "select",
          options: [
            { value: 1, label: "选项1" },
            { value: 2, label: "选项2" },
          ],
          title: "xx",
        },
      },
    ],
    call: cmdFn,
  });
  tty.setCommand("cmd.search-0", { description: "desc:search-0", call: cmdFn });
  tty.setCommand("cmd.search-1", { description: "desc:search-0", call: cmdFn });
});
test("search-exec-cmd-no-args", async function ({ appPage: page, vioServerInfo: { vio } }) {
  const ttyPanel = page.locator(`.${E2E_SELECT_CLASS.panels.tty_output}`);

  await page.getByRole("button", { name: "right" }).click();

  await page.locator("span", { hasText: "cmd.test-0" }).click();

  await page.getByRole("button", { name: "right" }).click();
  await page.locator("#rc_select_1").fill("search");
  await page.locator("#rc_select_1").press("ArrowDown");
  await page.locator("#rc_select_1").press("Enter");

  await expect(ttyPanel.getByText("log-cmd.test-0")).toHaveCount(1);
  await expect(ttyPanel.getByText("log-cmd.search-1")).toHaveCount(1);
});
test("带参数", async function ({ appPage: page, vioServerInfo: { vio } }) {
  const ttyPanel = page.locator(`.${E2E_SELECT_CLASS.panels.tty_output}`);
  await page.getByRole("button", { name: "right" }).click();

  await page.locator("span").filter({ hasText: "cmd.test-1" }).click();
  await page.getByPlaceholder("输入文本").click();
  await page.getByPlaceholder("输入文本").fill("1111");
  await page.getByLabel("选项1").check();
  await page.getByRole("button", { name: "执 行" }).click();

  await expect(ttyPanel.getByText('{ "txt": "1111", "select": [ 1 ] }')).toHaveCount(1);
});
