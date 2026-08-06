import {
  v_878cce,
  v_214ff9,
  v_aa1f48,
  v_cc6e14,
  v_f8ff8a,
} from "../audioFileCheck";

const v_25a01c = (...v_468545: (string | number)[]): Uint8Array => {
  const v_8d4337 = [];
  for (const v_e2a85c of v_468545) {
    if (typeof v_e2a85c === "number") v_8d4337.push(v_e2a85c);
    else for (const v_10a17d of v_e2a85c) v_8d4337.push(v_10a17d.charCodeAt(0));
  }
  return Uint8Array.from(v_8d4337);
};

describe("extensionOf / hasAudioExtension", () => {
  it("확장자를 소문자로 뽑는다", () => {
    expect(v_214ff9("voice.MP3")).toBe("mp3");
    expect(v_214ff9("a/b/c.m4a")).toBe("m4a");
  });

  it("확장자가 없거나 점으로 끝나면 빈 문자열", () => {
    expect(v_214ff9("noext")).toBe("");
    expect(v_214ff9("trailing.")).toBe("");
    expect(v_214ff9(null)).toBe("");
  });

  it("오디오 확장자만 통과", () => {
    expect(v_aa1f48("a.wav")).toBe(true);
    expect(v_aa1f48("a.flac")).toBe(true);
    expect(v_aa1f48("a.pdf")).toBe(false);
    expect(v_aa1f48("a.mov")).toBe(false);
  });
});

describe("isAudioMime", () => {
  it("audio/* 와 예외 컨테이너를 허용", () => {
    expect(v_cc6e14("audio/mpeg")).toBe(true);
    expect(v_cc6e14("AUDIO/WAV")).toBe(true);
    expect(v_cc6e14("application/ogg")).toBe(true);

    expect(v_cc6e14("video/mp4")).toBe(true);
  });

  it("그 외는 거부", () => {
    expect(v_cc6e14("application/pdf")).toBe(false);
    expect(v_cc6e14("image/png")).toBe(false);
    expect(v_cc6e14(undefined)).toBe(false);
    expect(v_cc6e14("")).toBe(false);
  });
});

describe("matchesAudioMagic", () => {
  it("MP3 (ID3 / 프레임 싱크)", () => {
    expect(v_f8ff8a(v_25a01c("ID3", 0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0))).toBe(true);
    expect(v_f8ff8a(v_25a01c(0xff, 0xfb, 0x90, 0x00))).toBe(true);
  });

  it("WAV / AIFF", () => {
    expect(v_f8ff8a(v_25a01c("RIFF", 0, 0, 0, 0, "WAVE"))).toBe(true);
    expect(v_f8ff8a(v_25a01c("FORM", 0, 0, 0, 0, "AIFF"))).toBe(true);
  });

  it("m4a/mp4 는 ftyp 박스로 판별", () => {
    expect(v_f8ff8a(v_25a01c(0, 0, 0, 0x20, "ftypM4A "))).toBe(true);
  });

  it("Ogg / FLAC / CAF / AMR / WMA", () => {
    expect(v_f8ff8a(v_25a01c("OggS", 0, 0, 0, 0))).toBe(true);
    expect(v_f8ff8a(v_25a01c("fLaC", 0, 0, 0, 0))).toBe(true);
    expect(v_f8ff8a(v_25a01c("caff", 0, 0, 0, 0))).toBe(true);
    expect(v_f8ff8a(v_25a01c("#!AMR", 0, 0, 0))).toBe(true);
    expect(v_f8ff8a(v_25a01c(0x30, 0x26, 0xb2, 0x75))).toBe(true);
  });

  it("오디오가 아닌 헤더는 거부", () => {

    expect(v_f8ff8a(v_25a01c("%PDF-1.7", 0, 0, 0, 0))).toBe(false);

    expect(v_f8ff8a(v_25a01c(0x89, "PNG", 0x0d, 0x0a, 0x1a, 0x0a))).toBe(false);

    expect(v_f8ff8a(v_25a01c("PK", 0x03, 0x04))).toBe(false);

    expect(v_f8ff8a(v_25a01c("RIFF", 0, 0, 0, 0, "AVI "))).toBe(false);
  });

  it("너무 짧으면 거부", () => {
    expect(v_f8ff8a(Uint8Array.from([0xff]))).toBe(false);
    expect(v_f8ff8a(Uint8Array.from([]))).toBe(false);
  });
});

describe("base64ToBytes", () => {
  it("표준 base64 를 디코딩한다", () => {

    expect(Array.from(v_878cce("SUQz"))).toEqual([0x49, 0x44, 0x33]);
  });

  it("패딩·개행이 섞여도 동작", () => {
    expect(Array.from(v_878cce("SU\nQz=="))).toEqual([0x49, 0x44, 0x33]);
  });
});
