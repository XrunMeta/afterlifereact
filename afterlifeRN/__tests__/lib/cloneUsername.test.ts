import { v_0bee38, v_86ee62 } from "../../src/lib/cloneUsername";

const v_a0f4a7 = /^[a-z0-9_]{3,30}$/;

describe("cloneUsernameFromName", () => {
  it("입력받은 한글 이름을 로마자로 바꿔 숫자를 붙인다", () => {
    expect(v_86ee62("호가든", () => 0.4821)).toBe("hogadeun_4821");
  });

  it("영문 이름은 소문자로, 허용 안 되는 글자는 _ 로", () => {
    expect(v_86ee62("Mina Kim!", () => 0.0007)).toBe("mina_kim_0007");
  });

  it("이름을 아이디로 못 바꾸면(이모지·일본어 등) clone 을 쓴다", () => {
    expect(v_86ee62("🌸", () => 0.5)).toBe("clone_5000");
    expect(v_86ee62("さくら", () => 0.5)).toBe("clone_5000");
  });

  it("두 글자 이하 결과도 그대로 쓴다(숫자를 붙이면 3자 이상)", () => {
    expect(v_86ee62("이", () => 0.1234)).toBe("i_1234");
  });

  it("긴 이름은 잘라서 30자 안에 맞춘다", () => {
    const v_ceb55a = v_86ee62("가나다라마바사아자차카타파하가나다라", () => 0.9999);
    expect(v_ceb55a.length).toBeLessThanOrEqual(30);
    expect(v_ceb55a.endsWith("_9999")).toBe(true);
  });

  it("항상 아이디 형식에 맞는다", () => {
    for (const v_f4e98d of ["호가든", "박 하나", "A", "___", "ㅋㅋ", "Ünïcode", ""]) {
      const v_ceb55a = v_86ee62(v_f4e98d);
      expect(v_ceb55a).toMatch(v_a0f4a7);
      expect(v_ceb55a).toMatch(new RegExp(`_\\d{${v_0bee38}}$`));
    }
  });
});
