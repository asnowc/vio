import { createContext, useContext } from "react";
import { MessageInstance } from "antd/es/message/interface.js";
import { NotificationInstance } from "antd/es/notification/interface.js";

const antdStaticContext = createContext<{ message: MessageInstance; notice: NotificationInstance }>(undefined as any);
export const AntdStaticProvider = antdStaticContext.Provider;

export function useAntdStatic() {
  return useContext(antdStaticContext);
}
