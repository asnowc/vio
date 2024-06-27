import { useReducer } from "react";

export function useForceUpdate() {
  return useReducer(() => ({}), {})[1];
}
