
jest.mock("../../config/apiBase", () => ({ API_BASE: "https://oth-path.test" }));
jest.mock("../../stores/dialogStore", () => ({ showAlert: jest.fn() }));
jest.mock("../../i18n", () => ({
  __esModule: true,
  default: { t: (v_b24339, v_328259) => v_328259?.defaultValue ?? v_b24339 },
}));

import { v_889fad } from "../../stores/dialogStore";
import { v_d0eac6 } from "../authFetch";

const v_4d33b2 = (v_c99bd2, v_a8cd21) => JSON.stringify({ error: { code: v_c99bd2, message: v_a8cd21 } });

describe("noticeIfSessionRevoked", () => {
  beforeEach(() => (v_889fad as jest.Mock).mockClear());

  test("SESSION_REVOKED → 이유를 한 번 띄우고, 1분 안의 같은 거절은 다시 띄우지 않음", async () => {
    expect(await v_d0eac6(v_4d33b2("SESSION_REVOKED", "관리자에 의해 로그아웃 처리되었습니다. 다시 로그인해 주세요."))).toBe(true);
    expect(v_889fad).toHaveBeenCalledTimes(1);
    expect((v_889fad as jest.Mock).mock.calls[0][0]).toBe("이용 제한 안내");
    expect(await v_d0eac6(v_4d33b2("SESSION_REVOKED", "관리자에 의해 이 기기의 사용이 차단되었습니다."))).toBe(true);
    expect(v_889fad).toHaveBeenCalledTimes(1);
  });

  test("다른 401·JSON 아닌 응답은 안내하지 않음", async () => {
    expect(await v_d0eac6(v_4d33b2("UNAUTHENTICATED", "Refresh token revoked."))).toBe(false);
    expect(await v_d0eac6("<html>bad gateway</html>")).toBe(false);
    expect(v_889fad).not.toHaveBeenCalled();
  });
});
