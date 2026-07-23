import { renderHook, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));
jest.mock("../../src/stores/dialogStore", () => ({
  showAlert: jest.fn(),
}));
jest.mock("../../src/api/reports", () => ({
  getMyReportsReceived: jest.fn(),
}));

import { showAlert } from "../../src/stores/dialogStore";
import { getMyReportsReceived } from "../../src/api/reports";
import { useAuthStore } from "../../src/stores/authStore";
import {
  useReportAcceptedGate,
  __resetReportAcceptedGateForTests,
} from "../../src/hooks/useReportAcceptedGate";

const mockShowAlert = showAlert as jest.MockedFunction<typeof showAlert>;
const mockGetReceived = getMyReportsReceived as jest.MockedFunction<typeof getMyReportsReceived>;

const SEEN_KEY = "afterlife.reports.received.lastSeenReviewedAt";

function items(reviewedAts: (string | null)[]) {
  return {
    items: reviewedAts.map((reviewedAt, i) => ({
      id: i + 1,
      reportType: "user" as const,
      reason: "reason",
      createdAt: "2026-07-01 00:00:00",
      reviewedAt,
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

async function flush() {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
}

beforeEach(async () => {
  mockShowAlert.mockReset();
  mockGetReceived.mockReset();
  __resetReportAcceptedGateForTests();
  await AsyncStorage.clear();
  useAuthStore.setState({ accessToken: null });
});

test("최초 1회 — 수락된 신고가 있으면 알림 1회 표시 + lastSeen 저장", async () => {
  mockGetReceived.mockResolvedValue(items(["2026-07-20 10:00:00"]));
  useAuthStore.setState({ accessToken: "tok-1" });

  renderHook(() => useReportAcceptedGate());
  await waitFor(() => expect(mockShowAlert).toHaveBeenCalledTimes(1));

  expect(mockGetReceived).toHaveBeenCalledWith("tok-1");
  expect(await AsyncStorage.getItem(SEEN_KEY)).toBe("2026-07-20 10:00:00");
});

test("같은 reviewedAt 으로 재마운트(재로그인·재시작 재현) — 알림 미표시", async () => {

  await AsyncStorage.setItem(SEEN_KEY, "2026-07-20 10:00:00");
  mockGetReceived.mockResolvedValue(items(["2026-07-20 10:00:00"]));
  useAuthStore.setState({ accessToken: "tok-1" });

  renderHook(() => useReportAcceptedGate());
  await flush();

  __resetReportAcceptedGateForTests(); 
  renderHook(() => useReportAcceptedGate());
  await flush();

  expect(mockGetReceived).toHaveBeenCalled();
  expect(mockShowAlert).not.toHaveBeenCalled();
});

test("더 최신 reviewedAt 이 생기면 다시 알림 표시", async () => {
  await AsyncStorage.setItem(SEEN_KEY, "2026-07-20 10:00:00");
  mockGetReceived.mockResolvedValue(items(["2026-07-20 10:00:00", "2026-07-21 09:30:00"]));
  useAuthStore.setState({ accessToken: "tok-1" });

  renderHook(() => useReportAcceptedGate());
  await waitFor(() => expect(mockShowAlert).toHaveBeenCalledTimes(1));

  expect(await AsyncStorage.getItem(SEEN_KEY)).toBe("2026-07-21 09:30:00");
});

test("reviewedAt 포맷이 섞여 있어도(공백/ISO) 실제 시각 기준으로 안전하게 비교", async () => {

  await AsyncStorage.setItem(SEEN_KEY, "2026-08-15T00:00:00.000Z");
  mockGetReceived.mockResolvedValue(items(["2026-07-20 10:00:00"]));
  useAuthStore.setState({ accessToken: "tok-1" });

  renderHook(() => useReportAcceptedGate());
  await flush();

  expect(mockGetReceived).toHaveBeenCalled();
  expect(mockShowAlert).not.toHaveBeenCalled();
});

test("파싱 불가능한 reviewedAt 항목은 방어적으로 무시하고, 유효한 값 중 최신으로 판정", async () => {
  mockGetReceived.mockResolvedValue(items(["not-a-date", "2026-07-22 12:00:00"]));
  useAuthStore.setState({ accessToken: "tok-1" });

  renderHook(() => useReportAcceptedGate());
  await waitFor(() => expect(mockShowAlert).toHaveBeenCalledTimes(1));

  expect(await AsyncStorage.getItem(SEEN_KEY)).toBe("2026-07-22 12:00:00");
});

test("getMyReportsReceived 실패(네트워크 등) — 가드 롤백돼 재마운트 시 다시 조회 시도", async () => {
  mockGetReceived.mockRejectedValueOnce(new Error("network error"));
  useAuthStore.setState({ accessToken: "tok-1" });

  renderHook(() => useReportAcceptedGate());
  await flush();

  expect(mockGetReceived).toHaveBeenCalledTimes(1);
  expect(mockShowAlert).not.toHaveBeenCalled();

  mockGetReceived.mockResolvedValueOnce(items(["2026-07-20 10:00:00"]));
  renderHook(() => useReportAcceptedGate());
  await waitFor(() => expect(mockShowAlert).toHaveBeenCalledTimes(1));

  expect(mockGetReceived).toHaveBeenCalledTimes(2);
});

test("AsyncStorage.setItem 실패 — warn 로그 + 알림은 정상 표시, 같은 세션 재마운트 시 재표시 없음", async () => {
  const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  const setItemSpy = jest
    .spyOn(AsyncStorage, "setItem")
    .mockRejectedValueOnce(new Error("storage full"));

  mockGetReceived.mockResolvedValue(items(["2026-07-20 10:00:00"]));
  useAuthStore.setState({ accessToken: "tok-1" });

  renderHook(() => useReportAcceptedGate());
  await waitFor(() => expect(mockShowAlert).toHaveBeenCalledTimes(1));

  expect(warnSpy).toHaveBeenCalledWith(
    "[useReportAcceptedGate] failed to persist lastSeenReviewedAt",
    expect.any(Error),
  );

  expect(await AsyncStorage.getItem(SEEN_KEY)).toBeNull();

  setItemSpy.mockRestore();
  mockShowAlert.mockReset();
  mockGetReceived.mockClear();
  renderHook(() => useReportAcceptedGate());
  await flush();

  expect(mockShowAlert).not.toHaveBeenCalled();

  warnSpy.mockRestore();
});

test("accessToken 이 바뀌면(재로그인·계정 전환) 다시 체크", async () => {
  mockGetReceived.mockResolvedValue(items(["2026-07-20 10:00:00"]));
  useAuthStore.setState({ accessToken: "user-a" });
  const first = renderHook(() => useReportAcceptedGate());
  await waitFor(() => expect(mockShowAlert).toHaveBeenCalledTimes(1));

  first.unmount();

  mockShowAlert.mockReset();
  mockGetReceived.mockResolvedValue(items(["2026-07-23 08:00:00"]));
  useAuthStore.setState({ accessToken: "user-b" });
  renderHook(() => useReportAcceptedGate());
  await waitFor(() => expect(mockShowAlert).toHaveBeenCalledTimes(1));
});
