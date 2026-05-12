import v_a3453e, { v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
  v_03e392,
  v_39a996,
  v_aa7413,
  v_09d0e5,
  v_79c4f2,
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
import {
  v_55fc7c,
  v_84a859,
  v_63aa82,
  v_7e714c,
} from "../../api/auth";

function v_e8d289(v_c99bd2, t: ReturnType<typeof v_772971>["t"]): string {
  if (!v_c99bd2) return "—";
  return v_8d41d7(`countries:${v_c99bd2}`, { defaultValue: v_c99bd2 });
}

function v_5d4640(
  v_b9bbbd,
  v_a6c30b,
  t: ReturnType<typeof v_772971>["t"],
): string {
  if (!v_a6c30b) return "—";
  if (v_b9bbbd) return v_8d41d7(`regions:${v_b9bbbd}_${v_a6c30b}`, { defaultValue: v_a6c30b });
  return v_a6c30b;
}

export default function v_9232cf() {
  const v_c65f5d = v_ada615<v_390fcc<v_e57140>>();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const v_b113dd = v_1ed7d9((v_fd5f43) => v_fd5f43.apiUser);
  const v_d7d5a2 = v_1ed7d9((v_fd5f43) => v_fd5f43.logout);
  const [v_a1f68f, v_bdf535] = v_5ab095(false);

  const [v_13edcd, v_d50479] = v_5ab095(false);
  const [v_31e6dc, v_c3aa7b] = v_5ab095<"request" | "verify">("request");
  const [v_415828, v_f34d83] = v_5ab095(false);
  const [v_9c089d, v_8415eb] = v_5ab095(false);
  const [v_181b55, v_91681a] = v_5ab095("");
  const [v_dc2a3b, v_b7e472] = v_5ab095("");
  const [v_6c2073, v_88e1ba] = v_5ab095("");

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

  const v_894a7c = async () => {
    if (!v_b113dd?.email) {
      v_03e392.alert("오류", "이메일 정보가 없어요.");
      return;
    }
    v_f34d83(true);
    try {
      await v_63aa82(v_b113dd.email);
      v_c3aa7b("verify");
    } catch (v_49263d) {
      const v_badeaf = v_49263d instanceof v_84a859 ? v_49263d.message : "OTP 발송에 실패했어요.";
      v_03e392.alert("오류", v_badeaf);
    } finally {
      v_f34d83(false);
    }
  };

  const v_3bb84e = async () => {
    if (!v_b113dd?.email) return;
    if (v_181b55.trim().length < 4) {
      v_03e392.alert("오류", "인증번호를 확인해주세요.");
      return;
    }
    if (v_dc2a3b.length < 8) {
      v_03e392.alert("오류", "비밀번호는 8자 이상이어야 해요.");
      return;
    }
    if (v_dc2a3b !== v_6c2073) {
      v_03e392.alert("오류", "비밀번호 확인이 일치하지 않아요.");
      return;
    }
    v_8415eb(true);
    try {
      await v_7e714c({
        email: v_b113dd.email,
        verificationCode: v_181b55.trim(),
        newPassword: v_dc2a3b,
      });

      v_d50479(false);
      v_c3aa7b("request");
      v_91681a("");
      v_b7e472("");
      v_88e1ba("");
      v_03e392.alert("완료", "비밀번호가 변경됐어요.");
    } catch (v_49263d) {
      const v_badeaf = v_49263d instanceof v_84a859 ? v_49263d.message : "비밀번호 변경에 실패했어요.";
      v_03e392.alert("오류", v_badeaf);
    } finally {
      v_8415eb(false);
    }
  };

  const v_a3a15b = () => {
    v_d50479(false);
    v_c3aa7b("request");
    v_91681a("");
    v_b7e472("");
    v_88e1ba("");
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
        {}
        <View style={v_fd5f43.card}>
          {}
          <View style={v_fd5f43.infoRow}>
            <Text style={v_fd5f43.infoLabel}>이메일</Text>
            <Text style={v_fd5f43.infoValue} numberOfLines={1}>
              {v_b113dd?.email ?? "—"}
            </Text>
          </View>
          <View style={v_fd5f43.divider} />

          {}
          <TouchableOpacity style={v_fd5f43.infoRow} onPress={() => v_d50479(true)}>
            <Text style={v_fd5f43.infoLabel}>비밀번호</Text>
            <View style={v_fd5f43.infoRight}>
              <Text style={v_fd5f43.infoValueDim}>●●●●●●●●</Text>
              <Feather name="chevron-right" size={18} color={v_1bfbd0.zinc400} />
            </View>
          </TouchableOpacity>
          <View style={v_fd5f43.divider} />

          {}
          <View style={v_fd5f43.infoRow}>
            <Text style={v_fd5f43.infoLabel}>국가</Text>
            <Text style={v_fd5f43.infoValue}>{v_e8d289(v_b113dd?.country, v_8d41d7)}</Text>
          </View>
          <View style={v_fd5f43.divider} />

          {}
          <View style={v_fd5f43.infoRow}>
            <Text style={v_fd5f43.infoLabel}>지역</Text>
            <Text style={v_fd5f43.infoValue}>
              {v_5d4640(v_b113dd?.country, v_b113dd?.region, v_8d41d7)}
            </Text>
          </View>
        </View>

        {}
        <View style={[v_fd5f43.card, { marginTop: 16 }]}>
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

      {}
      <Modal visible={v_13edcd} transparent animationType="slide">
        <Pressable style={v_fd5f43.modalOverlay} onPress={v_a3a15b}>
          <Pressable style={v_fd5f43.modalBox} onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}>
            <View style={v_fd5f43.modalHeader}>
              <Text style={v_fd5f43.modalTitle}>비밀번호 변경</Text>
              <TouchableOpacity onPress={v_a3a15b} hitSlop={8}>
                <Feather name="x" size={22} color={v_1bfbd0.zinc500} />
              </TouchableOpacity>
            </View>

            {v_31e6dc === "request" ? (
              <>
                <Text style={v_fd5f43.modalDesc}>
                  가입하신 이메일{"\n"}
                  <Text style={v_fd5f43.modalEmail}>{v_b113dd?.email ?? "—"}</Text>{"\n"}
                  으로 인증번호를 보내드릴게요.
                </Text>
                <TouchableOpacity
                  style={[v_fd5f43.primaryBtn, v_415828 && v_fd5f43.btnDisabled]}
                  onPress={v_894a7c}
                  disabled={v_415828}
                >
                  {v_415828 ? (
                    <ActivityIndicator color={v_1bfbd0.white} />
                  ) : (
                    <Text style={v_fd5f43.primaryBtnText}>인증번호 받기</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={v_fd5f43.modalDesc}>
                  이메일로 받은 인증번호와 새 비밀번호를 입력해주세요.
                </Text>
                <Text style={v_fd5f43.fieldLabel}>인증번호</Text>
                <TextInput
                  style={v_fd5f43.input}
                  value={v_181b55}
                  onChangeText={v_91681a}
                  keyboardType="number-pad"
                  placeholder="6자리"
                  placeholderTextColor={v_1bfbd0.zinc400}
                />
                <Text style={v_fd5f43.fieldLabel}>새 비밀번호</Text>
                <TextInput
                  style={v_fd5f43.input}
                  value={v_dc2a3b}
                  onChangeText={v_b7e472}
                  secureTextEntry
                  placeholder="8자 이상"
                  placeholderTextColor={v_1bfbd0.zinc400}
                />
                <Text style={v_fd5f43.fieldLabel}>새 비밀번호 확인</Text>
                <TextInput
                  style={v_fd5f43.input}
                  value={v_6c2073}
                  onChangeText={v_88e1ba}
                  secureTextEntry
                  placeholder="다시 한 번 입력"
                  placeholderTextColor={v_1bfbd0.zinc400}
                />
                <TouchableOpacity
                  style={[v_fd5f43.primaryBtn, v_9c089d && v_fd5f43.btnDisabled]}
                  onPress={v_3bb84e}
                  disabled={v_9c089d}
                >
                  {v_9c089d ? (
                    <ActivityIndicator color={v_1bfbd0.white} />
                  ) : (
                    <Text style={v_fd5f43.primaryBtnText}>비밀번호 변경</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => v_c3aa7b("request")}
                  style={v_fd5f43.linkBtn}
                  disabled={v_9c089d}
                >
                  <Text style={v_fd5f43.linkBtnText}>인증번호 다시 받기</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 12,
  },
  infoLabel: { fontSize: 14, color: v_1bfbd0.zinc500, minWidth: 64 },
  infoValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 15,
    fontWeight: "500",
    color: v_1bfbd0.zinc900,
  },
  infoValueDim: { fontSize: 15, color: v_1bfbd0.zinc500, letterSpacing: 2 },
  infoRight: { flexDirection: "row", alignItems: "center", gap: 8 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalBox: {
    backgroundColor: v_1bfbd0.white,
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 22,
    width: "100%",
    maxWidth: 380,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: v_1bfbd0.zinc900 },
  modalDesc: {
    fontSize: 14,
    color: v_1bfbd0.zinc600,
    lineHeight: 21,
    marginBottom: 18,
  },
  modalEmail: { color: v_1bfbd0.zinc900, fontWeight: "700" },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: v_1bfbd0.zinc700,
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: v_1bfbd0.zinc900,
    marginBottom: 10,
    backgroundColor: v_1bfbd0.zinc50,
  },
  primaryBtn: {
    backgroundColor: v_1bfbd0.violet600,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  primaryBtnText: { fontSize: 15, fontWeight: "700", color: v_1bfbd0.white },
  btnDisabled: { opacity: 0.6 },
  linkBtn: { alignItems: "center", paddingVertical: 10, marginTop: 4 },
  linkBtnText: { fontSize: 13, color: v_1bfbd0.violet600, fontWeight: "500" },
});
