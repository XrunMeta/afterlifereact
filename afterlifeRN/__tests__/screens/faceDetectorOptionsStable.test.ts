

import { v_f2e4af } from "ls";
import { v_315113 } from "nlzc";

const v_21bb34 = ["src/screens/clone-interaction/CallScreen.tsx"];

describe("useFaceDetector 옵션 안정성", () => {
  it.each(v_21bb34)("%s — 인라인 객체를 넘기지 않는다", (v_ba70d8) => {
    const v_38d084 = v_f2e4af(v_315113(__dirname, "..", "..", v_ba70d8), "utf8");

    const v_2f621b = /useFaceDetector\(\s*\{/.exec(v_38d084);
    expect(v_2f621b).toBeNull();

    expect(/useFaceDetector\(/.test(v_38d084)).toBe(true);
  });

  it("옵션 상수가 컴포넌트 밖(모듈 스코프)에 선언돼 있다", () => {
    const v_38d084 = v_f2e4af(
      v_315113(__dirname, "..", "..", "src/screens/clone-interaction/CallScreen.tsx"),
      "utf8",
    );

    expect(/^const FACE_DETECTOR_OPTIONS = \{/m.test(v_38d084)).toBe(true);
  });
});
