export * from "./tty.tsx";
export * from "./chart.tsx";
import { VioTty } from "./tty.tsx";
import { VioChart } from "./chart.tsx";
import { VioTablePanel } from "./table.tsx";
const panels = {
  VioTty,
  VioChart,
  VioTable: VioTablePanel,
};
export default panels;
type PanelsName = { [key in keyof typeof panels]: string };
//@ts-ignore
export const panelsName: PanelsName = Object.keys(panels).reduce((v, key) => {
  //@ts-ignore
  v[key] = key;
  return v;
}, {});

export { panelsName as panels };
