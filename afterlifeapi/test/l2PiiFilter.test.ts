import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_c9411d, v_0de2cd } from "../src/lib/piiFilter";
import { v_0ac5b7, v_3821c0 } from "../src/lib/memoryStore";
import type { v_273a0c } from "../src/lib/env";

const v_9542f7 = v_c9c489 as unknown as v_273a0c;

v_469bf2("hasPii", () => {
  v_23805a("PII를 탐지한다", () => {
    v_4d37e3(v_0de2cd("010-1234-5678")).toBe(true);       
    v_4d37e3(v_0de2cd("901201-1234567")).toBe(true);      
    v_4d37e3(v_0de2cd("110-234-567890")).toBe(true);      
    v_4d37e3(v_0de2cd("12345678901234")).toBe(true);      
    v_4d37e3(v_0de2cd("비밀번호는 abcd1234")).toBe(true);  
    v_4d37e3(v_0de2cd("서울 강남구 테헤란로 123")).toBe(true); 
    v_4d37e3(v_0de2cd("서울시 강남구")).toBe(true);        
  });
  v_23805a("정상 취향/기억은 오탐하지 않는다", () => {
    for (const v_fd5f43 of ["콜라", "사이다", "재즈", "등산 좋아함", "라떼",
                     "2가 더 좋아", "라떼 2로 주세요", "spinning 좋아해",
                     "opinion 나누기", "조회수 1234567890 관심"]) {
      v_4d37e3(v_0de2cd(v_fd5f43)).toBe(false);
    }
  });
});

v_469bf2("stripPii", () => {
  v_23805a("preference 값 또는 키가 PII면 그 키 제거, 정상 키 보존", () => {
    const v_8d4337 = v_c9411d({ preference_personal: { 비번: "1234abcd", 취미: "등산" } });
    v_4d37e3(v_8d4337.preference_personal).toEqual({ 취미: "등산" });
  });
  v_23805a("preference 값이 숫자 타입 PII(계좌)여도 제거", () => {
    const v_8d4337 = v_c9411d({ preference_personal: { 계좌: 12345678901234, 취미: "등산" } });
    v_4d37e3(v_8d4337.preference_personal).toEqual({ 취미: "등산" });
  });
  v_23805a("relation이 PII면 제거", () => {
    const v_8d4337 = v_c9411d({ relation: "우리집 강남구 테헤란로 123" });
    v_4d37e3(v_8d4337.relation).toBeUndefined();
  });
  v_23805a("memories의 PII 항목만 제거", () => {
    const v_8d4337 = v_c9411d({ memories_personal: ["계좌 110-234-567890", "산책 좋아함"] });
    v_4d37e3(v_8d4337.memories_personal).toEqual(["산책 좋아함"]);
  });
  v_23805a("입력 객체를 변형하지 않는다(불변)", () => {
    const v_bbda62 = { preference_personal: { 취미: "등산" } };
    v_c9411d({ ...v_bbda62, memories_personal: ["계좌 12345678901234"] });
    v_4d37e3(v_bbda62.preference_personal).toEqual({ 취미: "등산" });
  });
  v_23805a("정상 숫자/불리언 preference는 그대로 통과", () => {
    const v_8d4337 = v_c9411d({ preference_personal: { 나이대: 30, 흡연: false } });
    v_4d37e3(v_8d4337.preference_personal).toEqual({ 나이대: 30, 흡연: false });
  });
});

v_469bf2("updateOntFromExtraction 2차 필터 통합", () => {
  v_23805a("PII만 추출되면 필터 후 빈 추출 → skipped", async () => {
    const v_cb35cb = await v_0ac5b7(
      v_9542f7, 930001, 8801, { memories_personal: ["계좌 110-234-567890"] }, "call",
    );
    v_4d37e3(v_cb35cb).toEqual({ rev: 0, skipped: true });
  });
  v_23805a("PII 섞인 추출은 PII만 drop 후 저장", async () => {
    await v_9542f7.KV_ONT.delete("l2:930002:8802");
    const v_cb35cb = await v_0ac5b7(
      v_9542f7, 930002, 8802,
      { preference_personal: { 음료: "콜라", 비번: "1234abcd" }, memories_personal: ["계좌 12345678901234", "등산 좋아함"] },
      "call",
    );
    v_4d37e3(v_cb35cb.skipped).toBe(false);
    const v_1af19b = JSON.parse((await v_3821c0(v_9542f7, 930002, 8802))!);
    v_4d37e3(v_1af19b.preference_personal).toEqual({ 음료: "콜라" });
    v_4d37e3(v_1af19b.memories_personal).toEqual(["등산 좋아함"]);
  });
});
