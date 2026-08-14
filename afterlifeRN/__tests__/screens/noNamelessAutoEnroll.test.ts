

import { readFileSync } from "fs";
import { join } from "path";

const CALL_SCREEN = "src/screens/clone-interaction/CallScreen.tsx";

describe("무명 자동 등록 차단", () => {
  const src = readFileSync(join(__dirname, "..", "..", CALL_SCREEN), "utf8");

  const code = src
    .split("\n")
    .map((l) => l.replace(/\/\/.*$/, ""))
    .join("\n");

  it("통화 화면은 enrollSilent 를 호출하지 않는다", () => {
    expect(/\benrollSilent\s*\(/.test(code)).toBe(false);
  });

  it("이름 있는 등록 경로는 그대로 살아 있다 — 차단이 아니라 일원화다", () => {

    expect(/faceEnroll\s*\n?\s*\.enroll\(/.test(src) || /\.enroll\(/.test(src)).toBe(true);
  });
});
