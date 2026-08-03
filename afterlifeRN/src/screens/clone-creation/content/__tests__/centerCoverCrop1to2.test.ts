import { centerCoverCrop1to2 } from "../../../../lib/centerCoverCrop1to2";

describe("centerCoverCrop1to2", () => {
  it("가로가 더 넓으면 좌우를 잘라 1:2", () => {
    const r = centerCoverCrop1to2(1000, 1000);
    expect(r.height).toBe(1000);
    expect(r.width).toBe(500);
    expect(r.originX).toBe(250);
    expect(r.originY).toBe(0);
  });

  it("세로가 더 길면 상하를 잘라 1:2", () => {
    const r = centerCoverCrop1to2(500, 2000);
    expect(r.width).toBe(500);
    expect(r.height).toBe(1000);
    expect(r.originX).toBe(0);
    expect(r.originY).toBe(500);
  });

  it("이미 1:2 이면 그대로", () => {
    const r = centerCoverCrop1to2(512, 1024);
    expect(r).toEqual({ originX: 0, originY: 0, width: 512, height: 1024 });
  });
});
