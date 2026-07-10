import { renderHook } from "@testing-library/react-native";

jest.mock("../../src/stores/dialogStore", () => ({
  showAlert: jest.fn(),
}));
jest.mock("../../src/api/consent", () => ({
  getFaceBiometricConsent: jest.fn(),
  saveFaceBiometricConsent: jest.fn(),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "ko" },
  }),
}));

import { showAlert } from "../../src/stores/dialogStore";
import { getFaceBiometricConsent, saveFaceBiometricConsent } from "../../src/api/consent";
import { useFaceBiometricRetroPrompt } from "../../src/face/useFaceBiometricRetroPrompt";

const mockShowAlert = showAlert as jest.MockedFunction<typeof showAlert>;
const mockGet = getFaceBiometricConsent as jest.MockedFunction<typeof getFaceBiometricConsent>;
const mockSave = saveFaceBiometricConsent as jest.MockedFunction<typeof saveFaceBiometricConsent>;

beforeEach(() => {
  mockShowAlert.mockReset();
  mockGet.mockReset();
  mockSave.mockReset();
});

test("accessToken 없으면 조회 자체를 안 함", () => {
  renderHook(() => useFaceBiometricRetroPrompt(null));
  expect(mockGet).not.toHaveBeenCalled();
  expect(mockShowAlert).not.toHaveBeenCalled();
});

test("version null → showAlert 1회 호출", async () => {
  mockGet.mockResolvedValue({ state: "none", version: null, at: null });
  renderHook(() => useFaceBiometricRetroPrompt("tok"));
  await Promise.resolve();
  await Promise.resolve();
  expect(mockGet).toHaveBeenCalledWith("tok");
  expect(mockShowAlert).toHaveBeenCalledTimes(1);
});

test("version 이미 있음 → showAlert 미호출", async () => {
  mockGet.mockResolvedValue({ state: "granted", version: "v1", at: 1 });
  renderHook(() => useFaceBiometricRetroPrompt("tok"));
  await Promise.resolve();
  await Promise.resolve();
  expect(mockShowAlert).not.toHaveBeenCalled();
});

test("재렌더(같은 accessToken)해도 showAlert는 1회만(shownRef 가드)", async () => {
  mockGet.mockResolvedValue({ state: "none", version: null, at: null });
  const { rerender } = renderHook<void, { token: string }>(
    ({ token }) => useFaceBiometricRetroPrompt(token),
    { initialProps: { token: "tok" } },
  );
  await Promise.resolve();
  await Promise.resolve();
  rerender({ token: "tok" });
  await Promise.resolve();
  expect(mockGet).toHaveBeenCalledTimes(1);
  expect(mockShowAlert).toHaveBeenCalledTimes(1);
});

test("동의 버튼 onPress → saveFaceBiometricConsent(granted, v1, retro_prompt)", async () => {
  mockGet.mockResolvedValue({ state: "none", version: null, at: null });
  mockSave.mockResolvedValue({ ok: true, state: "granted" });
  renderHook(() => useFaceBiometricRetroPrompt("tok"));
  await Promise.resolve();
  await Promise.resolve();

  const [, , buttons] = mockShowAlert.mock.calls[0] as unknown as [string, string, { text: string; onPress?: () => void }[]];
  const agreeBtn = buttons.find((b) => b.text === "settings.privacy.faceBiometric.retroPromptAgree")!;
  agreeBtn.onPress?.();

  expect(mockSave).toHaveBeenCalledWith("tok", "granted", { termsVersion: "v1", channel: "retro_prompt" });
});

test("거부 버튼 onPress → saveFaceBiometricConsent(revoked, v1, retro_prompt)", async () => {
  mockGet.mockResolvedValue({ state: "none", version: null, at: null });
  mockSave.mockResolvedValue({ ok: true, state: "revoked" });
  renderHook(() => useFaceBiometricRetroPrompt("tok"));
  await Promise.resolve();
  await Promise.resolve();

  const [, , buttons] = mockShowAlert.mock.calls[0] as unknown as [string, string, { text: string; onPress?: () => void }[]];
  const declineBtn = buttons.find((b) => b.text === "settings.privacy.faceBiometric.retroPromptDecline")!;
  declineBtn.onPress?.();

  expect(mockSave).toHaveBeenCalledWith("tok", "revoked", { termsVersion: "v1", channel: "retro_prompt" });
});
