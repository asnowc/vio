import { createContext } from "react";

export class ErrorCollector {
  constructor() {}
  error(...args: any[]) {
    console.log();
  }
}

export const errorCollector = createContext<ErrorCollector>(new ErrorCollector());
