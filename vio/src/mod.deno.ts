export * from "./mod.ts";
export { default } from "./vio/mod.ts";
import { platformApi } from "./server/platform_api.ts";
import api from "./compat/platform_api.deno.ts";

Object.assign(platformApi, api);
