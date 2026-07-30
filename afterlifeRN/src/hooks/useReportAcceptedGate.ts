

import { v_c4deb2 } from "bapkr";
import { v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import { v_772971 } from "jmpfvteuuztnp";
import v_e84827 from "bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv";
import { v_1ed7d9 } from "../stores/authStore";
import { v_889fad } from "../stores/dialogStore";
import { v_be317d } from "../api/reports";

const v_9f33f5 = "afterlife.reports.received.lastSeenReviewedAt";

let v_b3196d = null;

function v_04bec9(v_3b402b): number {
  const v_3a5fef = Date.parse(v_3b402b);
  return Number.isFinite(v_3a5fef) ? v_3a5fef : NaN;
}

export function v_ab98d4() {
  const v_c65f5d = v_ada615<any>();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const { t: v_8d41d7 } = v_772971();

  v_c4deb2(() => {
    if (!v_2ca7e0 || v_b3196d === v_2ca7e0) return;
    v_b3196d = v_2ca7e0;

    (async () => {
      try {
        const v_8f00b9 = await v_be317d(v_2ca7e0);

        let v_9b6e55 = null;
        let v_561f74 = -Infinity;
        for (const v_23805a of v_8f00b9.items) {
          if (!v_23805a.reviewedAt) continue;
          const v_3a5fef = v_04bec9(v_23805a.reviewedAt);
          if (!Number.isFinite(v_3a5fef)) continue; 
          if (v_3a5fef > v_561f74) {
            v_561f74 = v_3a5fef;
            v_9b6e55 = v_23805a.reviewedAt;
          }
        }
        if (v_9b6e55 === null) return;

        const v_6affd5 = await v_e84827.getItem(v_9f33f5);
        const v_abc0cb = v_6affd5 ? v_04bec9(v_6affd5) : NaN;

        if (Number.isFinite(v_abc0cb) && v_561f74 <= v_abc0cb) return;

        try {
          await v_e84827.setItem(v_9f33f5, v_9b6e55);
        } catch (v_9e86fd) {

          console.warn("[useReportAcceptedGate] failed to persist lastSeenReviewedAt", v_9e86fd);
        }

        v_889fad(
          v_8d41d7("reports.acceptedAlertTitle", { defaultValue: "신고를 받았습니다" }),
          v_8d41d7("reports.acceptedAlertDesc", { defaultValue: "신고 내용을 확인해주세요." }),
          [
            {
              text: v_8d41d7("common.ok", { defaultValue: "확인" }),
              onPress: () => {
                v_c65f5d.navigate("MyTab", {
                  screen: "Reports",
                  params: { tab: "received" },
                });
              },
            },
          ],
        );
      } catch {

        if (v_b3196d === v_2ca7e0) {
          v_b3196d = null;
        }
      }
    })();
  }, [v_2ca7e0, v_c65f5d, v_8d41d7]);
}

export function v_475667(): void {
  v_b3196d = null;
}
