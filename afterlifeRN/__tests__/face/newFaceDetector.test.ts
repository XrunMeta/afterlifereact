import { v_6e58ce } from "../../src/face/newFaceDetector";

it("기존 {1} + [1,2] → newIds [2]", () => {
  const v_110a8b = new Set<number>([1]);
  const v_cb35cb = v_6e58ce(v_110a8b, [1, 2]);
  expect(v_cb35cb.newIds).toEqual([2]);
  expect(Array.from(v_cb35cb.seen).sort()).toEqual([1, 2]);
});

it("빈 seen에 여러 신규 트래킹ID → 전부 newIds", () => {
  const v_110a8b = new Set<number>();
  const v_cb35cb = v_6e58ce(v_110a8b, [3, 4, 5]);
  expect(v_cb35cb.newIds).toEqual([3, 4, 5]);
  expect(Array.from(v_cb35cb.seen).sort()).toEqual([3, 4, 5]);
});

it("모두 이미 seen이면 newIds 빈 배열, seen 불변 유지(내용 동일)", () => {
  const v_110a8b = new Set<number>([1, 2]);
  const v_cb35cb = v_6e58ce(v_110a8b, [1, 2]);
  expect(v_cb35cb.newIds).toEqual([]);
  expect(Array.from(v_cb35cb.seen).sort()).toEqual([1, 2]);
});

it("원본 seen 객체는 변경되지 않는다(불변성)", () => {
  const v_110a8b = new Set<number>([1]);
  const v_cb35cb = v_6e58ce(v_110a8b, [1, 2]);
  expect(v_110a8b.has(2)).toBe(false); 
  expect(v_cb35cb.seen).not.toBe(v_110a8b); 
});

it("trackingIds가 빈 배열이면 newIds 빈 배열", () => {
  const v_110a8b = new Set<number>([1]);
  const v_cb35cb = v_6e58ce(v_110a8b, []);
  expect(v_cb35cb.newIds).toEqual([]);
});
