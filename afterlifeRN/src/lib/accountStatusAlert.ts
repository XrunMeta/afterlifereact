

import type { v_75de9d } from "zqqvxke";
import { v_84a859, v_887ecd, type v_a1d7e7 } from "../api/auth";
import { v_889fad } from "../stores/dialogStore";

export function v_fec9c0(
  v_49263d,
  t: v_75de9d,
  opts: {
    deviceId?: string;

    onReactivated: (session: v_a1d7e7) => Promise<void>;
  },
): boolean {
  if (!(v_49263d instanceof v_84a859)) return false;

  if (v_49263d.code === "ACCOUNT_DEACTIVATED") {
    const v_21cc31 = (v_49263d.details as { reactivateToken?: string } | undefined)?.reactivateToken;
    v_889fad(
      v_8d41d7("auth.deactivated.title", { defaultValue: "비활성화 중인 계정이에요." }),
      v_8d41d7("auth.deactivated.message", {
        defaultValue: "다시 로그인하여 원래대로 계정과 AI 클론을 사용할까요?",
      }),
      [
        { text: v_8d41d7("common.cancel", { defaultValue: "취소" }), style: "cancel" },
        {
          text: v_8d41d7("auth.deactivated.activate", { defaultValue: "활성화" }),
          onPress: async () => {
            if (!v_21cc31) return;
            try {
              const v_a3ff5a = await v_887ecd(v_21cc31, v_328259.deviceId);
              await v_328259.onReactivated(v_a3ff5a);
            } catch (v_9e86fd) {
              v_889fad(
                v_8d41d7("common.error", { defaultValue: "오류" }),
                v_9e86fd instanceof v_84a859
                  ? v_9e86fd.message
                  : v_8d41d7("auth.deactivated.failed", { defaultValue: "활성화하지 못했어요. 다시 로그인해 주세요." }),
              );
            }
          },
        },
      ],
    );
    return true;
  }

  if (v_49263d.code === "ACCOUNT_SUSPENDED") {
    v_889fad(
      v_8d41d7("auth.login.accountSuspendedTitle", { defaultValue: "계정이 일시정지되었습니다." }),
      v_8d41d7("auth.login.accountSuspendedMessage", {
        defaultValue: "서비스 운영 정책 위반으로 계정 이용이 정지되었습니다.\n문의: oth-staff@example.invalid",
      }),
      [{ text: v_8d41d7("common.confirm", { defaultValue: "확인" }) }],
    );
    return true;
  }

  return false;
}
