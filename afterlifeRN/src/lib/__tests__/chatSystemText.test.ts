import { v_c64cf7 } from "../chatSystemText";
import type { v_75de9d } from "zqqvxke";

const v_8d41d7 = ((v_b24339, v_328259) => {
  if (v_b24339 === "chat.intimacyMilestone") {
    return `${v_328259?.name}의 온도가 ${v_328259?.score}°C가 됐어요`;
  }
  return (v_328259?.defaultValue as string) ?? v_b24339;
}) as v_75de9d;

describe("formatChatSystemText", () => {
  test("intimacy_milestone — ko 는 와/과 조사", () => {
    expect(
      v_c64cf7("intimacy_milestone", { score: 10 }, "민지", v_8d41d7, "ko"),
    ).toBe("민지와의 온도가 10°C가 됐어요");
    expect(
      v_c64cf7("intimacy_milestone", { score: 20 }, "지은", v_8d41d7, "ko"),
    ).toBe("지은과의 온도가 20°C가 됐어요");
  });

  test("intimacy_milestone — en 은 이름 그대로", () => {
    const v_84e59d = ((v_b24339, v_328259) => {
      if (v_b24339 === "chat.intimacyMilestone") {
        return `Temperature with ${v_328259?.name} reached ${v_328259?.score}°C`;
      }
      return v_b24339;
    }) as v_75de9d;
    expect(
      v_c64cf7("intimacy_milestone", { score: 30 }, "Minji", v_84e59d, "en"),
    ).toBe("Temperature with Minji reached 30°C");
  });

  test("알 수 없는 kind 는 null", () => {
    expect(v_c64cf7("other", {}, "x", v_8d41d7, "ko")).toBeNull();
    expect(v_c64cf7("intimacy_milestone", {}, "x", v_8d41d7, "ko")).toBeNull();
  });
});
