import { describe, it, expect } from "vitest";
import { faceNamespace } from "../src/lib/cloneFaceScope";

describe("faceNamespace", () => {
  it("userId와 cloneId를 콜론으로 결합한다", () => {
    expect(faceNamespace(7, 42)).toBe("7:42");
  });

  it("서로 다른 클론은 서로 다른 namespace를 갖는다", () => {
    expect(faceNamespace(7, 42)).not.toBe(faceNamespace(7, 43));
  });

  it("서로 다른 사용자는 서로 다른 namespace를 갖는다", () => {
    expect(faceNamespace(7, 42)).not.toBe(faceNamespace(8, 42));
  });
});
