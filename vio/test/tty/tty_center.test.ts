import { createMockClientApi } from "../_env/test_port.ts";
import { TtyCenterImpl } from "../../src/vio/tty/_TtyCenter.ts";
import { expect, describe, test, vi } from "vitest";

function createTtyCenter() {
  const mock = createMockClientApi().tty;
  return new TtyCenterImpl(mock);
}
test("create", function () {
  const ttyCenter = createTtyCenter();
  function getList() {
    return Array.from(ttyCenter.getAll());
  }
  expect(getList().length).toBe(0);

  const tty = ttyCenter.get(2);
  const tty2 = ttyCenter.get(2);
  expect(tty).toBe(tty2);
  expect(getList().length).toBe(1);

  const tty3 = ttyCenter.get(3);
  expect(getList()).toEqual([tty, tty3]);

  expect(ttyCenter.delete(tty2), "删除成功，返回true").toBe(true);
  expect(ttyCenter.delete(tty2), "实例已删除，应返回false").toBe(false);

  expect(getList()).toEqual([tty3]);
});
describe("reader", function () {
  test("dispose_tty", async function () {
    const mock = createMockClientApi().tty;
    const ttyCenter = new TtyCenterImpl(mock);

    let tty1 = ttyCenter.get(1);
    let p1 = tty1.read({ data: 888 });
    ttyCenter.delete(tty1); //删除后重新创建
    await expect(tty1.read({ data: 777 }), "在 tty1 dispose() 后发送读取请求，会被拒绝").rejects.toThrowError();
    await expect(p1, "tty 已被删除").rejects.toThrowError();
  });
}, 1000);
