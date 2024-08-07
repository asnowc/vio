import { GetStepRes, StepGroup, StepTask, Vio } from "@asla/vio";

function afterTime(time?: number) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, time);
  });
}
async function* ppe() {
  yield "p2";
  await afterTime(1000);
  yield "p3";
}
async function* subTask(a: number, b: number) {
  yield "b1";
  await afterTime(1000);
  yield new StepGroup(ppe(), "ppe");
  await afterTime(1000);
  yield "b2";
  await afterTime(1000);
  yield "b3";
  await afterTime(1000);
  return a + b;
}
async function* parenTask(i: number): StepTask<number> {
  await afterTime(1000);
  yield "--" + i;
  let res: GetStepRes<ReturnType<typeof subTask>> = yield new StepGroup(subTask(1, 2), "subTask");
  yield "a2";
  await afterTime(1000);
  yield "a3";
  await afterTime(1000);
  res = yield new StepGroup(subTask(9, 9), "subTask");

  return res;
}
export async function runTask(vio: Vio) {
  let i = 0;
  while (true) {
    await vio.object.runStepTask(parenTask(i++), { pause: true });
  }
}
