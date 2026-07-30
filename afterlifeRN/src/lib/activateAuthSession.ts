

import { showAlert } from "../stores/dialogStore";
import { getMe, AuthApiError } from "../api/auth";
import { useAuthStore } from "../stores/authStore";
import i18n from "../i18n";

interface ActivateOpts {
  accessToken: string;
  refreshToken?: string | null;
  persist?: boolean;

  errorTitle?: string;
}

export async function activateAuthSession(opts: ActivateOpts): Promise<boolean> {
  const persist = opts.persist ?? true;
  try {
    const meRes = await getMe(opts.accessToken);
    await useAuthStore.getState().setApiAuth(opts.accessToken, meRes.user, {
      persist,
      refreshToken: opts.refreshToken ?? null,
    });
    await useAuthStore.getState().hydrate();
    return true;
  } catch (err) {
    console.warn("[activateAuthSession] failed:", err);
    const msg = err instanceof AuthApiError ? err.message : String(err);
    showAlert(opts.errorTitle ?? i18n.t("common.error", { defaultValue: "오류" }), msg);
    return false;
  }
}
