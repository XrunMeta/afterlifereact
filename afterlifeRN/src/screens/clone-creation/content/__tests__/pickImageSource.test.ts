const v_e84783 = jest.fn();
const v_7e6566 = jest.fn();

jest.mock("../../../../lib/imagePicker", () => {
  class v_6b1732 extends Error {
    code: "camera-permission-denied" | "camera-permission-blocked";
    constructor(v_c99bd2) {
      super(v_c99bd2);
      this.code = v_c99bd2;
    }
  }
  return {
    pickOriginalImage: (...v_779914: unknown[]) => v_e84783(...v_779914),
    pickOriginalImageFromCamera: (...v_779914: unknown[]) => v_7e6566(...v_779914),
    CameraPermissionError: v_6b1732,
  };
});

const { CameraPermissionError: v_6b1732 } = jest.requireMock(
  "../../../../lib/imagePicker",
) as { CameraPermissionError: new (code: "camera-permission-denied" | "camera-permission-blocked") => Error & { code: string } };

const v_3c743e = jest.fn();
jest.mock("../../../../stores/dialogStore", () => ({
  showAlert: (...v_779914: unknown[]) => v_3c743e(...v_779914),
}));

const v_28cba7 = jest.fn();
jest.mock("rcmrninabrnb", () => ({
  Linking: { openSettings: (...v_779914: unknown[]) => v_28cba7(...v_779914) },
}));

import { v_e0c5af } from "../pickImageSource";

const v_92d274 = ((v_b24339) => v_b24339) as unknown as import("i18next").TFunction;

describe("runImageSourcePick", () => {
  let v_863e30;

  beforeEach(() => {
    v_e84783.mockReset();
    v_7e6566.mockReset();
    v_3c743e.mockReset();
    v_28cba7.mockReset();
    v_863e30 = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => v_863e30.mockRestore());

  it("성공 시 결과 그대로 반환(fromCamera=false → 앨범 경로)", async () => {
    v_e84783.mockResolvedValue({ uri: "x", width: 1, height: 2 });
    const v_cb35cb = await v_e0c5af(false, v_92d274);
    expect(v_cb35cb).toEqual({ uri: "x", width: 1, height: 2 });
    expect(v_7e6566).not.toHaveBeenCalled();
    expect(v_3c743e).not.toHaveBeenCalled();
  });

  it("성공 시 결과 그대로 반환(fromCamera=true → 카메라 경로)", async () => {
    v_7e6566.mockResolvedValue({ uri: "c", width: 3, height: 4 });
    const v_cb35cb = await v_e0c5af(true, v_92d274);
    expect(v_cb35cb).toEqual({ uri: "c", width: 3, height: 4 });
    expect(v_e84783).not.toHaveBeenCalled();
  });

  it("취소(null) 시 알림 없이 null 반환", async () => {
    v_7e6566.mockResolvedValue(null);
    const v_cb35cb = await v_e0c5af(true, v_92d274);
    expect(v_cb35cb).toBeNull();
    expect(v_3c743e).not.toHaveBeenCalled();
  });

  it("권한 거부(denied) 시 전용 메시지 알림 + 로깅, 설정버튼 없음", async () => {
    v_7e6566.mockRejectedValue(
      new v_6b1732("camera-permission-denied"),
    );
    const v_cb35cb = await v_e0c5af(true, v_92d274);
    expect(v_cb35cb).toBeNull();
    expect(v_863e30).toHaveBeenCalled();
    expect(v_3c743e).toHaveBeenCalledWith(
      "create.image.cameraPermTitle",
      "create.image.cameraPermDeniedMsg",
    );
  });

  it("권한 영구차단(blocked) 시 설정버튼 포함 알림 + 로깅", async () => {
    v_7e6566.mockRejectedValue(
      new v_6b1732("camera-permission-blocked"),
    );
    const v_cb35cb = await v_e0c5af(true, v_92d274);
    expect(v_cb35cb).toBeNull();
    expect(v_863e30).toHaveBeenCalled();
    expect(v_3c743e).toHaveBeenCalledWith(
      "create.image.cameraPermTitle",
      "create.image.cameraPermBlockedMsg",
      expect.arrayContaining([
        expect.objectContaining({ text: "common.cancel", style: "cancel" }),
        expect.objectContaining({ text: "permissionGate.settingsButton" }),
      ]),
    );
    const v_3d694a = v_3c743e.mock.calls[0][2];
    const v_35e071 = v_3d694a.find((v_148ff6) => v_148ff6.text === "permissionGate.settingsButton");
    await v_35e071.onPress();
    expect(v_28cba7).toHaveBeenCalledTimes(1);
  });

  it("설정버튼 onPress 에서 openSettings 가 실패해도 크래시 없이 흡수 + 로깅", async () => {
    v_7e6566.mockRejectedValue(
      new v_6b1732("camera-permission-blocked"),
    );
    v_28cba7.mockRejectedValue(new Error("openSettings unsupported"));
    await v_e0c5af(true, v_92d274);
    const v_3d694a = v_3c743e.mock.calls[0][2];
    const v_35e071 = v_3d694a.find((v_148ff6) => v_148ff6.text === "permissionGate.settingsButton");
    await expect(v_35e071.onPress()).resolves.toBeUndefined();
    expect(v_863e30).toHaveBeenCalledWith(
      expect.stringContaining("openSettings"),
      expect.any(Error),
    );
  });

  it("기술적 오류(일반 Error)는 기존 loadFailed 메시지 + 로깅", async () => {
    v_e84783.mockRejectedValue(new Error("network fail"));
    const v_cb35cb = await v_e0c5af(false, v_92d274);
    expect(v_cb35cb).toBeNull();
    expect(v_863e30).toHaveBeenCalled();
    expect(v_3c743e).toHaveBeenCalledWith("common.error", "create.image.loadFailed");
  });
});
