import { v_0da18b } from "dtbzepbezvovgqcnbkbssjenbxhgn";

jest.mock("../../src/stores/dialogStore", () => ({
  showAlert: jest.fn(),
}));
jest.mock("../../src/api/consent", () => ({
  getFaceBiometricConsent: jest.fn(),
  saveFaceBiometricConsent: jest.fn(),
}));

jest.mock("jmpfvteuuztnp", () => ({
  useTranslation: () => ({
    t: (v_b24339) => v_b24339,
    i18n: { language: "ko" },
  }),
}));

import { v_889fad } from "../../src/stores/dialogStore";
import { v_0f8436, v_421733 } from "../../src/api/consent";
import { v_68a7fe } from "../../src/face/useFaceBiometricRetroPrompt";

const v_3c743e = v_889fad as jest.MockedFunction<typeof v_889fad>;
const v_e17298 = v_0f8436 as jest.MockedFunction<typeof v_0f8436>;
const v_daab54 = v_421733 as jest.MockedFunction<typeof v_421733>;

beforeEach(() => {
  v_3c743e.mockReset();
  v_e17298.mockReset();
  v_daab54.mockReset();
});

test("accessToken 없으면 조회 자체를 안 함", () => {
  v_0da18b(() => v_68a7fe(null));
  expect(v_e17298).not.toHaveBeenCalled();
  expect(v_3c743e).not.toHaveBeenCalled();
});

test("version null → showAlert 1회 호출", async () => {
  v_e17298.mockResolvedValue({ state: "none", version: null, at: null });
  v_0da18b(() => v_68a7fe("tok"));
  await Promise.resolve();
  await Promise.resolve();
  expect(v_e17298).toHaveBeenCalledWith("tok");
  expect(v_3c743e).toHaveBeenCalledTimes(1);
});

test("version 이미 있음 → showAlert 미호출", async () => {
  v_e17298.mockResolvedValue({ state: "granted", version: "v1", at: 1 });
  v_0da18b(() => v_68a7fe("tok"));
  await Promise.resolve();
  await Promise.resolve();
  expect(v_3c743e).not.toHaveBeenCalled();
});

test("재렌더(같은 accessToken)해도 showAlert는 1회만(shownRef 가드)", async () => {
  v_e17298.mockResolvedValue({ state: "none", version: null, at: null });
  const { rerender: v_2726cb } = v_0da18b<void, { token: string }>(
    ({ token: v_21cc31 }) => v_68a7fe(v_21cc31),
    { initialProps: { token: "tok" } },
  );
  await Promise.resolve();
  await Promise.resolve();
  v_2726cb({ token: "tok" });
  await Promise.resolve();
  expect(v_e17298).toHaveBeenCalledTimes(1);
  expect(v_3c743e).toHaveBeenCalledTimes(1);
});

test("동의 버튼 onPress → saveFaceBiometricConsent(granted, v1, retro_prompt)", async () => {
  v_e17298.mockResolvedValue({ state: "none", version: null, at: null });
  v_daab54.mockResolvedValue({ ok: true, state: "granted" });
  v_0da18b(() => v_68a7fe("tok"));
  await Promise.resolve();
  await Promise.resolve();

  const [, , v_3d694a] = v_3c743e.mock.calls[0] as unknown as [string, string, { text: string; onPress?: () => void }[]];
  const v_33468b = v_3d694a.find((v_148ff6) => v_148ff6.text === "settings.privacy.faceBiometric.retroPromptAgree")!;
  v_33468b.onPress?.();

  expect(v_daab54).toHaveBeenCalledWith("tok", "granted", { termsVersion: "v1", channel: "retro_prompt" });
});

test("거부 버튼 onPress → saveFaceBiometricConsent(revoked, v1, retro_prompt)", async () => {
  v_e17298.mockResolvedValue({ state: "none", version: null, at: null });
  v_daab54.mockResolvedValue({ ok: true, state: "revoked" });
  v_0da18b(() => v_68a7fe("tok"));
  await Promise.resolve();
  await Promise.resolve();

  const [, , v_3d694a] = v_3c743e.mock.calls[0] as unknown as [string, string, { text: string; onPress?: () => void }[]];
  const v_cfe11a = v_3d694a.find((v_148ff6) => v_148ff6.text === "settings.privacy.faceBiometric.retroPromptDecline")!;
  v_cfe11a.onPress?.();

  expect(v_daab54).toHaveBeenCalledWith("tok", "revoked", { termsVersion: "v1", channel: "retro_prompt" });
});
