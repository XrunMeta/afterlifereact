import { describe, it, expect } from "vitest";
import { env } from "cloudflare:test";
import { stripPii, hasPii } from "../src/lib/piiFilter";
import { updateOntFromExtraction, readOnt } from "../src/lib/memoryStore";
import type { Bindings } from "../src/lib/env";

const E = env as unknown as Bindings;

describe("hasPii", () => {
  it("PII를 탐지한다", () => {
    expect(hasPii("010-1234-5678")).toBe(true);       
    expect(hasPii("901201-1234567")).toBe(true);      
    expect(hasPii("110-234-567890")).toBe(true);      
    expect(hasPii("12345678901234")).toBe(true);      
    expect(hasPii("비밀번호는 abcd1234")).toBe(true);  
    expect(hasPii("서울 강남구 테헤란로 123")).toBe(true); 
    expect(hasPii("서울시 강남구")).toBe(true);        
  });
  it("정상 취향/기억은 오탐하지 않는다", () => {
    for (const s of ["콜라", "사이다", "재즈", "등산 좋아함", "라떼",
                     "2가 더 좋아", "라떼 2로 주세요", "spinning 좋아해",
                     "opinion 나누기", "조회수 1234567890 관심"]) {
      expect(hasPii(s)).toBe(false);
    }
  });
});

describe("stripPii", () => {
  it("preference 값 또는 키가 PII면 그 키 제거, 정상 키 보존", () => {
    const out = stripPii({ preference_personal: { 비번: "1234abcd", 취미: "등산" } });
    expect(out.preference_personal).toEqual({ 취미: "등산" });
  });
  it("preference 값이 숫자 타입 PII(계좌)여도 제거", () => {
    const out = stripPii({ preference_personal: { 계좌: 12345678901234, 취미: "등산" } });
    expect(out.preference_personal).toEqual({ 취미: "등산" });
  });
  it("relation이 PII면 제거", () => {
    const out = stripPii({ relation: "우리집 강남구 테헤란로 123" });
    expect(out.relation).toBeUndefined();
  });
  it("memories의 PII 항목만 제거", () => {
    const out = stripPii({ memories_personal: ["계좌 110-234-567890", "산책 좋아함"] });
    expect(out.memories_personal).toEqual(["산책 좋아함"]);
  });
  it("입력 객체를 변형하지 않는다(불변)", () => {
    const input = { preference_personal: { 취미: "등산" } };
    stripPii({ ...input, memories_personal: ["계좌 12345678901234"] });
    expect(input.preference_personal).toEqual({ 취미: "등산" });
  });
  it("정상 숫자/불리언 preference는 그대로 통과", () => {
    const out = stripPii({ preference_personal: { 나이대: 30, 흡연: false } });
    expect(out.preference_personal).toEqual({ 나이대: 30, 흡연: false });
  });
});

describe("updateOntFromExtraction 2차 필터 통합", () => {
  it("PII만 추출되면 필터 후 빈 추출 → skipped", async () => {
    const r = await updateOntFromExtraction(
      E, 930001, 8801, { memories_personal: ["계좌 110-234-567890"] }, "call",
    );
    expect(r).toEqual({ rev: 0, skipped: true });
  });
  it("PII 섞인 추출은 PII만 drop 후 저장", async () => {
    await E.KV_ONT.delete("l2:930002:8802");
    const r = await updateOntFromExtraction(
      E, 930002, 8802,
      { preference_personal: { 음료: "콜라", 비번: "1234abcd" }, memories_personal: ["계좌 12345678901234", "등산 좋아함"] },
      "call",
    );
    expect(r.skipped).toBe(false);
    const l2 = JSON.parse((await readOnt(E, 930002, 8802))!);
    expect(l2.preference_personal).toEqual({ 음료: "콜라" });
    expect(l2.memories_personal).toEqual(["등산 좋아함"]);
  });
});
