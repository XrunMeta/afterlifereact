import { detectNewFaces } from "../../src/face/newFaceDetector";

it("기존 {1} + [1,2] → newIds [2]", () => {
  const seen = new Set<number>([1]);
  const r = detectNewFaces(seen, [1, 2]);
  expect(r.newIds).toEqual([2]);
  expect(Array.from(r.seen).sort()).toEqual([1, 2]);
});

it("빈 seen에 여러 신규 트래킹ID → 전부 newIds", () => {
  const seen = new Set<number>();
  const r = detectNewFaces(seen, [3, 4, 5]);
  expect(r.newIds).toEqual([3, 4, 5]);
  expect(Array.from(r.seen).sort()).toEqual([3, 4, 5]);
});

it("모두 이미 seen이면 newIds 빈 배열, seen 불변 유지(내용 동일)", () => {
  const seen = new Set<number>([1, 2]);
  const r = detectNewFaces(seen, [1, 2]);
  expect(r.newIds).toEqual([]);
  expect(Array.from(r.seen).sort()).toEqual([1, 2]);
});

it("원본 seen 객체는 변경되지 않는다(불변성)", () => {
  const seen = new Set<number>([1]);
  const r = detectNewFaces(seen, [1, 2]);
  expect(seen.has(2)).toBe(false); 
  expect(r.seen).not.toBe(seen); 
});

it("trackingIds가 빈 배열이면 newIds 빈 배열", () => {
  const seen = new Set<number>([1]);
  const r = detectNewFaces(seen, []);
  expect(r.newIds).toEqual([]);
});
