import { addUiAction, addUiInput, addUiOutput, UiAction, UiOutput } from "./_base.ts";
/** @public */
export class UiButton implements UiAction {
  constructor(
    readonly key: string,
    props?: UiButton["props"],
  ) {
    this.props = props;
  }
  readonly ui = "button";
  props?: {
    icon?: string;
    text?: string;
    type?: string;
    tooltip?: string;

    disable?: boolean;
  };
}
addUiAction("button");

/** @public */
export type UiTag = UiOutput & {
  ui: "tag";
  props: {
    text?: string;
    icon?: string;
    color?: string;
  };
};
addUiOutput("tag");
