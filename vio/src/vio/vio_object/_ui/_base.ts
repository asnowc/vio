/** @public */
export interface UiBase {
  ui: string;
}

/** @public */
export interface UiInput extends UiBase {}

/** @public */
export interface UiOutput extends UiBase {}

/** @public */
export interface UiAction extends UiBase {
  key: string;
  // onTrigger?(): void;
}

const INPUT = new Set();
export function addUiInput(key: string) {
  INPUT.add(key);
}
export function isUiInput(uiObject: UiBase): UiInput | undefined {
  if (INPUT.has(uiObject.ui)) return uiObject as UiInput;
}

const OUTPUT = new Set();
export function addUiOutput(key: string) {
  OUTPUT.add(key);
}
export function isUiOutput(uiObject: UiBase): UiOutput | undefined {
  if (OUTPUT.has(uiObject.ui)) return uiObject as UiOutput;
}

const ACTION = new Set();
export function addUiAction(key: string) {
  ACTION.add(key);
}
export function isUiAction(uiObject: UiBase): UiAction | undefined {
  if (ACTION.has(uiObject.ui)) return uiObject as UiAction;
}
