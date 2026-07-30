

import { v_889fad } from "../stores/dialogStore";
import { v_7ef860, v_84a859 } from "../api/auth";
import { v_1ed7d9 } from "../stores/authStore";

interface ActivateOpts {
  accessToken: string;
  refreshToken?: string | null;
  persist?: boolean;

  errorTitle?: string;
}

export async function v_c65c18(v_328259): Promise<boolean> {
  const v_3c038e = v_328259.persist ?? true;
  try {
    const v_9ec4c0 = await v_7ef860(v_328259.accessToken);
    await v_1ed7d9.getState().setApiAuth(v_328259.accessToken, v_9ec4c0.user, { persist: v_3c038e });
    if (v_328259.refreshToken) {
      await v_1ed7d9.getState().setApiTokens(v_328259.accessToken, v_328259.refreshToken, { persist: v_3c038e });
    }
    await v_1ed7d9.getState().hydrate();
    return true;
  } catch (v_49263d) {
    console.warn("[activateAuthSession] failed:", v_49263d);
    const v_badeaf = v_49263d instanceof v_84a859 ? v_49263d.message : String(v_49263d);
    v_889fad(v_328259.errorTitle ?? "오류", v_badeaf);
    return false;
  }
}
