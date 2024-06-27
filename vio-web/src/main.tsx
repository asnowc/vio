/// <reference types="vite/client" />
import { createRoot } from "react-dom/client";
import React from "react";
import App from "./app.tsx";
import "./dom/custom-element.ts";

function mount(app: React.ReactNode) {
  const domNode = document.getElementById("root")!;
  const appRoot = createRoot(domNode);
  appRoot.render(app);
}
mount(<App />);
