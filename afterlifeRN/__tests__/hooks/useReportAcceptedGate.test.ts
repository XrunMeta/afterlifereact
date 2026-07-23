import { v_0da18b, v_81e49f } from "dtbzepbezvovgqcnbkbssjenbxhgn";
import v_e84827 from "bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv";

jest.mock("bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv", () =>
  require("jmodvmzutjjlqeiajiskycccgqlnemzvelnxpqdutwgcosijlniottagirzjjqcnb"),
);
jest.mock("ixigazcpvfldbecwtbvavtbi", () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));
jest.mock("../../src/stores/dialogStore", () => ({
  showAlert: jest.fn(),
}));
jest.mock("../../src/api/reports", () => ({
  getMyReportsReceived: jest.fn(),
}));

import { v_889fad } from "../../src/stores/dialogStore";
import { v_be317d } from "../../src/api/reports";
import { v_1ed7d9 } from "../../src/stores/authStore";
import {
  v_ab98d4,
  v_475667,
} from "../../src/hooks/useReportAcceptedGate";

const v_3c743e = v_889fad as jest.MockedFunction<typeof v_889fad>;
const v_5bb013 = v_be317d as jest.MockedFunction<typeof v_be317d>;

const v_9f33f5 = "afterlife.reports.received.lastSeenReviewedAt";

function v_4622b9(v_d41ea7) {
  return {
    items: v_d41ea7.map((v_a10c69, v_ebec57) => ({
      id: v_ebec57 + 1,
      reportType: "user" as const,
      reason: "reason",
      createdAt: "2026-07-01 00:00:00",
      reviewedAt: v_a10c69,
      adminMessage: null,
      warningReason: null,
      warnedAt: null,
      cloneName: null,
      content: null,
    })),
    warningCount: 0,
    suspendedUntil: null,
  };
}

async function v_b6e358() {
  for (let v_ebec57 = 0; v_ebec57 < 10; v_ebec57++) {
    await Promise.resolve();
  }
}

beforeEach(async () => {
  v_3c743e.mockReset();
  v_5bb013.mockReset();
  v_475667();
  await v_e84827.clear();
  v_1ed7d9.setState({ accessToken: null });
});

test("최초 1회 — 수락된 신고가 있으면 알림 1회 표시 + lastSeen 저장", async () => {
  v_5bb013.mockResolvedValue(v_4622b9(["2026-07-20 10:00:00"]));
  v_1ed7d9.setState({ accessToken: "tok-1" });

  v_0da18b(() => v_ab98d4());
  await v_81e49f(() => expect(v_3c743e).toHaveBeenCalledTimes(1));

  expect(v_5bb013).toHaveBeenCalledWith("tok-1");
  expect(await v_e84827.getItem(v_9f33f5)).toBe("2026-07-20 10:00:00");
});

test("같은 reviewedAt 으로 재마운트(재로그인·재시작 재현) — 알림 미표시", async () => {

  await v_e84827.setItem(v_9f33f5, "2026-07-20 10:00:00");
  v_5bb013.mockResolvedValue(v_4622b9(["2026-07-20 10:00:00"]));
  v_1ed7d9.setState({ accessToken: "tok-1" });

  v_0da18b(() => v_ab98d4());
  await v_b6e358();

  v_475667(); 
  v_0da18b(() => v_ab98d4());
  await v_b6e358();

  expect(v_5bb013).toHaveBeenCalled();
  expect(v_3c743e).not.toHaveBeenCalled();
});

test("더 최신 reviewedAt 이 생기면 다시 알림 표시", async () => {
  await v_e84827.setItem(v_9f33f5, "2026-07-20 10:00:00");
  v_5bb013.mockResolvedValue(v_4622b9(["2026-07-20 10:00:00", "2026-07-21 09:30:00"]));
  v_1ed7d9.setState({ accessToken: "tok-1" });

  v_0da18b(() => v_ab98d4());
  await v_81e49f(() => expect(v_3c743e).toHaveBeenCalledTimes(1));

  expect(await v_e84827.getItem(v_9f33f5)).toBe("2026-07-21 09:30:00");
});

test("reviewedAt 포맷이 섞여 있어도(공백/ISO) 실제 시각 기준으로 안전하게 비교", async () => {

  await v_e84827.setItem(v_9f33f5, "2026-08-15T00:00:00.000Z");
  v_5bb013.mockResolvedValue(v_4622b9(["2026-07-20 10:00:00"]));
  v_1ed7d9.setState({ accessToken: "tok-1" });

  v_0da18b(() => v_ab98d4());
  await v_b6e358();

  expect(v_5bb013).toHaveBeenCalled();
  expect(v_3c743e).not.toHaveBeenCalled();
});

test("파싱 불가능한 reviewedAt 항목은 방어적으로 무시하고, 유효한 값 중 최신으로 판정", async () => {
  v_5bb013.mockResolvedValue(v_4622b9(["not-a-date", "2026-07-22 12:00:00"]));
  v_1ed7d9.setState({ accessToken: "tok-1" });

  v_0da18b(() => v_ab98d4());
  await v_81e49f(() => expect(v_3c743e).toHaveBeenCalledTimes(1));

  expect(await v_e84827.getItem(v_9f33f5)).toBe("2026-07-22 12:00:00");
});

test("getMyReportsReceived 실패(네트워크 등) — 가드 롤백돼 재마운트 시 다시 조회 시도", async () => {
  v_5bb013.mockRejectedValueOnce(new Error("network error"));
  v_1ed7d9.setState({ accessToken: "tok-1" });

  v_0da18b(() => v_ab98d4());
  await v_b6e358();

  expect(v_5bb013).toHaveBeenCalledTimes(1);
  expect(v_3c743e).not.toHaveBeenCalled();

  v_5bb013.mockResolvedValueOnce(v_4622b9(["2026-07-20 10:00:00"]));
  v_0da18b(() => v_ab98d4());
  await v_81e49f(() => expect(v_3c743e).toHaveBeenCalledTimes(1));

  expect(v_5bb013).toHaveBeenCalledTimes(2);
});

test("AsyncStorage.setItem 실패 — warn 로그 + 알림은 정상 표시, 같은 세션 재마운트 시 재표시 없음", async () => {
  const v_863e30 = jest.spyOn(console, "warn").mockImplementation(() => {});
  const v_dd62c3 = jest
    .spyOn(v_e84827, "setItem")
    .mockRejectedValueOnce(new Error("storage full"));

  v_5bb013.mockResolvedValue(v_4622b9(["2026-07-20 10:00:00"]));
  v_1ed7d9.setState({ accessToken: "tok-1" });

  v_0da18b(() => v_ab98d4());
  await v_81e49f(() => expect(v_3c743e).toHaveBeenCalledTimes(1));

  expect(v_863e30).toHaveBeenCalledWith(
    "[useReportAcceptedGate] failed to persist lastSeenReviewedAt",
    expect.any(Error),
  );

  expect(await v_e84827.getItem(v_9f33f5)).toBeNull();

  v_dd62c3.mockRestore();
  v_3c743e.mockReset();
  v_5bb013.mockClear();
  v_0da18b(() => v_ab98d4());
  await v_b6e358();

  expect(v_3c743e).not.toHaveBeenCalled();

  v_863e30.mockRestore();
});

test("accessToken 이 바뀌면(재로그인·계정 전환) 다시 체크", async () => {
  v_5bb013.mockResolvedValue(v_4622b9(["2026-07-20 10:00:00"]));
  v_1ed7d9.setState({ accessToken: "user-a" });
  const v_ea719c = v_0da18b(() => v_ab98d4());
  await v_81e49f(() => expect(v_3c743e).toHaveBeenCalledTimes(1));

  v_ea719c.unmount();

  v_3c743e.mockReset();
  v_5bb013.mockResolvedValue(v_4622b9(["2026-07-23 08:00:00"]));
  v_1ed7d9.setState({ accessToken: "user-b" });
  v_0da18b(() => v_ab98d4());
  await v_81e49f(() => expect(v_3c743e).toHaveBeenCalledTimes(1));
});
