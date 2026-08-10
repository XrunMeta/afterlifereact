

function v_6adfe8(v_bda6c4) {
  throw new Error(
    `[web-stub] 카메라 실사용 경로에 진입했습니다: react-native-vision-camera.${v_bda6c4}\n` +
      `웹 번들에서는 권한 조회만 스텁되어 있습니다. 이 경로는 실기(시뮬레이터/기기)로 검증하세요.`,
  );
}

const v_862296 = {
  getCameraPermissionStatus: () => "granted",
  getMicrophonePermissionStatus: () => "granted",
  requestCameraPermission: async () => "granted",
  requestMicrophonePermission: async () => "granted",

  getAvailableCameraDevices: () => v_6adfe8("getAvailableCameraDevices"),
};

module.exports = {
  __esModule: true,
  Camera: v_862296,
  default: v_862296,
  useCameraDevice: () => v_6adfe8("useCameraDevice"),
  useCameraDevices: () => v_6adfe8("useCameraDevices"),
  useCameraFormat: () => v_6adfe8("useCameraFormat"),
  useCameraPermission: () => v_6adfe8("useCameraPermission"),
  useMicrophonePermission: () => v_6adfe8("useMicrophonePermission"),
  useFrameProcessor: () => v_6adfe8("useFrameProcessor"),
  useSkiaFrameProcessor: () => v_6adfe8("useSkiaFrameProcessor"),
  runAtTargetFps: () => v_6adfe8("runAtTargetFps"),
  runAsync: () => v_6adfe8("runAsync"),
  VisionCameraProxy: new Proxy({}, { get: (v_d53ff0, v_e2a85c) => v_6adfe8(`VisionCameraProxy.${String(v_e2a85c)}`) }),
};
