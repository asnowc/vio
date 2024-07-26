export * from "./mod.ts";
export { default } from "./vio/mod.ts";
import { runtimeEngine } from "evlib";
import { platformApi } from "./server/platform_api.ts";

if (runtimeEngine === "deno") {
  // deno 可能导入 npm:@asla/vio
  const mod = await import("./compat/platform_api.deno.ts" as string); // 跳过类型检查
  Object.assign(platformApi, mod.default);
} else {
  const mod = await import("./compat/platform_api.node.ts");
  Object.assign(platformApi, mod.default);
}
