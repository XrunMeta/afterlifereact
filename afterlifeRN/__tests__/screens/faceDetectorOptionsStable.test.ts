

import { readFileSync } from "fs";
import { join } from "path";

const SOURCES = ["src/screens/clone-interaction/CallScreen.tsx"];

describe("useFaceDetector 옵션 안정성", () => {
  it.each(SOURCES)("%s — 인라인 객체를 넘기지 않는다", (rel) => {
    const src = readFileSync(join(__dirname, "..", "..", rel), "utf8");

    const inline = /useFaceDetector\(\s*\{/.exec(src);
    expect(inline).toBeNull();

    expect(/useFaceDetector\(/.test(src)).toBe(true);
  });

  it("옵션 상수가 컴포넌트 밖(모듈 스코프)에 선언돼 있다", () => {
    const src = readFileSync(
      join(__dirname, "..", "..", "src/screens/clone-interaction/CallScreen.tsx"),
      "utf8",
    );

    expect(/^const FACE_DETECTOR_OPTIONS = \{/m.test(src)).toBe(true);
  });
});
