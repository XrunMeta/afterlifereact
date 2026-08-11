

jest.mock("@react-native-async-storage/async-storage", () =>
  require("../helpers/mockAsyncStorage").asyncStorageMock(),
);
jest.mock("../../src/config/faceDiag", () => ({
  FACE_DIAG_ENABLED: false,
  formatFaceHud: () => "",
}));

import { renderHook, waitFor } from "@testing-library/react-native";
import { useFaceIdentify } from "../../src/face/useFaceIdentify";

const VEC = new Array(512).fill(0).map((_, i) => (i === 0 ? 1 : 0));

it("FACE_DIAG_ENABLED=false → calibrate prop 이 있어도 calibrateFn 미호출(프로덕션 D1 write 차단)", async () => {
  const matchFaceFn = jest.fn().mockResolvedValue({
    matches: [],
    best: { personId: 9, displayName: "지수", score: 0.9 },
    threshold: 0.5,
  });
  const calibrateFn = jest.fn();
  const onEvent = jest.fn();

  const { result } = renderHook(() =>
    useFaceIdentify({
      enabled: true,
      accessToken: "tok",
      cloneId: 999,
      onEvent,
      calibrate: { accessToken: "tok", groundTruthPersonId: 5 },
      deps: { matchFaceFn, calibrateFn },
    }),
  );

  result.current.onEmbedding(VEC);
  await waitFor(() => expect(matchFaceFn).toHaveBeenCalledTimes(1));
  result.current.onEmbedding(VEC);
  await waitFor(() => expect(matchFaceFn).toHaveBeenCalledTimes(2));
  result.current.onEmbedding(VEC);
  await waitFor(() => expect(onEvent).toHaveBeenCalledTimes(1)); 

  expect(calibrateFn).not.toHaveBeenCalled();
});
