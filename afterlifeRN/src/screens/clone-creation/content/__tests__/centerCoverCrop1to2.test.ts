import { v_9dd2d6 } from "../../../../lib/centerCoverCrop1to2";

describe("centerCoverCrop1to2", () => {
  it("가로가 더 넓으면 좌우를 잘라 1:2", () => {
    const v_cb35cb = v_9dd2d6(1000, 1000);
    expect(v_cb35cb.height).toBe(1000);
    expect(v_cb35cb.width).toBe(500);
    expect(v_cb35cb.originX).toBe(250);
    expect(v_cb35cb.originY).toBe(0);
  });

  it("세로가 더 길면 상하를 잘라 1:2", () => {
    const v_cb35cb = v_9dd2d6(500, 2000);
    expect(v_cb35cb.width).toBe(500);
    expect(v_cb35cb.height).toBe(1000);
    expect(v_cb35cb.originX).toBe(0);
    expect(v_cb35cb.originY).toBe(500);
  });

  it("이미 1:2 이면 그대로", () => {
    const v_cb35cb = v_9dd2d6(512, 1024);
    expect(v_cb35cb).toEqual({ originX: 0, originY: 0, width: 512, height: 1024 });
  });
});
