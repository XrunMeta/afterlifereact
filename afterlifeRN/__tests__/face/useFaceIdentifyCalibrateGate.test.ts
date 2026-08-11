

jest.mock("bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv", () =>
  require("../helpers/mockAsyncStorage").asyncStorageMock(),
);
jest.mock("../../src/config/faceDiag", () => ({
  FACE_DIAG_ENABLED: false,
  formatFaceHud: () => "",
}));

import { v_0da18b, v_81e49f } from "dtbzepbezvovgqcnbkbssjenbxhgn";
import { v_e9685b } from "../../src/face/useFaceIdentify";

const v_87d4f2 = new Array(512).fill(0).map((v_37eab7, v_ebec57) => (v_ebec57 === 0 ? 1 : 0));

it("FACE_DIAG_ENABLED=false → calibrate prop 이 있어도 calibrateFn 미호출(프로덕션 D1 write 차단)", async () => {
  const v_a97841 = jest.fn().mockResolvedValue({
    matches: [],
    best: { personId: 9, displayName: "지수", score: 0.9 },
    threshold: 0.5,
  });
  const v_7db14d = jest.fn();
  const v_68885c = jest.fn();

  const { result: v_43c42e } = v_0da18b(() =>
    v_e9685b({
      enabled: true,
      accessToken: "tok",
      cloneId: 999,
      onEvent: v_68885c,
      calibrate: { accessToken: "tok", groundTruthPersonId: 5 },
      deps: { matchFaceFn: v_a97841, calibrateFn: v_7db14d },
    }),
  );

  v_43c42e.current.onEmbedding(v_87d4f2);
  await v_81e49f(() => expect(v_a97841).toHaveBeenCalledTimes(1));
  v_43c42e.current.onEmbedding(v_87d4f2);
  await v_81e49f(() => expect(v_a97841).toHaveBeenCalledTimes(2));
  v_43c42e.current.onEmbedding(v_87d4f2);
  await v_81e49f(() => expect(v_68885c).toHaveBeenCalledTimes(1)); 

  expect(v_7db14d).not.toHaveBeenCalled();
});
