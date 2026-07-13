const mockPickOriginalImage = jest.fn();
const mockPickOriginalImageFromCamera = jest.fn();

jest.mock("../../../../lib/imagePicker", () => {
  class FakeCameraPermissionError extends Error {
    code: "camera-permission-denied" | "camera-permission-blocked";
    constructor(code: "camera-permission-denied" | "camera-permission-blocked") {
      super(code);
      this.code = code;
    }
  }
  return {
    pickOriginalImage: (...a: unknown[]) => mockPickOriginalImage(...a),
    pickOriginalImageFromCamera: (...a: unknown[]) => mockPickOriginalImageFromCamera(...a),
    CameraPermissionError: FakeCameraPermissionError,
  };
});

const { CameraPermissionError: FakeCameraPermissionError } = jest.requireMock(
  "../../../../lib/imagePicker",
) as { CameraPermissionError: new (code: "camera-permission-denied" | "camera-permission-blocked") => Error & { code: string } };

const mockShowAlert = jest.fn();
jest.mock("../../../../stores/dialogStore", () => ({
  showAlert: (...a: unknown[]) => mockShowAlert(...a),
}));

const mockOpenSettings = jest.fn();
jest.mock("react-native", () => ({
  Linking: { openSettings: (...a: unknown[]) => mockOpenSettings(...a) },
}));

import { runImageSourcePick } from "../pickImageSource";

const fakeT = ((key: string) => key) as unknown as import("i18next").TFunction;

describe("runImageSourcePick", () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    mockPickOriginalImage.mockReset();
    mockPickOriginalImageFromCamera.mockReset();
    mockShowAlert.mockReset();
    mockOpenSettings.mockReset();
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => warnSpy.mockRestore());

  it("성공 시 결과 그대로 반환(fromCamera=false → 앨범 경로)", async () => {
    mockPickOriginalImage.mockResolvedValue({ uri: "x", width: 1, height: 2 });
    const r = await runImageSourcePick(false, fakeT);
    expect(r).toEqual({ uri: "x", width: 1, height: 2 });
    expect(mockPickOriginalImageFromCamera).not.toHaveBeenCalled();
    expect(mockShowAlert).not.toHaveBeenCalled();
  });

  it("성공 시 결과 그대로 반환(fromCamera=true → 카메라 경로)", async () => {
    mockPickOriginalImageFromCamera.mockResolvedValue({ uri: "c", width: 3, height: 4 });
    const r = await runImageSourcePick(true, fakeT);
    expect(r).toEqual({ uri: "c", width: 3, height: 4 });
    expect(mockPickOriginalImage).not.toHaveBeenCalled();
  });

  it("취소(null) 시 알림 없이 null 반환", async () => {
    mockPickOriginalImageFromCamera.mockResolvedValue(null);
    const r = await runImageSourcePick(true, fakeT);
    expect(r).toBeNull();
    expect(mockShowAlert).not.toHaveBeenCalled();
  });

  it("권한 거부(denied) 시 전용 메시지 알림 + 로깅, 설정버튼 없음", async () => {
    mockPickOriginalImageFromCamera.mockRejectedValue(
      new FakeCameraPermissionError("camera-permission-denied"),
    );
    const r = await runImageSourcePick(true, fakeT);
    expect(r).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
    expect(mockShowAlert).toHaveBeenCalledWith(
      "create.image.cameraPermTitle",
      "create.image.cameraPermDeniedMsg",
    );
  });

  it("권한 영구차단(blocked) 시 설정버튼 포함 알림 + 로깅", async () => {
    mockPickOriginalImageFromCamera.mockRejectedValue(
      new FakeCameraPermissionError("camera-permission-blocked"),
    );
    const r = await runImageSourcePick(true, fakeT);
    expect(r).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
    expect(mockShowAlert).toHaveBeenCalledWith(
      "create.image.cameraPermTitle",
      "create.image.cameraPermBlockedMsg",
      expect.arrayContaining([
        expect.objectContaining({ text: "common.cancel", style: "cancel" }),
        expect.objectContaining({ text: "permissionGate.settingsButton" }),
      ]),
    );
    const buttons = mockShowAlert.mock.calls[0][2];
    const settingsBtn = buttons.find((b: { text: string }) => b.text === "permissionGate.settingsButton");
    await settingsBtn.onPress();
    expect(mockOpenSettings).toHaveBeenCalledTimes(1);
  });

  it("설정버튼 onPress 에서 openSettings 가 실패해도 크래시 없이 흡수 + 로깅", async () => {
    mockPickOriginalImageFromCamera.mockRejectedValue(
      new FakeCameraPermissionError("camera-permission-blocked"),
    );
    mockOpenSettings.mockRejectedValue(new Error("openSettings unsupported"));
    await runImageSourcePick(true, fakeT);
    const buttons = mockShowAlert.mock.calls[0][2];
    const settingsBtn = buttons.find((b: { text: string }) => b.text === "permissionGate.settingsButton");
    await expect(settingsBtn.onPress()).resolves.toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("openSettings"),
      expect.any(Error),
    );
  });

  it("기술적 오류(일반 Error)는 기존 loadFailed 메시지 + 로깅", async () => {
    mockPickOriginalImage.mockRejectedValue(new Error("network fail"));
    const r = await runImageSourcePick(false, fakeT);
    expect(r).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
    expect(mockShowAlert).toHaveBeenCalledWith("common.error", "create.image.loadFailed");
  });
});
