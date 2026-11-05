
jest.mock("../../stores/dialogStore", () => ({ showAlert: jest.fn() }));
jest.mock("../../i18n", () => ({
  __esModule: true,
  default: { t: (v_b24339, v_328259) => v_328259?.defaultValue ?? v_b24339 },
}));

import { v_889fad } from "../../stores/dialogStore";
import { v_84a859 } from "../../api/auth";
import { v_650589, v_1a718e } from "../penaltyNotice";

describe("notifyIfPenalized", () => {
  beforeEach(() => (v_889fad as jest.Mock).mockClear());

  test("COMMENT_BANNED / INTERACTION_BANNED → 안내를 띄우고 true", () => {
    expect(v_650589(new v_84a859(403, "COMMENT_BANNED", "댓글 제한"))).toBe(true);
    expect(v_889fad).toHaveBeenLastCalledWith("이용 제한 안내", "댓글 제한");
    expect(v_650589(new v_84a859(403, "INTERACTION_BANNED", "좋아요 제한"))).toBe(true);
    expect(v_889fad).toHaveBeenCalledTimes(2);
  });

  test("다른 오류·일반 Error 는 안내하지 않음", () => {
    expect(v_650589(new v_84a859(403, "FORBIDDEN", "x"))).toBe(false);
    expect(v_650589(new Error("network"))).toBe(false);
    expect(v_650589(undefined)).toBe(false);
    expect(v_889fad).not.toHaveBeenCalled();
    expect(v_1a718e(new v_84a859(403, "COMMENT_BANNED", "x"))).toBe(true);
  });
});
