export function connectWebsocket(config: WsConnectConfig | string): Promise<WebSocket> {
  return new Promise(function (resolve, reject) {
    let url: string;

    if (typeof config === "object") {
      const { host = location.host, path = "/", proto = "ws" } = config;
      url = proto + "://" + host + path;
    } else url = config;

    const ws = new WebSocket(url);
    ws.onerror = reject;
    ws.onopen = () => {
      Reflect.deleteProperty(ws, "onerror");
      Reflect.deleteProperty(ws, "onopen");
      resolve(ws);
    };
  });
}
export type WsConnectConfig = {
  proto?: "ws" | "wss";
  host?: string;
  path?: string;
};
