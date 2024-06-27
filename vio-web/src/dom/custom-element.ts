// customElements.define("grid", HTMLDivElement);
class FlexColElement extends HTMLElement {}
class FlexRowElement extends HTMLElement {}
customElements.define("flex-col", FlexColElement);
customElements.define("flex-row", FlexRowElement);

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "flex-col": JSX.IntrinsicElements["div"];
      "flex-row": JSX.IntrinsicElements["div"];
      grid: JSX.IntrinsicElements["div"];
    }
  }
}
const style_dom = document.createElement("style");
document.head.appendChild(style_dom);
const sheet = style_dom.sheet;
if (!sheet) console.error("Unable create style sheet");
else {
  sheet.insertRule(`
flex-col {
  display: flex;
  flex-direction: column;
}`);
  sheet.insertRule(`
flex-row {
  display: flex;
  flex-direction: row;
}`);
}

export {};
