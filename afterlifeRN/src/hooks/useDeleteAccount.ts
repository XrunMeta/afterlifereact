
import { v_5ab095 } from "bapkr";
import { v_772971 } from "jmpfvteuuztnp";
import { v_889fad } from "../stores/dialogStore";
import { v_1ed7d9 } from "../stores/authStore";
import { v_55fc7c, v_84a859 } from "../api/auth";

export function v_1256e7(): { deleting: boolean; confirmDelete: () => void } {
  const { t: v_8d41d7 } = v_772971();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const v_b113dd = v_1ed7d9((v_fd5f43) => v_fd5f43.apiUser);
  const v_d7d5a2 = v_1ed7d9((v_fd5f43) => v_fd5f43.logout);
  const [v_a1f68f, v_bdf535] = v_5ab095(false);

  const v_6ff8af = () => {

    const v_8a1355 =
      v_b113dd?.name ||
      v_b113dd?.email?.split("@")[0] ||
      v_8d41d7("my.delete.userFallback", { defaultValue: "회원" });
    v_889fad(
      v_8d41d7("my.delete.title", { defaultValue: "회원탈퇴" }),
      v_8d41d7("my.delete.desc", {
        name: v_8a1355,
        defaultValue: "정말 탈퇴하시겠어요?\n탈퇴 시 모든 데이터(포인트, 이용 내역, 저장한 콘텐츠)가 삭제되며 복구할 수 없습니다.",
      }),
      [
        { text: v_8d41d7("my.delete.stay", { defaultValue: "취소" }), style: "cancel" },
        {
          text: v_8d41d7("my.delete.leave", { defaultValue: "탈퇴하기" }),
          style: "destructive",
          onPress: async () => {
            if (!v_2ca7e0) return;
            v_bdf535(true);
            try {
              await v_55fc7c(v_2ca7e0);
              await v_d7d5a2();
            } catch (v_49263d) {
              const v_badeaf =
                v_49263d instanceof v_84a859
                  ? v_49263d.message
                  : v_8d41d7("my.delete.failed", { defaultValue: "탈퇴에 실패했어요." });
              v_889fad(v_8d41d7("common.error", { defaultValue: "오류" }), v_badeaf);
              v_bdf535(false);
            }
          },
        },
      ],
    );
  };

  return { deleting: v_a1f68f, confirmDelete: v_6ff8af };
}
