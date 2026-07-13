const mockLaunchImageLibraryAsync = jest.fn();
const mockLaunchCameraAsync = jest.fn();
const mockGetCameraPermissionsAsync = jest.fn();
const mockRequestCameraPermissionsAsync = jest.fn();

jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: (...a: unknown[]) => mockLaunchImageLibraryAsync(...a),
  launchCameraAsync: (...a: unknown[]) => mockLaunchCameraAsync(...a),
  getCameraPermissionsAsync: (...a: unknown[]) => mockGetCameraPermissionsAsync(...a),
  requestCameraPermissionsAsync: (...a: unknown[]) => mockRequestCameraPermissionsAsync(...a),
}));

import { pickOriginalImage, pickOriginalImageFromCamera, CameraPermissionError } from "../imagePicker";

describe("pickOriginalImage (앨범)", () => {
  beforeEach(() => {
    mockLaunchImageLibraryAsync.mockReset();
  });

  it("취소 시 null 반환", async () => {
    mockLaunchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: null });
    expect(await pickOriginalImage()).toBeNull();
  });

  it("asset 없음(assets[0] falsy) 시 null 반환", async () => {
    mockLaunchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [] });
    expect(await pickOriginalImage()).toBeNull();
  });

  it("width/height 가 0(또는 falsy)이면 division-by-zero 방어로 null 반환", async () => {
    mockLaunchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///a.jpg", width: 0, height: 100 }],
    });
    expect(await pickOriginalImage()).toBeNull();
  });

  it("유효한 결과는 {uri,width,height} 로 정규화", async () => {
    mockLaunchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///a.jpg", width: 800, height: 1200 }],
    });
    expect(await pickOriginalImage()).toEqual({ uri: "file:///a.jpg", width: 800, height: 1200 });
    expect(mockLaunchImageLibraryAsync).toHaveBeenCalledWith(
      expect.objectContaining({ mediaTypes: ["images"], allowsEditing: false }),
    );
  });
});

describe("pickOriginalImageFromCamera (촬영)", () => {
  beforeEach(() => {
    mockLaunchCameraAsync.mockReset();
    mockGetCameraPermissionsAsync.mockReset();
    mockRequestCameraPermissionsAsync.mockReset();
  });

  it("이미 권한이 있으면 재요청 없이 바로 촬영 UI 호출", async () => {
    mockGetCameraPermissionsAsync.mockResolvedValue({ granted: true });
    mockLaunchCameraAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///c.jpg", width: 900, height: 1600 }],
    });
    const r = await pickOriginalImageFromCamera();
    expect(r).toEqual({ uri: "file:///c.jpg", width: 900, height: 1600 });
    expect(mockRequestCameraPermissionsAsync).not.toHaveBeenCalled();
    expect(mockLaunchCameraAsync).toHaveBeenCalledWith(
      expect.objectContaining({ mediaTypes: ["images"], allowsEditing: false }),
    );
  });

  it("권한 없으면 요청 후 승인 시 촬영 UI 호출", async () => {
    mockGetCameraPermissionsAsync.mockResolvedValue({ granted: false });
    mockRequestCameraPermissionsAsync.mockResolvedValue({ granted: true });
    mockLaunchCameraAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///c.jpg", width: 900, height: 1600 }],
    });
    const r = await pickOriginalImageFromCamera();
    expect(r).toEqual({ uri: "file:///c.jpg", width: 900, height: 1600 });
    expect(mockRequestCameraPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  it("영구차단(canAskAgain=false) 이면 재요청 없이 즉시 blocked throw", async () => {
    mockGetCameraPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: false });
    await expect(pickOriginalImageFromCamera()).rejects.toMatchObject({
      code: "camera-permission-blocked",
    });
    expect(mockRequestCameraPermissionsAsync).not.toHaveBeenCalled();
    expect(mockLaunchCameraAsync).not.toHaveBeenCalled();
  });

  it("요청 후에도 거부(canAskAgain=true)면 denied throw", async () => {
    mockGetCameraPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true });
    mockRequestCameraPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true });
    await expect(pickOriginalImageFromCamera()).rejects.toMatchObject({
      code: "camera-permission-denied",
    });
    expect(mockLaunchCameraAsync).not.toHaveBeenCalled();
  });

  it("요청 후 영구차단으로 전환(canAskAgain=false) 되면 blocked throw", async () => {
    mockGetCameraPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true });
    mockRequestCameraPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: false });
    const err = await pickOriginalImageFromCamera().catch((e) => e);
    expect(err).toBeInstanceOf(CameraPermissionError);
    expect(err.code).toBe("camera-permission-blocked");
    expect(mockLaunchCameraAsync).not.toHaveBeenCalled();
  });

  it("촬영 취소 시 null 반환", async () => {
    mockGetCameraPermissionsAsync.mockResolvedValue({ granted: true });
    mockLaunchCameraAsync.mockResolvedValue({ canceled: true, assets: null });
    expect(await pickOriginalImageFromCamera()).toBeNull();
  });

  it("width/height 가 0이면 null 반환(division-by-zero 방어 재사용)", async () => {
    mockGetCameraPermissionsAsync.mockResolvedValue({ granted: true });
    mockLaunchCameraAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///c.jpg", width: 0, height: 0 }],
    });
    expect(await pickOriginalImageFromCamera()).toBeNull();
  });
});
