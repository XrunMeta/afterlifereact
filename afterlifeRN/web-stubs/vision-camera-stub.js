

function boom(what) {
  throw new Error(
    `[web-stub] 카메라 실사용 경로에 진입했습니다: react-native-vision-camera.${what}\n` +
      `웹 번들에서는 권한 조회만 스텁되어 있습니다. 이 경로는 실기(시뮬레이터/기기)로 검증하세요.`,
  );
}

const Camera = {
  getCameraPermissionStatus: () => "granted",
  getMicrophonePermissionStatus: () => "granted",
  requestCameraPermission: async () => "granted",
  requestMicrophonePermission: async () => "granted",

  getAvailableCameraDevices: () => boom("getAvailableCameraDevices"),
};

module.exports = {
  __esModule: true,
  Camera,
  default: Camera,
  useCameraDevice: () => boom("useCameraDevice"),
  useCameraDevices: () => boom("useCameraDevices"),
  useCameraFormat: () => boom("useCameraFormat"),
  useCameraPermission: () => boom("useCameraPermission"),
  useMicrophonePermission: () => boom("useMicrophonePermission"),
  useFrameProcessor: () => boom("useFrameProcessor"),
  useSkiaFrameProcessor: () => boom("useSkiaFrameProcessor"),
  runAtTargetFps: () => boom("runAtTargetFps"),
  runAsync: () => boom("runAsync"),
  VisionCameraProxy: new Proxy({}, { get: (_t, p) => boom(`VisionCameraProxy.${String(p)}`) }),
};
