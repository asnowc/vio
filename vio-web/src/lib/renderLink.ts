type SinglyLinkList = {
  next?: SinglyLinkList;
};

export function mapQueue<T extends SinglyLinkList, R>(head: T | undefined, render: (item: T, index: number) => R): R[] {
  let item: SinglyLinkList | undefined = head;
  let size = 0;
  while (item) {
    size++;
    item = item.next;
  }
  const arr = new Array(size);
  let i = 0;
  item = head;
  while (item) {
    arr[i++] = render(item as T, i);
    item = item.next;
  }
  return arr;
}
export function mapIterable<T, R>(iter: Iterable<T>, fn: (item: T) => R): R[] {
  let arr = new Array();
  let i = 0;
  for (const item of iter) {
    arr[i++] = fn(item);
  }
  return arr;
}
