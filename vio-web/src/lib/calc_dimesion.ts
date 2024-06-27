/**
 * 将数组降维. 返回选择维度的交点的集合
 */
export function heightToLow(data: any, selectedDimensions: (number | undefined)[]): any {
  let i = 0;
  for (; i < selectedDimensions.length; i++) {
    let k = selectedDimensions[i];
    if (k === undefined) break;
    data = data[k];
  }
  if (i === selectedDimensions.length) return data;

  const arr = new Array(data.length);
  selectedDimensions = selectedDimensions.slice(i + 1);
  for (let y = 0; y < arr.length; y++) {
    arr[y] = heightToLow(data[y], selectedDimensions);
  }

  return arr;
}
export function mapToDimensions(data: any, dimensionId: number) {
  if (dimensionId === 0) return data;

  const sub = data[dimensionId];
  let newArr = new Array(sub.length);
  for (let i = 0; i < sub.length; i++) {
    const newSub = new Array(data.length);
    newArr[i] = newSub;
    for (let y = 0; y < data.length; y++) {
      newSub[y] = data[y][i];
    }
  }
  return newArr;
}
/**
 * @param dimension 数组维数
 */
export function mapDimension(data: any[], dimension: number, sort: number[]) {
  if (data.length === 0) return [];
  if (dimension === 2) {
    if (sort[0] === 0) return data;
    const arr = new Array(data[0].length);
    for (let i = 0; i < arr.length; i++) {
      let sub = new Array(data.length);
      for (let j = 0; j < sub.length; j++) {
        sub[j] = data[j][i];
      }
      arr[i] = sub;
    }
    return arr;
  }
  throw new Error("no impl");
}
