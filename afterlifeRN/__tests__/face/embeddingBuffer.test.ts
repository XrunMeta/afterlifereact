import { v_4f64ba } from "../../src/face/embeddingBuffer";

it("push 6개 → latest(5)는 최근 5개", () => {
  const v_83ee53 = new v_4f64ba();
  for (let v_ebec57 = 0; v_ebec57 < 6; v_ebec57++) v_83ee53.push([v_ebec57]);
  const v_1300ee = v_83ee53.latest(5);
  expect(v_1300ee).toHaveLength(5);
  expect(v_1300ee.map((v_81e2ef) => v_81e2ef[0])).toEqual([1, 2, 3, 4, 5]);
});

it("latest(3)은 최신순 3개", () => {
  const v_83ee53 = new v_4f64ba();
  for (let v_ebec57 = 0; v_ebec57 < 6; v_ebec57++) v_83ee53.push([v_ebec57]);
  const v_1300ee = v_83ee53.latest(3);
  expect(v_1300ee.map((v_81e2ef) => v_81e2ef[0])).toEqual([3, 4, 5]);
});

it("push 개수가 5 미만이면 latest(5)는 있는 만큼만 반환", () => {
  const v_83ee53 = new v_4f64ba();
  v_83ee53.push([10]);
  v_83ee53.push([20]);
  expect(v_83ee53.latest(5)).toEqual([[10], [20]]);
});
