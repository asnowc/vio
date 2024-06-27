import { useRef } from "react";

export function usePrevValue<T>(value: T) {
  const ref = useRef<T>();
  const oldValue = ref.current;
  ref.current = value;
  return oldValue;
}
function objectIsEqual(obj1: any, obj2: any) {
  if (obj1 === obj2) return true;
  if (typeof obj1 !== "object" || typeof obj2 !== "object") return obj1 === obj2;
  if (obj1 === null) return obj1 === obj2;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;

  for (let i = 0; i < keys2.length; i++) {
    if (obj1[keys2[i]] !== obj2[keys2[i]]) return false;
  }
  return true;
}
