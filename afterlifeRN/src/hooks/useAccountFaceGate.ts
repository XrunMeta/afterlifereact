

import { v_c4deb2, v_5ab095 } from "bapkr";
import { v_1ed7d9 } from "../stores/authStore";
import { v_31ecf2 } from "../api/faceAccount";
import { v_f8fbcf } from "../face/safeFaceDetector";

export function v_c9b96f(): { needs: boolean; loading: boolean; refresh: () => void } {
  const v_042a8b = v_1ed7d9((v_fd5f43) => v_fd5f43.isLoggedIn);
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const [v_ce5d84, v_0bc5b7] = v_5ab095(false);
  const [v_683210, v_34a50a] = v_5ab095(true);
  const [v_9a5f22, v_6d48d1] = v_5ab095(0);

  v_c4deb2(() => {

    if (!v_042a8b || !v_2ca7e0 || !v_f8fbcf()) {
      v_0bc5b7(false);
      v_34a50a(false);
      return;
    }
    let v_759436 = true;
    v_34a50a(true);
    v_31ecf2(v_2ca7e0)
      .then((v_fd5f43) => {
        if (v_759436) v_0bc5b7(v_fd5f43.enabled === true && (v_fd5f43.faceStatus ?? "none") === "none");
      })
      .catch((v_9e86fd) => {
        console.warn("[account-face] status failed (gate skip):", (v_9e86fd as Error).message);
        if (v_759436) v_0bc5b7(false);
      })
      .finally(() => {
        if (v_759436) v_34a50a(false);
      });
    return () => {
      v_759436 = false;
    };

  }, [v_042a8b, v_9a5f22]);

  return { needs: v_ce5d84, loading: v_683210, refresh: () => v_6d48d1((v_8d41d7) => v_8d41d7 + 1) };
}
