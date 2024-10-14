export function JsData(props: { children?: any }) {
  const { children: object } = props;
  switch (typeof object) {
    case "object":
      //TODO
      return JSON.stringify(object, null, 2);
    case "function":
      return String(object);
    default:
      return String(object);
  }
}
