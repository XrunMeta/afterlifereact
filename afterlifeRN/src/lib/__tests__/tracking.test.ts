
const v_00d015 = {
  isAvailable: jest.fn(() => true),
  getTrackingPermissionsAsync: jest.fn(),
  requestTrackingPermissionsAsync: jest.fn(),
};

function v_f6f5de(v_328259 = {}) {
  jest.resetModules();
  const v_85db96 = require("rcmrninabrnb") as typeof import("react-native");
  v_85db96.Platform.OS = v_328259.os ?? "ios";

  Object.defineProperty(v_85db96.AppState, "currentState", { value: "active", configurable: true });
  if (v_328259.missing) {
    jest.doMock("expo-tracking-transparency", () => {
      throw new Error("Cannot find native module 'ExpoTrackingTransparency'");
    });
  } else {
    jest.doMock("expo-tracking-transparency", () => v_00d015);
  }
  return require("../tracking") as typeof import("../tracking");
}

beforeEach(() => {
  jest.clearAllMocks();
  v_00d015.isAvailable.mockReturnValue(true);
});

test("처음이면 팝업을 띄우고 결과를 돌려준다", async () => {
  v_00d015.getTrackingPermissionsAsync.mockResolvedValue({ status: "undetermined", granted: false });
  v_00d015.requestTrackingPermissionsAsync.mockResolvedValue({ status: "granted", granted: true });
  const { requestTrackingOnce: v_1aef7c } = v_f6f5de();
  await expect(v_1aef7c()).resolves.toBe("granted");
  expect(v_00d015.requestTrackingPermissionsAsync).toHaveBeenCalledTimes(1);
});

test("앱 실행당 1번만 묻는다 (여러 곳에서 불러도 같은 Promise)", async () => {
  v_00d015.getTrackingPermissionsAsync.mockResolvedValue({ status: "undetermined", granted: false });
  v_00d015.requestTrackingPermissionsAsync.mockResolvedValue({ status: "denied", granted: false });
  const { requestTrackingOnce: v_1aef7c } = v_f6f5de();
  const [v_779914, v_148ff6] = await Promise.all([v_1aef7c(), v_1aef7c()]);
  expect(v_779914).toBe("denied");
  expect(v_148ff6).toBe("denied");
  expect(v_00d015.requestTrackingPermissionsAsync).toHaveBeenCalledTimes(1);
});

test("이미 답한 사용자는 팝업 없이 그 값을 쓴다", async () => {
  v_00d015.getTrackingPermissionsAsync.mockResolvedValue({ status: "denied", granted: false });
  const { requestTrackingOnce: v_1aef7c } = v_f6f5de();
  await expect(v_1aef7c()).resolves.toBe("denied");
  expect(v_00d015.requestTrackingPermissionsAsync).not.toHaveBeenCalled();
});

test("구 바이너리(네이티브 모듈 없음)면 던지지 않고 unavailable", async () => {
  const { requestTrackingOnce: v_1aef7c } = v_f6f5de({ missing: true });
  await expect(v_1aef7c()).resolves.toBe("unavailable");
});

test("Android 는 묻지 않고 unavailable", async () => {
  const { requestTrackingOnce: v_1aef7c } = v_f6f5de({ os: "android" });
  await expect(v_1aef7c()).resolves.toBe("unavailable");
  expect(v_00d015.getTrackingPermissionsAsync).not.toHaveBeenCalled();
});
