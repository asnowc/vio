import { SelectItem } from "@asnc/vio";
import { vioServerTest as test, waitPageConnect } from "../../test.ts";
const { expect, beforeEach, describe } = test;

describe("test content", function () {
  beforeEach(async ({ appPage: page, vioServerInfo: { visitUrl } }) => {
    await page.goto(visitUrl);
    await waitPageConnect(page);
    await page.getByRole("switch").click(); //开启接收请求
  });
  test("input text", async function ({ appPage: page, vioServerInfo: { vio } }) {
    const tty = vio;
    const p1 = tty.readText();

    await page.getByPlaceholder("输入文本").click();
    await page.getByPlaceholder("输入文本").fill("12345"); //输入
    await page.getByRole("button", { name: "发送" }).click(); //发送

    await expect(p1).resolves.toBe("12345");
  });
  test("confirm", async function ({ appPage: page, vioServerInfo: { vio } }) {
    const tty = vio;
    const p1 = tty.confirm("请求确认");
    await page.getByRole("button", { name: "是" }).click(); //发送

    await expect(p1).resolves.toBe(true);
  });
  test("select", async function ({ appPage: page, vioServerInfo: { vio } }) {
    const tty = vio;
    const sendBtn = page.getByRole("button", { name: "发送" });

    const options: SelectItem[] = [
      { label: "111", value: 1 },
      { label: "222", value: 2 },
      { label: "333", value: 3 },
    ];

    // 单选
    const p1 = tty.pick("选择一项", options);
    await page.getByLabel("333").check();
    await sendBtn.click(); //p1 发送
    await expect(p1).resolves.toBe(3);

    // 多选但不选择
    const p2 = tty.select("选择多项", options);
    await sendBtn.click(); //p2 发送,
    await expect(p2, "多选没有选择").resolves.toEqual([]);

    // 多选，限定数量
    const p3 = tty.select("选择多项", options, { min: 1, max: 2 });
    await expect(sendBtn, "选择数量少于设定的值，发送按钮应被禁用").toBeDisabled();

    await page.getByLabel("111").check();
    await page.getByLabel("222").check();
    await page.getByLabel("333").check();

    await expect(sendBtn, "选择超过设定的值，发送按钮应被禁用").toBeDisabled();
    await page.getByLabel("333").uncheck();

    await sendBtn.click();
    await expect(p3).resolves.toEqual([1, 2]);
  });
  test.skip("file", async function ({ appPage: page, vioServerInfo: { vio } }) {
    const tty = vio;
    //TODO
  });
});
describe("reading dispatch", function () {
  beforeEach(async ({ appPage: page, vioServerInfo: { visitUrl } }) => {
    await page.goto(visitUrl);
    await waitPageConnect(page);
  });
  test("夺取输入权", async function ({ vioServerInfo: { vio, visitUrl }, appPage: page, createAppPage }) {
    await page.getByRole("switch").click(); // 开启接收输入

    let p1 = vio.confirm("c1"); // 请求发送到 page1

    const page2 = await createAppPage();
    await page2.goto(visitUrl);

    await page2.getByRole("switch").click(); // page2 开启接收输入请求，page1 的输入权被夺走

    await expect(page.getByRole("switch")).not.toBeChecked();

    let p2 = vio.confirm("c2");

    await expect(page.getByRole("button", { name: "是" }).count()).resolves.toBe(0);

    const butNo = page2.getByRole("button", { name: "否" });
    await expect(butNo.count()).resolves.toBe(2);
    await butNo.first().click();
    await butNo.click();

    await expect(p2).resolves.toBe(false);
    await expect(p1).resolves.toBe(false);
  });
  /**
   * 有时候请求已经发送到客户端，但客户端在断开连接前没有响应读取请求。如果有客户端获取输入权，改读取请求应被重新发送
   */
  test("读取请求重发", async function ({ appPage: page, vioServerInfo: { vio } }) {
    await page.getByRole("switch").click(); // 开启接收输入
    const p1 = vio.confirm("yes or no?");

    await page.getByRole("button", { name: "是" }).waitFor({ state: "visible" });
    await page.reload();
    await page.getByRole("switch").click(); // 开启接收输入
    await page.getByRole("button", { name: "否" }).click();

    await expect(p1).resolves.toBe(false);
  });
});
