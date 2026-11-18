

import { v_c4deb2, v_5ab095 } from "bapkr";
import { v_1ed7d9 } from "../stores/authStore";

export function v_90396a(): { needs: boolean; loading: boolean; refresh: () => void } {
  const v_042a8b = v_1ed7d9((v_fd5f43) => v_fd5f43.isLoggedIn);
  const v_b113dd = v_1ed7d9((v_fd5f43) => v_fd5f43.apiUser);

  const v_45033d = v_b113dd?.needsBirthDate;
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
  }, [v_042a8b, v_45033d, v_9a5f22]);

  return { needs: v_ce5d84, loading: v_683210, refresh: () => v_6d48d1((v_8d41d7) => v_8d41d7 + 1) };
}
