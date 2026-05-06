import v_a3453e, { v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
  v_03e392,
  v_39a996,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import { v_772971 } from "jmpfvteuuztnp";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0, v_8b0c90 } from "../../components/constants";
import type { v_e57140 } from "../../navigation/types";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_55fc7c, v_84a859 } from "../../api/auth";

export default function v_9232cf() {
  const v_c65f5d = v_ada615<v_390fcc<v_e57140>>();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const v_d7d5a2 = v_1ed7d9((v_fd5f43) => v_fd5f43.logout);
  const [v_a1f68f, v_bdf535] = v_5ab095(false);

  const v_5bc46a = () => {
    v_03e392.alert(
      "회원 탈퇴",
      "정말 탈퇴하시겠어요?\n계정과 페르소나가 영구적으로 사라집니다.\n(90일 내 복구 가능)",
      [
        { text: "취소", style: "cancel" },
        {
          text: "탈퇴",
          style: "destructive",
          onPress: async () => {
            if (!v_2ca7e0) return;
            v_bdf535(true);
            try {
              await v_55fc7c(v_2ca7e0, { withXrun: false });
              await v_d7d5a2();
            } catch (v_49263d) {
              const v_badeaf = v_49263d instanceof v_84a859 ? v_49263d.message : "탈퇴에 실패했어요.";
              v_03e392.alert("오류", v_badeaf);
              v_bdf535(false);
            }
          },
        },
      ],
    );
  };
  const { t: v_8d41d7 } = v_772971();

  const v_4622b9 = [

    { key: "blockList", labelKey: "settings.privacy.blockList", icon: "slash" as const },
    { key: "dataDownload", labelKey: "settings.privacy.dataDownload", icon: "download" as const },
    { key: "deleteAccount", labelKey: "settings.privacy.deleteAccount", icon: "trash-2" as const, danger: true },
  ];

  return (
    <SafeScrollView backgroundColor={v_1bfbd0.white} showBottomBackground={false}>
      <PageHeader
        title={v_8d41d7("settings.privacy.title")}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />

      <View style={v_fd5f43.content}>
        <View style={v_fd5f43.card}>
          {v_4622b9.map((v_8c0b26, v_ebec57) => (
            <View key={v_8c0b26.key}>
              <TouchableOpacity
                style={v_fd5f43.row}
                disabled={v_a1f68f && v_8c0b26.key === "deleteAccount"}
                onPress={() => {
                  if (v_8c0b26.key === "blockList") v_c65f5d.navigate("BlockedList");
                  else if (v_8c0b26.key === "deleteAccount") v_5bc46a();
                }}
              >
                <Feather
                  name={v_8c0b26.icon}
                  size={20}
                  color={v_8c0b26.danger ? v_1bfbd0.error : v_1bfbd0.zinc700}
                  style={v_fd5f43.rowIcon}
                />
                <Text style={[v_fd5f43.rowLabel, v_8c0b26.danger && v_fd5f43.rowLabelDanger]}>
                  {v_8d41d7(v_8c0b26.labelKey)}
                </Text>
                {v_a1f68f && v_8c0b26.key === "deleteAccount" ? (
                  <ActivityIndicator color={v_1bfbd0.error} />
                ) : (
                  <Feather name="chevron-right" size={18} color={v_1bfbd0.zinc400} />
                )}
              </TouchableOpacity>
              {v_ebec57 < v_4622b9.length - 1 && <View style={v_fd5f43.divider} />}
            </View>
          ))}
        </View>
      </View>
    </SafeScrollView>
  );
}

const v_fd5f43 = v_472849.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    maxWidth: 780,
    alignSelf: "center",
    width: "100%",
  },
  card: {
    backgroundColor: v_1bfbd0.white,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    borderRadius: v_8b0c90.lg,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 12,
  },
  rowIcon: { width: 24, textAlign: "center" },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: "500", color: v_1bfbd0.zinc900 },
  rowLabelDanger: { color: v_1bfbd0.error },
  divider: { height: 1, backgroundColor: v_1bfbd0.zinc100, marginLeft: 20 },
});
