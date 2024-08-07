import { StepTask, GetStepRes,  StepGroup, TaskDebuggerRunner } from "../../src/vio/vio_object/mod.private.ts";
import { test as viTest, expect, vi } from "vitest";
async function* b(a: number, b: number) {
  yield "b1";
  yield "b2";
  yield "b3";
  return a + b;
}
async function* a(): StepTask<number> {
  yield "a1";
  const res: GetStepRes<ReturnType<typeof b>> = yield new  StepGroup(b(1, 2), "in");
  yield "a2";
  yield "a3";

  return res;
}
interface Context {
  runner: TaskDebuggerRunner<any>;
}
const test = viTest.extend<Context>({
  async runner({}, use) {
    use(new TaskDebuggerRunner());
  },
});
test("子任务调用", async function ({ runner }) {
  const res = await runner.run(a());
  expect(res).toBe(3);
});

async function* effect(clearEffect: () => {}, deep = true): StepTask<number> {
  try {
    if (deep) yield new  StepGroup(effect(clearEffect, false));
    yield 2;
    yield 3;
    yield 4;
    return 6;
  } finally {
    clearEffect();
  }
}
test("clear effect", async function ({ runner }) {
  const fn = vi.fn();
  const res = runner.run(effect(fn));

  runner.addBreakPoint((deep, data) => {
    const res = deep === 1 && data === 2;
    return res;
  });
  await runner.pausedEvent;

  const err = new Error("error--");
  runner.abort(err);

  await expect(res).rejects.toBe(err);
  expect(fn).toBeCalledTimes(2);
});

test("pause", async function ({ runner }) {
  const res = runner.run(a(), "root");
  runner.pause();
  await runner.pausedEvent;

  expect(runner.getStackList()).toEqual(["a1"]);
  runner.continue();
  await expect(res).resolves.toBe(3);
});
test("next", async function ({ runner }) {
  const res = runner.run(a(), "root");
  runner.next();
  await runner.pausedEvent;
  expect(runner.getStackList()).toEqual(["a1"]);

  runner.next();
  await runner.pausedEvent;
  expect(runner.getStackList(), "in-start").toEqual(["in"]);

  runner.next();
  await runner.pausedEvent;
  expect(runner.getStackList(), "in-end").toEqual(["in"]);

  runner.next();
  await runner.pausedEvent;
  expect(runner.getStackList()).toEqual(["a2"]);

  runner.next();
  await runner.pausedEvent;
  expect(runner.getStackList()).toEqual(["a3"]);

  runner.next();
  await expect(res).resolves.toBe(3);
});

test("nextIn-nextOut", async function ({ runner }) {
  const res = runner.run(a(), "root");

  runner.nextIn();
  await runner.pausedEvent;
  expect(runner.getStackList()).toEqual(["a1"]);

  runner.nextIn();
  await runner.pausedEvent;
  expect(runner.getStackList()).toEqual(["in"]);

  runner.nextIn();
  await runner.pausedEvent;
  expect(runner.getStackList()).toEqual(["b1", "in"]);

  runner.nextOut();
  await runner.pausedEvent;
  expect(runner.getStackList()).toEqual(["in"]);

  runner.next();
  await runner.pausedEvent;
  expect(runner.getStackList()).toEqual(["a2"]);

  runner.continue();
  await expect(res).resolves.toBe(3);
});
