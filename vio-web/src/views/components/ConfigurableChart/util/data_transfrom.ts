import { ChartDataItem } from "@asla/vio";

function parseDate(timestamp: number) {
  const date = new Date(timestamp);
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDay(),
    h: date.getHours(),
    m: date.getMinutes(),
    s: date.getSeconds(),
    ms: date.getMilliseconds(),
    timestamp: date.getTime(),
  };
}
export function formatTime(item: Readonly<ChartDataItem<unknown>>, size: number = 1, range: number = 0) {
  let name = item.timeName;
  if (!name) {
    let date = parseDate(item.timestamp);
    if (size === 1 || range === 0) return new Date(item.timestamp).toLocaleString();

    if (range <= 1000 * 30)
      return `${date.s}-${date.ms}`; // 半分钟以内
    else if (range <= 1000 * 60 * 30)
      return `${date.m}:${date.s}-${date.ms}`; // 半小时以内
    else if (range <= 1000 * 3600 * 12)
      return `${date.h}:${date.m}:${date.s}`; //半天以内
    else if (range <= 1000 * 86400 * 15) return `${date.day} ${date.h}:${date.m}}`; //15天以内
    name = new Date(item.timestamp).toLocaleString();
  }
  return name;
}
export function insertToArrBefore<T>(arr: T[], item: T, index: number): T[] {
  let len = arr.length + 1;
  let newArr = new Array(len);
  let i: number;
  for (i = 0; i < index; i++) {
    newArr[i] = arr[i];
  }
  newArr[index] = item;
  for (i = index; i < len; i++) {
    newArr[i + 1] = arr[i];
  }
  return newArr;
}
