import { v_f22ce9 } from "../../src/realtime/devCallText";

describe("submitDevText", () => {
  it("유효한 텍스트를 say로 보내고 입력창을 비운다", () => {
    const v_3e2c87 = jest.fn().mockResolvedValue(undefined);
    const v_43d2ef = jest.fn();
    v_f22ce9("여보세요", v_3e2c87, v_43d2ef);
    expect(v_3e2c87).toHaveBeenCalledWith("여보세요");
    expect(v_43d2ef).toHaveBeenCalledWith("");
  });

  it("앞뒤 공백을 trim 해서 보낸다", () => {
    const v_3e2c87 = jest.fn().mockResolvedValue(undefined);
    const v_43d2ef = jest.fn();
    v_f22ce9("  안녕  ", v_3e2c87, v_43d2ef);
    expect(v_3e2c87).toHaveBeenCalledWith("안녕");
  });

  it("빈 문자열은 say·setText 를 호출하지 않는다", () => {
    const v_3e2c87 = jest.fn();
    const v_43d2ef = jest.fn();
    v_f22ce9("", v_3e2c87, v_43d2ef);
    expect(v_3e2c87).not.toHaveBeenCalled();
    expect(v_43d2ef).not.toHaveBeenCalled();
  });

  it("공백만 있는 입력은 무시한다", () => {
    const v_3e2c87 = jest.fn();
    const v_43d2ef = jest.fn();
    v_f22ce9("   ", v_3e2c87, v_43d2ef);
    expect(v_3e2c87).not.toHaveBeenCalled();
    expect(v_43d2ef).not.toHaveBeenCalled();
  });
});
