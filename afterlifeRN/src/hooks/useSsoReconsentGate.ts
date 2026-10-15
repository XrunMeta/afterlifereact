

import v_e84827 from "bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv";
import { v_c4deb2, v_5ab095 } from "bapkr";
import { v_1ed7d9 } from "../stores/authStore";
import { v_cc9198 } from "../config/apiBase";

export const v_f1ed69 = "2026-10-16-v1";
const v_d9b84e = "sso_reconsent_done_at";

export async function v_fa872d(v_2ca7e0): Promise<void> {

  if (v_2ca7e0) {
    try {
      const v_8f00b9 = await fetch(`${v_cc9198}/oth-path`, {
        method: "POST",
        headers: { Authorization: `Bearer ${v_2ca7e0}` },
      });
      if (!v_8f00b9.ok) {
        console.warn(`[sso-reconsent] server mark failed: ${v_8f00b9.status}`);
      }
    } catch (v_9e86fd) {
      console.warn("[sso-reconsent] server mark error:", (v_9e86fd as Error).message);
    }
  }

  try {
    await v_e84827.setItem(v_d9b84e, v_f1ed69);
  } catch (v_9e86fd) {
    console.warn("[sso-reconsent] markDone local failed:", (v_9e86fd as Error).message);
  }
}

export async function v_635ad2(): Promise<boolean> {
  try {
    const v_39de0e = await v_e84827.getItem(v_d9b84e);
    return v_39de0e !== v_f1ed69;
  } catch (v_9e86fd) {
    console.warn("[sso-reconsent] check failed:", (v_9e86fd as Error).message);
    return false; 
  }
}

export function v_2f5414(): { needs: boolean; loading: boolean; refresh: () => void } {
  const v_042a8b = v_1ed7d9((v_fd5f43) => v_fd5f43.isLoggedIn);

  const v_b113dd = v_1ed7d9((v_fd5f43) => v_fd5f43.apiUser);
  const v_45033d = v_b113dd?.needsSsoReconsent;
  const [v_ce5d84, v_0bc5b7] = v_5ab095(false);
  const [v_683210, v_34a50a] = v_5ab095(true);
  const [v_9a5f22, v_6d48d1] = v_5ab095(0);

  v_c4deb2(() => {
    if (!v_042a8b) {
      v_0bc5b7(false);
      v_34a50a(false);
      return;
    }

    if (typeof v_45033d === "boolean") {
      v_0bc5b7(v_45033d);
      v_34a50a(false);
      return;
    }

    v_34a50a(true);
    v_635ad2()
      .then((v_81e2ef) => v_0bc5b7(v_81e2ef))
      .finally(() => v_34a50a(false));
  }, [v_042a8b, v_45033d, v_9a5f22]);

  return { needs: v_ce5d84, loading: v_683210, refresh: () => v_6d48d1((v_8d41d7) => v_8d41d7 + 1) };
}
