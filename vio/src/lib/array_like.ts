export function assignArrayLike<T, V extends IndexRecord<T>>(to: V, form: ArrayLike<T>): V {
  for (let i = 0; i < form.length; i++) {
    to[i] = form[i];
  }
  return to;
}
export function indexRecordToArray<T>(form: IndexRecord<T>): T[] {
  const length = form.length;
  let arr = new Array<T>(length);
  for (let i = 0; i < length; i++) {
    arr[i] = form[i];
  }
  return arr;
}
export type IndexRecord<T> = {
  readonly length: number;
  [n: number]: T;
};
