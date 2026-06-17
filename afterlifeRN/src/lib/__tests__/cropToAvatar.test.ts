const v_116814 = jest.fn().mockResolvedValue({ uri: "file:///out.jpg" });
jest.mock("bxoplsnixpmvnirxbbkstg", () => ({
  manipulateAsync: (...v_779914: unknown[]) => v_116814(...v_779914),
  SaveFormat: { JPEG: "jpeg" },
}));

import { v_34b1b1, v_b4e82e } from "../cropImage";

describe("cropToAvatar", () => {
  beforeEach(() => v_116814.mockClear());

  it("crop rect와 512x1024 resize 액션으로 manipulateAsync 호출", async () => {
    const v_cd1446 = await v_34b1b1(
      "file:///in.jpg",
      { width: 1000, height: 1000 },
      { width: 100, height: 200 },
      { translateX: 0, translateY: 0, scale: 1 },
    );
    expect(v_cd1446).toBe("file:///out.jpg");
    expect(v_116814).toHaveBeenCalledTimes(1);
    const [v_2031f0, v_dd943a, v_328259] = v_116814.mock.calls[0];
    expect(v_2031f0).toBe("file:///in.jpg");
    expect(v_dd943a[0]).toEqual({ crop: { originX: 250, originY: 0, width: 500, height: 1000 } });
    expect(v_dd943a[1]).toEqual({ resize: { width: 512, height: 1024 } });
    expect(v_328259).toEqual({ compress: 0.9, format: "jpeg" });
    expect(v_b4e82e).toEqual({ width: 512, height: 1024 });
  });
});
