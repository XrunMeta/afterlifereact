import { submitDevText } from "../../src/realtime/devCallText";

describe("submitDevText", () => {
  it("유효한 텍스트를 say로 보내고 입력창을 비운다", () => {
    const say = jest.fn().mockResolvedValue(undefined);
    const setText = jest.fn();
    submitDevText("여보세요", say, setText);
    expect(say).toHaveBeenCalledWith("여보세요");
    expect(setText).toHaveBeenCalledWith("");
  });

  it("앞뒤 공백을 trim 해서 보낸다", () => {
    const say = jest.fn().mockResolvedValue(undefined);
    const setText = jest.fn();
    submitDevText("  안녕  ", say, setText);
    expect(say).toHaveBeenCalledWith("안녕");
  });

  it("빈 문자열은 say·setText 를 호출하지 않는다", () => {
    const say = jest.fn();
    const setText = jest.fn();
    submitDevText("", say, setText);
    expect(say).not.toHaveBeenCalled();
    expect(setText).not.toHaveBeenCalled();
  });

  it("공백만 있는 입력은 무시한다", () => {
    const say = jest.fn();
    const setText = jest.fn();
    submitDevText("   ", say, setText);
    expect(say).not.toHaveBeenCalled();
    expect(setText).not.toHaveBeenCalled();
  });
});
