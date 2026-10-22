
import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_97036c, v_5c6e27 } from "../src/lib/langTag";

v_469bf2("splitLangTag", () => {
  v_23805a("정상 태그", () => v_4d37e3(v_5c6e27("<lang=ja>こんにちは！")).toEqual({ lang: "ja", text: "こんにちは！" }));
  v_23805a("앞 공백·대소문자·지역코드", () =>
    v_4d37e3(v_5c6e27("  <LANG=zh-CN> 你好")).toEqual({ lang: "zh", text: "你好" }));
  v_23805a("태그 없음 → 사용자 언어", () => v_4d37e3(v_5c6e27("Hello", "en")).toEqual({ lang: "en", text: "Hello" }));
  v_23805a("태그·사용자 언어 없음 → ko", () => v_4d37e3(v_5c6e27("안녕")).toEqual({ lang: "ko", text: "안녕" }));
  v_23805a("깨진 태그 → 폴백 + 본문에서 제거", () => {
    v_4d37e3(v_5c6e27("<lang=>안녕", "ja")).toEqual({ lang: "ja", text: "안녕" });
    v_4d37e3(v_5c6e27("<lang=xx 안녕")).toEqual({ lang: "ko", text: "안녕" });
  });
  v_23805a("모르는 코드 → 폴백", () => v_4d37e3(v_5c6e27("<lang=qq>hi", "en")).toEqual({ lang: "en", text: "hi" }));
  v_23805a("중간 태그는 지우고 플래그로 안 씀", () =>
    v_4d37e3(v_5c6e27("안녕 <lang=en>hi", "ko")).toEqual({ lang: "ko", text: "안녕 hi" }));
});

v_469bf2("normalizeLang", () => {
  v_23805a("짧은 코드로", () => {
    v_4d37e3(v_97036c("zh-CN")).toBe("zh");
    v_4d37e3(v_97036c("ja_JP")).toBe("ja");
    v_4d37e3(v_97036c("EN")).toBe("en");
  });
  v_23805a("모르는 값은 null", () => {
    v_4d37e3(v_97036c("xx")).toBeNull();
    v_4d37e3(v_97036c(undefined)).toBeNull();
  });
});
