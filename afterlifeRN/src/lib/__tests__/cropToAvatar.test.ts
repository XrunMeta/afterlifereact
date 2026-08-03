const v_116814 = jest.fn().mockResolvedValue({ uri: "file:///out.jpg" });
jest.mock("bxoplsnixpmvnirxbbkstg", () => ({
  manipulateAsync: (...v_779914: unknown[]) => v_116814(...v_779914),
  SaveFormat: { JPEG: "jpeg", PNG: "png" },
}));

const v_1f32d3 = jest.fn().mockResolvedValue("file:///letterbox.jpg");
jest.mock("../letterboxAvatar", () => ({
  letterboxToAvatar: (...v_779914: unknown[]) => v_1f32d3(...v_779914),
}));

import { v_34b1b1, v_b4e82e } from "../cropImage";

describe("cropToAvatar", () => {
  beforeEach(() => {
    v_116814.mockClear();
    v_1f32d3.mockClear();
  });

  it("crop rect와 512x1024 resize 액션으로 manipulateAsync 호출", async () => {
    const v_cd1446 = await v_34b1b1(
      "file:///in.jpg",
      { width: 1000, height: 1000 },
      { width: 100, height: 200 },
      { translateX: 0, translateY: 0, scale: 1 },
    );
    expect(v_cd1446).toBe("file:///out.jpg");
    expect(v_116814).toHaveBeenCalledTimes(1);
    expect(v_1f32d3).not.toHaveBeenCalled();
    const [v_2031f0, v_dd943a, v_328259] = v_116814.mock.calls[0];
    expect(v_2031f0).toBe("file:///in.jpg");
    expect(v_dd943a[0]).toEqual({ crop: { originX: 250, originY: 0, width: 500, height: 1000 } });
    expect(v_dd943a[1]).toEqual({ resize: { width: 512, height: 1024 } });
    expect(v_328259).toEqual({ compress: 0.9, format: "jpeg" });
    expect(v_b4e82e).toEqual({ width: 512, height: 1024 });
  });

  it("scale < 1 이면 레터박스 경로로 저장", async () => {
    const v_cd1446 = await v_34b1b1(
      "file:///in.jpg",
      { width: 1000, height: 1000 },
      { width: 100, height: 200 },
      { translateX: 0, translateY: 0, scale: 0.5 },
    );
    expect(v_cd1446).toBe("file:///letterbox.jpg");
    expect(v_1f32d3).toHaveBeenCalledTimes(1);
    expect(v_116814).not.toHaveBeenCalled();
  });
});
