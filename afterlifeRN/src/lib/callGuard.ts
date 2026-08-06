

import { getCreditBalance } from "../api/credits";
import { showAlert } from "../stores/dialogStore";

export async function assertCanCall(
  accessToken: string | null,
  onCharge: () => void,
): Promise<boolean> {
  if (!accessToken) return true;
  try {
    const balance = await getCreditBalance(accessToken);

    if (Math.floor(balance.totalSec) > 0) return true;
    showAlert(
      "남은 통화 시간이 없습니다",
      "크레딧을 충전하면 바로 이어서 통화할 수 있습니다.",
      [
        { text: "확인", style: "cancel" },
        { text: "충전하기", style: "default", onPress: onCharge },
      ],
    );
    return false;
  } catch (err) {

    console.warn("[callGuard] balance fetch failed:", (err as Error).message);
    return true;
  }
}
