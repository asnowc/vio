import { TtyReader, TtyCenter } from "@asla/vio";
import { expect, describe, test, vi } from "vitest";
function createTtyCenter() {
  return new TtyCenter(vi.fn());
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
  test("setReader(): tty创建前和创建后分别设置", async function () {
    const ttyCenter = createTtyCenter();
    const r1 = createTtyReaderMock();
    const r2 = createTtyReaderMock();

    const resolver1 = ttyCenter.setReader(1, r1); //创建前设置
    const tty1 = ttyCenter.get(1);
    const tty2 = ttyCenter.get(2);
    const resolver2 = ttyCenter.setReader(2, r2); //创建后设置

    let promise1 = tty1.read({ data: "a1" });
    let promise2 = tty2.read({ data: "a2" });
    const arg1 = r1.read.mock.calls[0];
    const arg2 = r2.read.mock.calls[0];

    expect(arg1[2]).toEqual({ data: "a1" });
    expect(arg2[2]).toEqual({ data: "a2" });

    resolver1.resolve(arg1[1], 1);
    resolver2.resolve(arg2[1], 2);

    await expect(promise1).resolves.toBe(1);
    await expect(promise2).resolves.toBe(2);
  });

  test("dispose_tty", async function () {
    const ttyCenter = createTtyCenter();

    const r1 = createTtyReaderMock();
    r1.read.mockImplementation(async (ttyId, requestId, data) => {
      resolver1.resolve(requestId, (data as any).data);
    });

    const resolver1 = ttyCenter.setReader(1, r1);

    let tty1 = ttyCenter.get(1);
    let p1 = tty1.read({ data: 888 }); //在 tty 被 dispose() 之前发送读取请求，resolver1.resolver() 有效
    ttyCenter.delete(tty1); //删除后重新创建
    await expect(tty1.read({ data: 777 }), "在 tty1 dispose() 后发送读取请求，会被拒绝").rejects.toThrowError();
    await expect(p1, "tty 被删除时请求已发送, Resolve 仍有效").resolves.toBe(888);

    tty1 = ttyCenter.get(1); // 重新创建一个 tty, resolver1 应仍有效
    await expect(tty1.read({ data: 999 })).resolves.toBe(999);
  });
  test("dispose_reader", async function () {
    const ttyCenter = createTtyCenter();
    let tty1 = ttyCenter.get(1);

    const r1 = createTtyReaderMock();
    const resolver1 = ttyCenter.setReader(1, r1);
    const p1 = tty1.read({ data: 111 }); // dispose 前读取，控制器 read 方法会被调用
    expect(resolver1.waitingSize).toBe(1);
    resolver1.dispose();
    expect(resolver1.waitingSize, "p1 请求 被转移到 tty 上等待").toBe(0);
    const p2 = tty1.read({ data: 222 }); // dispose 后读取，控制器 read 方法不会被调用，请求保存在 tty 上

    expect(r1.read).toBeCalledTimes(1);

    const r2 = createTtyReaderMock();
    const resolver2 = ttyCenter.setReader(1, r2);
    expect(resolver2.waitingSize, "从 tty 上转移的 p1 和 p2").toBe(2);
    expect(r2.read, "从 tty 上转移的 p1 请求调用").toBeCalledTimes(2);

    const requestId1 = r1.read.mock.calls[0][1];
    const requestId2 = r2.read.mock.calls[0][1];
    expect(
      resolver1.resolve(requestId1, 100),
      "resolver1 的 p1 请求已被转移到 resolver2, resolve() 方法返回 false",
    ).toBe(false);
    expect(resolver2.resolve(requestId2, 999)).toBe(true);

    await expect(p1, "由 resolver2 解决的结果为 1").resolves.toBe(999);
  });
  test("update_reader", async function () {
    const ttyCenter = createTtyCenter();
    let tty1 = ttyCenter.get(1);

    const reader1 = createTtyReaderMock();
    const resolver1 = ttyCenter.setReader(1, reader1);
    const p1 = tty1.read({ data: 111 });

    const reader2 = createTtyReaderMock();
    const resolver2 = ttyCenter.setReader(1, reader2); //tty1 的读取权交给 resolver2

    expect(reader1.dispose).toBeCalled();
    expect(resolver1.waitingSize, "请求被转移到 resolver2 上").toBe(0);

    const p2 = tty1.read({ data: 222 });

    expect(reader2.read, "reader1 被 reader2 替换，read 方法不会被调用").toBeCalledTimes(2);

    const requestId1 = reader1.read.mock.calls[0][1];
    expect(resolver1.resolve(requestId1, 111), "已被转移，无法解决").toBe(false);

    const calls = reader2.read.mock.calls;
    const requestId2_1 = calls[0][1];
    const requestId2_2 = calls[1][1];
    expect(resolver2.resolve(requestId2_1, 111)).toBe(true);
    expect(resolver2.resolve(requestId2_2, 222)).toBe(true);

    await expect(p1).resolves.toBe(111);
    await expect(p2).resolves.toBe(222);
  });

  test("极端的同步设置", function () {
    const ttyCenter = createTtyCenter();
    let tty1 = ttyCenter.get(9);
    const reader1 = createTtyReaderMock();
    ttyCenter.setReader(9, {
      read: () => {},
      dispose: () => {
        ttyCenter.setReader(9, reader1);
      },
    });

    const reader2 = createTtyReaderMock();
    ttyCenter.setReader(9, reader2);

    expect(reader2.dispose).toBeCalled();
    expect(reader1.dispose).not.toBeCalled();
  });
}, 1000);

function createTtyReaderMock() {
  return { read: vi.fn(), dispose: vi.fn() } satisfies TtyReader;
}
