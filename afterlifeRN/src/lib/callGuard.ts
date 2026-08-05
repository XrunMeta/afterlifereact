

import { v_48981e } from "../api/credits";
import { v_889fad } from "../stores/dialogStore";

export async function v_84d546(
  v_2ca7e0,
  v_c32cb1,
): Promise<boolean> {
  if (!v_2ca7e0) return true;
  try {
    const v_c88e9b = await v_48981e(v_2ca7e0);

    if (Math.floor(v_c88e9b.totalSec) > 0) return true;
    v_889fad(
      "남은 통화 시간이 없습니다",
      "크레딧을 충전하면 바로 이어서 통화할 수 있습니다.",
      [
        { text: "확인", style: "cancel" },
        { text: "충전하기", style: "default", onPress: v_c32cb1 },
      ],
    );
    return false;
  } catch (v_49263d) {

    console.warn("[callGuard] balance fetch failed:", (v_49263d as Error).message);
    return true;
  }
}
