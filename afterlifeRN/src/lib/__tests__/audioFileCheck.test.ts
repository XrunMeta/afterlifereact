import {
  base64ToBytes,
  extensionOf,
  hasAudioExtension,
  isAudioMime,
  matchesAudioMagic,
} from "../audioFileCheck";

const bytesOf = (...parts: (string | number)[]): Uint8Array => {
  const out: number[] = [];
  for (const p of parts) {
    if (typeof p === "number") out.push(p);
    else for (const ch of p) out.push(ch.charCodeAt(0));
  }
  return Uint8Array.from(out);
};

describe("extensionOf / hasAudioExtension", () => {
  it("확장자를 소문자로 뽑는다", () => {
    expect(extensionOf("voice.MP3")).toBe("mp3");
    expect(extensionOf("a/b/c.m4a")).toBe("m4a");
  });

  it("확장자가 없거나 점으로 끝나면 빈 문자열", () => {
    expect(extensionOf("noext")).toBe("");
    expect(extensionOf("trailing.")).toBe("");
    expect(extensionOf(null)).toBe("");
  });

  it("오디오 확장자만 통과", () => {
    expect(hasAudioExtension("a.wav")).toBe(true);
    expect(hasAudioExtension("a.flac")).toBe(true);
    expect(hasAudioExtension("a.pdf")).toBe(false);
    expect(hasAudioExtension("a.mov")).toBe(false);
  });
});

describe("isAudioMime", () => {
  it("audio/* 와 예외 컨테이너를 허용", () => {
    expect(isAudioMime("audio/mpeg")).toBe(true);
    expect(isAudioMime("AUDIO/WAV")).toBe(true);
    expect(isAudioMime("application/ogg")).toBe(true);

    expect(isAudioMime("video/mp4")).toBe(true);
  });

  it("그 외는 거부", () => {
    expect(isAudioMime("application/pdf")).toBe(false);
    expect(isAudioMime("image/png")).toBe(false);
    expect(isAudioMime(undefined)).toBe(false);
    expect(isAudioMime("")).toBe(false);
  });
});

describe("matchesAudioMagic", () => {
  it("MP3 (ID3 / 프레임 싱크)", () => {
    expect(matchesAudioMagic(bytesOf("ID3", 0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0))).toBe(true);
    expect(matchesAudioMagic(bytesOf(0xff, 0xfb, 0x90, 0x00))).toBe(true);
  });

  it("WAV / AIFF", () => {
    expect(matchesAudioMagic(bytesOf("RIFF", 0, 0, 0, 0, "WAVE"))).toBe(true);
    expect(matchesAudioMagic(bytesOf("FORM", 0, 0, 0, 0, "AIFF"))).toBe(true);
  });

  it("m4a/mp4 는 ftyp 박스로 판별", () => {
    expect(matchesAudioMagic(bytesOf(0, 0, 0, 0x20, "ftypM4A "))).toBe(true);
  });

  it("Ogg / FLAC / CAF / AMR / WMA", () => {
    expect(matchesAudioMagic(bytesOf("OggS", 0, 0, 0, 0))).toBe(true);
    expect(matchesAudioMagic(bytesOf("fLaC", 0, 0, 0, 0))).toBe(true);
    expect(matchesAudioMagic(bytesOf("caff", 0, 0, 0, 0))).toBe(true);
    expect(matchesAudioMagic(bytesOf("#!AMR", 0, 0, 0))).toBe(true);
    expect(matchesAudioMagic(bytesOf(0x30, 0x26, 0xb2, 0x75))).toBe(true);
  });

  it("오디오가 아닌 헤더는 거부", () => {

    expect(matchesAudioMagic(bytesOf("%PDF-1.7", 0, 0, 0, 0))).toBe(false);

    expect(matchesAudioMagic(bytesOf(0x89, "PNG", 0x0d, 0x0a, 0x1a, 0x0a))).toBe(false);

    expect(matchesAudioMagic(bytesOf("PK", 0x03, 0x04))).toBe(false);

    expect(matchesAudioMagic(bytesOf("RIFF", 0, 0, 0, 0, "AVI "))).toBe(false);
  });

  it("너무 짧으면 거부", () => {
    expect(matchesAudioMagic(Uint8Array.from([0xff]))).toBe(false);
    expect(matchesAudioMagic(Uint8Array.from([]))).toBe(false);
  });
});

describe("base64ToBytes", () => {
  it("표준 base64 를 디코딩한다", () => {

    expect(Array.from(base64ToBytes("SUQz"))).toEqual([0x49, 0x44, 0x33]);
  });

  it("패딩·개행이 섞여도 동작", () => {
    expect(Array.from(base64ToBytes("SU\nQz=="))).toEqual([0x49, 0x44, 0x33]);
  });
});
