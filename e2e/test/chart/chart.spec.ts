import { vioServerTest as test, waitPageConnect } from "../../test.ts";
import { afterTime } from "evlib";
import { E2E_SELECT_CLASS } from "../e2e_select_class.ts";
const { expect, beforeEach } = test;

beforeEach(async ({ appPage, vioServerInfo: { visitUrl } }) => {
  await appPage.goto(visitUrl);
});
test("二维折线图更新", async function ({ vioServerInfo: { vio }, appPage: page }) {
  const maxDiffPixelRatio = 0.02;
  const chart = vio.chart.create(2, { meta: { chartType: "line", enableTimeline: true, title: "图测试1" } });
  chart.updateData([2, 8]);
  chart.updateData([12, 3]);

  await page.getByLabel("dashboard").locator("svg").click();
  await page.getByRole("button", { name: "line-chart 图测试1" }).click(); // 打开面板
  const chartPanel = page.locator(`.${E2E_SELECT_CLASS.panels.chart}`);
  await expect(chartPanel.count(), "面板已打开").resolves.toBe(1);

  await expect(chartPanel, "读取到缓存").toHaveScreenshot({ maxDiffPixelRatio });

  chart.updateData([20, 22]);

  await afterTime(200);
  await expect(chartPanel, "更新图信息").toHaveScreenshot({ maxDiffPixelRatio });

  await page.getByRole("button", { name: "setting" }).click(); //打开设置面板
  await page.getByLabel("启用时间轴").click();
  await page.getByRole("button", { name: "close" }).click();

  await expect(chartPanel, "关闭时间轴后的图").toHaveScreenshot({ maxDiffPixelRatio });
});
test("创建与删除图", async function ({ vioServerInfo: { vio }, appPage: page }) {
  const chartPanel = page.locator(`.${E2E_SELECT_CLASS.panels.chart}`);

  await page.getByLabel("dashboard").locator("svg").click();

  const chart1 = vio.chart.create(2, { meta: { chartType: "bar", title: "abc图1", requestInterval: 1234 } });

  await page.getByRole("button", { name: chart1.meta.title! }).click(); // 打开面板
  await expect(chartPanel.count(), "图1面板已打开").resolves.toBe(1);

  const chart2 = vio.chart.create(1, { meta: { chartType: "gauge", title: "abc图2", requestInterval: 8769 } });
  await page.getByRole("button", { name: chart2.meta.title! }).click(); // 打开面板
  await page.getByRole("button", { name: "setting" }).click(); //打开设置面板
  await expect(page.getByLabel("自动请求更新间隔")).toHaveValue(chart2.meta.requestInterval!.toString()); //通过 requestInterval 判读面板属于 chart2

  vio.chart.disposeChart(chart1);
  await afterTime(100);
  await expect(page.getByRole("button", { name: chart1.meta.title! }).count(), "侧栏统计已被删除").resolves.toBe(0);
});
