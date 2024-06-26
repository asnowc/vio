import { expect } from "vitest";
import { afterTime } from "evlib";
import { vioServerTest as test } from "./_env/test_port.ts";

test("connect-disconnect", async function ({ vio, connector }) {
  const { cpc } = connector;
  expect(vio.viewerNumber).toBe(1);

  await Promise.all([cpc.disable(), cpc.caller.end()]);

  expect(vio.viewerNumber).toBe(0);
});
test("connect-dispose", async function ({ vio, connector }) {
  const { cpc } = connector;
  expect(vio.viewerNumber).toBe(1);

  cpc.dispose();
  await afterTime(100);
  expect(vio.viewerNumber).toBe(0);
});
