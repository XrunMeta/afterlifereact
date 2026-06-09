

import { v_c4deb2, v_e662ae } from "bapkr";
import { v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import v_e84827 from "bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv";
import { v_1ed7d9 } from "../stores/authStore";
import { v_889fad } from "../stores/dialogStore";
import { v_be317d } from "../api/reports";

const v_9f33f5 = "afterlife.reports.received.lastSeenReviewedAt";

export function v_ab98d4() {
  const v_c65f5d = v_ada615<any>();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);

  const v_844c03 = v_e662ae(false);

  v_c4deb2(() => {
    if (!v_2ca7e0 || v_844c03.current) return;
    v_844c03.current = true;

    (async () => {
      try {
        const v_8f00b9 = await v_be317d(v_2ca7e0);

        const v_d41ea7 = v_8f00b9.items
          .map((v_23805a) => v_23805a.reviewedAt)
          .filter((v_81e2ef): v_81e2ef is string => !!v_81e2ef)
          .sort();
        const v_1300ee = v_d41ea7[v_d41ea7.length - 1];
        if (!v_1300ee) return;

        const v_6de893 = await v_e84827.getItem(v_9f33f5);

        if (v_6de893 && v_1300ee <= v_6de893) return;

        await v_e84827.setItem(v_9f33f5, v_1300ee);
        v_889fad("신고를 받았습니다", "신고 내용을 확인해주세요.", [
          {
            text: "확인",
            onPress: () => {
              v_c65f5d.navigate("MyTab", {
                screen: "Reports",
                params: { tab: "received" },
              });
            },
          },
        ]);
      } catch {

      }
    })();
  }, [v_2ca7e0, v_c65f5d]);
}
