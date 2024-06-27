import { test, expect, describe } from "vitest";
import { heightToLow, mapDimension } from "../../src/lib/calc_dimesion.ts";

const data = [
  [
    [1, 2, 3],
    [8, 1, 0],
    [5, 6, 4],
  ],
  [
    [11, 27, 3],
    [86, 16, 10],
    [52, 63, 4],
  ],
];

describe("heightToLow", function () {
  test("降二维", function () {
    const d2 = data[0];
    expect(heightToLow(d2, [0]), "选择0维").toEqual([1, 2, 3]);
    expect(heightToLow(d2, [, 1]), "选择1维").toEqual([2, 1, 6]);
    expect(heightToLow(d2, [1, 0])).toEqual(8);
  });
  test("顺序降三维", function () {
    expect(heightToLow(data, [0])).toEqual(data[0]);
    expect(heightToLow(data, [1, 2])).toEqual(data[1][2]);
    expect(heightToLow(data, [1, 0, 2])).toEqual(data[1][0][2]);
  });
  test("降三维", function () {
    expect(heightToLow(data, [, 1])).toEqual([
      [8, 1, 0],
      [86, 16, 10],
    ]);
    expect(heightToLow(data, [, , 2])).toEqual([
      [3, 0, 4],
      [3, 10, 4],
    ]);
    expect(heightToLow(data, [, 0, 1])).toEqual([2, 27]);
  });
});

describe("mapDimension", function () {
  const s2 = [
    [1, 3, 4, 5],
    [7, 8, 9, 10],
  ];

  test("正序二维", function () {
    const data = mapDimension(s2, 2, [0, 1]);

    expect(data).toEqual(s2);
  });
  test("置换二维", function () {
    const data = mapDimension(s2, 2, [1, 0]);

    expect(data).toEqual([
      [1, 7],
      [3, 8],
      [4, 9],
      [5, 10],
    ]);
  });

  const s3 = [
    [
      [1000, 1001, 1002, 1003],
      [1010, 1011, 1012, 1013],
      [1020, 1021, 1022, 1023],
    ],
    [
      [1100, 1101, 1102, 1103],
      [1110, 1111, 1112, 1113],
      [1120, 1121, 1122, 1123],
    ],
  ];
  test.skip("正序三维", function () {
    const data = mapDimension(s3, 3, [0, 1, 2]);

    expect(data).toEqual(s3);
  });
});
