import {
  v_96e195,
  v_8c3a7c,
  v_41cb05,
  v_0b124e,
  v_fd304e,
  v_50b48d,
  v_2cac55,
} from "../faceConsentGate";
import { v_55270a } from "../whoIntent";

describe("AFL-1040 동의 판정", () => {
  test("granted 만 ON", () => {
    expect(v_0b124e("granted")).toBe(true);
  });
  test("revoked · none · 기타 · 조회 실패(undefined/null) 는 OFF", () => {
    for (const v_fd5f43 of ["revoked", "none", "pending", "", undefined, null]) {
      expect(v_0b124e(v_fd5f43 as string | null | undefined)).toBe(false);
    }
  });
});

describe("enroll_suggest · remember_me 게이트", () => {
  test("동의 확정(true)만 처리", () => {
    expect(v_fd304e(true)).toBe(true);
    expect(v_50b48d(true)).toBe(true);
  });
  test("비동의(false)·미확정(null) 은 무시 — OPEN_SHEET 안 함", () => {
    for (const v_3f4e2e of [false, null, undefined]) {
      expect(v_fd304e(v_3f4e2e)).toBe(false);
      expect(v_50b48d(v_3f4e2e)).toBe(false);
    }
  });
});

describe("서버 통보 계약", () => {
  test("offer face_consent: 확정이면 true/false 그대로, 모르면 필드 생략", () => {
    expect(v_41cb05(true)).toEqual({ face_consent: true });
    expect(v_41cb05(false)).toEqual({ face_consent: false });
    expect(v_41cb05(null)).toEqual({});
    expect("face_consent" in v_41cb05(undefined)).toBe(false);
  });
  test("dc face_consent 메시지: 확정이면 생성, 모르면 null", () => {
    expect(v_96e195(true)).toEqual({ type: "face_consent", granted: true });
    expect(v_96e195(false)).toEqual({ type: "face_consent", granted: false });
    expect(v_96e195(null)).toBeNull();
  });
  test("비동의 + 누구냐 질문 → turn_face no_consent (이름·personId·score 없음)", () => {
    const v_97d2e9 = v_55270a("나 누구야?");
    expect(v_97d2e9).toBe("self");
    expect(v_2cac55(false, v_97d2e9)).toBe(true);
    const v_badeaf = v_8c3a7c(v_97d2e9);
    expect(v_badeaf).toEqual({ type: "turn_face", verdict: "no_consent", who: "self" });
    expect(Object.keys(v_badeaf).sort()).toEqual(["type", "verdict", "who"]);
  });
  test("누구냐 질문이 아니거나 동의/미확정이면 보내지 않는다", () => {
    expect(v_2cac55(false, v_55270a("오늘 날씨 어때?"))).toBe(false);
    expect(v_2cac55(true, "self")).toBe(false);
    expect(v_2cac55(null, "self")).toBe(false);
  });
  test("other 도 who 값을 그대로 싣는다", () => {
    expect(v_8c3a7c("other").who).toBe("other");
  });
});

import { v_9ff376 } from "../faceConsentGate";
import v_9d3c52 from "ls";
import v_9fe22d from "nlzc";

describe("AFL-1040 통화 밖 등록 진입 가드", () => {
  test("granted 만 허용", async () => {
    expect(await v_9ff376(async () => ({ state: "granted" }))).toBe(true);
  });
  test("none · revoked · 조회 실패는 막는다", async () => {
    expect(await v_9ff376(async () => ({ state: "none" }))).toBe(false);
    expect(await v_9ff376(async () => ({ state: "revoked" }))).toBe(false);
    expect(await v_9ff376(async () => { throw new Error("net"); })).toBe(false);
  });
});

describe("AFL-1040 로캘 5개 언어", () => {
  const v_921e19 = ["ko", "en", "ja", "zh-CN", "id"];
  test("faceEnroll.consentRequired 키 존재 · 원문자 없음", () => {
    for (const v_1614db of v_921e19) {
      const v_479f05 = v_9d3c52.readFileSync(v_9fe22d.join(__dirname, "../../locales", v_1614db, "common.json"), "utf8");
      const v_d5dda0 = JSON.parse(v_479f05);
      const v_3f4e2e = v_d5dda0.faceEnroll.consentRequired;
      expect(v_3f4e2e.title && v_3f4e2e.message && v_3f4e2e.goSettings).toBeTruthy();
      expect(v_479f05).not.toMatch(/[\u2460-\u2473\u3260-\u327F\u24B6-\u24E9\u2474-\u249B]/);
    }
  });
});
