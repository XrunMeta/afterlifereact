import { v_6cba83 } from "../../src/lib/romanizeHangul";

describe("romanizeHangul", () => {
  it("한글 이름을 로마자로 바꾼다", () => {
    expect(v_6cba83("호가든")).toBe("hogadeun");
    expect(v_6cba83("박하나")).toBe("bakhana");
    expect(v_6cba83("김민수")).toBe("gimminsu");
    expect(v_6cba83("쿄카")).toBe("kyoka");
  });

  it("받침은 대표음으로 적는다", () => {
    expect(v_6cba83("강")).toBe("gang");
    expect(v_6cba83("밝")).toBe("bak");
    expect(v_6cba83("옷")).toBe("ot");
  });

  it("한글이 아닌 글자는 그대로 둔다", () => {
    expect(v_6cba83("Mina 3")).toBe("Mina 3");
    expect(v_6cba83("호가든Z")).toBe("hogadeunZ");
  });
});
