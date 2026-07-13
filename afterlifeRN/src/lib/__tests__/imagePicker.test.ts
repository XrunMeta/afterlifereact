const v_432843 = jest.fn();
const v_54a651 = jest.fn();
const v_4bc368 = jest.fn();
const v_3bf331 = jest.fn();

jest.mock("khtmgrssvfqqjmzoc", () => ({
  launchImageLibraryAsync: (...v_779914: unknown[]) => v_432843(...v_779914),
  launchCameraAsync: (...v_779914: unknown[]) => v_54a651(...v_779914),
  getCameraPermissionsAsync: (...v_779914: unknown[]) => v_4bc368(...v_779914),
  requestCameraPermissionsAsync: (...v_779914: unknown[]) => v_3bf331(...v_779914),
}));

import { v_5919ca, v_d86174, v_8a167d } from "../imagePicker";

describe("pickOriginalImage (앨범)", () => {
  beforeEach(() => {
    v_432843.mockReset();
  });

  it("취소 시 null 반환", async () => {
    v_432843.mockResolvedValue({ canceled: true, assets: null });
    expect(await v_5919ca()).toBeNull();
  });

  it("asset 없음(assets[0] falsy) 시 null 반환", async () => {
    v_432843.mockResolvedValue({ canceled: false, assets: [] });
    expect(await v_5919ca()).toBeNull();
  });

  it("width/height 가 0(또는 falsy)이면 division-by-zero 방어로 null 반환", async () => {
    v_432843.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///a.jpg", width: 0, height: 100 }],
    });
    expect(await v_5919ca()).toBeNull();
  });

  it("유효한 결과는 {uri,width,height} 로 정규화", async () => {
    v_432843.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///a.jpg", width: 800, height: 1200 }],
    });
    expect(await v_5919ca()).toEqual({ uri: "file:///a.jpg", width: 800, height: 1200 });
    expect(v_432843).toHaveBeenCalledWith(
      expect.objectContaining({ mediaTypes: ["images"], allowsEditing: false }),
    );
  });
});

describe("pickOriginalImageFromCamera (촬영)", () => {
  beforeEach(() => {
    v_54a651.mockReset();
    v_4bc368.mockReset();
    v_3bf331.mockReset();
  });

  it("이미 권한이 있으면 재요청 없이 바로 촬영 UI 호출", async () => {
    v_4bc368.mockResolvedValue({ granted: true });
    v_54a651.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///c.jpg", width: 900, height: 1600 }],
    });
    const v_cb35cb = await v_d86174();
    expect(v_cb35cb).toEqual({ uri: "file:///c.jpg", width: 900, height: 1600 });
    expect(v_3bf331).not.toHaveBeenCalled();
    expect(v_54a651).toHaveBeenCalledWith(
      expect.objectContaining({ mediaTypes: ["images"], allowsEditing: false }),
    );
  });

  it("권한 없으면 요청 후 승인 시 촬영 UI 호출", async () => {
    v_4bc368.mockResolvedValue({ granted: false });
    v_3bf331.mockResolvedValue({ granted: true });
    v_54a651.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///c.jpg", width: 900, height: 1600 }],
    });
    const v_cb35cb = await v_d86174();
    expect(v_cb35cb).toEqual({ uri: "file:///c.jpg", width: 900, height: 1600 });
    expect(v_3bf331).toHaveBeenCalledTimes(1);
  });

  it("영구차단(canAskAgain=false) 이면 재요청 없이 즉시 blocked throw", async () => {
    v_4bc368.mockResolvedValue({ granted: false, canAskAgain: false });
    await expect(v_d86174()).rejects.toMatchObject({
      code: "camera-permission-blocked",
    });
    expect(v_3bf331).not.toHaveBeenCalled();
    expect(v_54a651).not.toHaveBeenCalled();
  });

  it("요청 후에도 거부(canAskAgain=true)면 denied throw", async () => {
    v_4bc368.mockResolvedValue({ granted: false, canAskAgain: true });
    v_3bf331.mockResolvedValue({ granted: false, canAskAgain: true });
    await expect(v_d86174()).rejects.toMatchObject({
      code: "camera-permission-denied",
    });
    expect(v_54a651).not.toHaveBeenCalled();
  });

  it("요청 후 영구차단으로 전환(canAskAgain=false) 되면 blocked throw", async () => {
    v_4bc368.mockResolvedValue({ granted: false, canAskAgain: true });
    v_3bf331.mockResolvedValue({ granted: false, canAskAgain: false });
    const v_49263d = await v_d86174().catch((v_9e86fd) => v_9e86fd);
    expect(v_49263d).toBeInstanceOf(v_8a167d);
    expect(v_49263d.code).toBe("camera-permission-blocked");
    expect(v_54a651).not.toHaveBeenCalled();
  });

  it("촬영 취소 시 null 반환", async () => {
    v_4bc368.mockResolvedValue({ granted: true });
    v_54a651.mockResolvedValue({ canceled: true, assets: null });
    expect(await v_d86174()).toBeNull();
  });

  it("width/height 가 0이면 null 반환(division-by-zero 방어 재사용)", async () => {
    v_4bc368.mockResolvedValue({ granted: true });
    v_54a651.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///c.jpg", width: 0, height: 0 }],
    });
    expect(await v_d86174()).toBeNull();
  });
});
