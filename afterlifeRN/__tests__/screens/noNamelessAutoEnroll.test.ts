

import { v_f2e4af } from "ls";
import { v_315113 } from "nlzc";

const v_4e53aa = "src/screens/clone-interaction/CallScreen.tsx";

describe("무명 자동 등록 차단", () => {
  const v_38d084 = v_f2e4af(v_315113(__dirname, "..", "..", v_4e53aa), "utf8");

  const v_c99bd2 = v_38d084
    .split("\n")
    .map((v_1614db) => v_1614db.replace(/\/\/.*$/, ""))
    .join("\n");

  it("통화 화면은 enrollSilent 를 호출하지 않는다", () => {
    expect(/\benrollSilent\s*\(/.test(v_c99bd2)).toBe(false);
  });

  it("이름 있는 등록 경로는 그대로 살아 있다 — 차단이 아니라 일원화다", () => {

    expect(/faceEnroll\s*\n?\s*\.enroll\(/.test(v_38d084) || /\.enroll\(/.test(v_38d084)).toBe(true);
  });
});
