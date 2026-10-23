import { v_55270a } from "../../src/face/whoIntent";

describe("detectWhoIntent — 확실한 '누구냐' 질문만", () => {
  test.each([
    "나 누구야?",
    "내가 누군지 알아",
    "자 내가 다시 왔거든 내가 누구게",
    "카메라 보고 있다 나 누구게",
    "나 알아?",
    "내 이름 뭐야",
    "who am I?",
    "do you know me",
    "僕は誰？",
    "我是谁",
  ])("self: %s", (v_8d41d7) => expect(v_55270a(v_8d41d7)).toBe("self"));

  test.each([
    "이 사람 누구야",
    "이 친구 누구야",
    "아니 지금이 사람 누군지 한번 봐 줘",
    "얘 누구게",
    "이 친구 알아?",
    "who is this?",
    "この人は誰？",
    "他是谁",
  ])("other: %s", (v_8d41d7) => expect(v_55270a(v_8d41d7)).toBe("other"));

  test.each([
    "너는 누구니",
    "너 이름이 뭐야",
    "君は誰",
    "who are you",
    "나 누구랑 갈까",
    "나 알아서 할게",
    "응 안녕",
    "오늘 날씨 어때",
    "",
  ])("null: %s", (v_8d41d7) => expect(v_55270a(v_8d41d7)).toBeNull());
});
