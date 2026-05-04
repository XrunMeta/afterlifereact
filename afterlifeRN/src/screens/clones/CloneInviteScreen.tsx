

import v_a3453e, { v_de06a3, v_c4deb2, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
  v_79c4f2,
  v_03e392,
  v_39a996,
  v_6c4f62,
  v_122070,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_ada615, v_2d8264 } from "ixigazcpvfldbecwtbvavtbi";
import type { v_ee3714 } from "ixigazcpvfldbecwtbvavtbi";
import type { v_2d88fc } from "../../navigation/types";
import v_556baf from "../../components/ui/SafeView";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0, v_8b0c90, v_9b1a04 } from "../../components/constants";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_194498 } from "../../stores/cloneStore";
import {
  v_735203,
  v_e4a407,
  v_81dd51,
  v_7f4050,
  v_7e484f,
  type v_fb1763,
  type v_f9a81e,
} from "../../api/clones";
import { v_84a859 } from "../../api/auth";

type Route = v_ee3714<v_2d88fc, "CloneInvite">;

const v_57ffc4 = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function v_07335f() {
  const v_c65f5d = v_ada615();
  const { params: v_24baff } = v_2d8264<Route>();
  const v_6e0fd3 = v_24baff.cloneId;
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const v_493eec = v_1ed7d9((v_fd5f43) => v_fd5f43.apiUser?.id ?? v_fd5f43.user?.id ?? null);
  const v_eb25ce = v_194498((v_fd5f43) => v_fd5f43.getCloneById(v_6e0fd3));

  const v_2aec08 =
    v_eb25ce?.ownerId != null && v_493eec != null && v_eb25ce.ownerId === v_493eec;

  const [v_483de2, v_266e0d] = v_5ab095<v_fb1763[]>([]);
  const [v_8673d6, v_ce60a3] = v_5ab095<v_f9a81e[]>([]);
  const [v_683210, v_34a50a] = v_5ab095(true);
  const [v_612e9f, v_575aad] = v_5ab095(false);
  const [v_c75cd4, v_3b75f3] = v_5ab095("");
  const [v_cb66b4, v_ee9ec1] = v_5ab095(false);

  const v_92fdf2 = v_de06a3(async () => {
    if (!v_2ca7e0) return;
    v_34a50a((v_1614db) => (v_8673d6.length === 0 ? true : v_1614db));
    try {

      const v_19ed0e = await v_7e484f(v_2ca7e0, v_6e0fd3);
      v_ce60a3(v_19ed0e.items);
      if (v_2aec08) {
        try {
          const v_f0104f = await v_7f4050(v_2ca7e0, v_6e0fd3);
          v_266e0d(v_f0104f.items);
        } catch {
          v_266e0d([]);
        }
      } else {
        v_266e0d([]);
      }
    } catch (v_49263d) {
      console.warn("[CloneInvite] reload failed:", v_49263d);
    } finally {
      v_34a50a(false);
      v_575aad(false);
    }
  }, [v_2ca7e0, v_6e0fd3, v_2aec08, v_8673d6.length]);

  v_c4deb2(() => {
    v_92fdf2();

  }, [v_2ca7e0, v_6e0fd3]);

  const v_371aa6 = async () => {
    const v_e0c7e8 = v_c75cd4.trim();
    if (!v_57ffc4.test(v_e0c7e8)) {
      v_03e392.alert("알림", "올바른 이메일을 입력해주세요.");
      return;
    }
    if (!v_2ca7e0) return;
    v_ee9ec1(true);
    try {
      const v_8f00b9 = await v_e4a407(v_2ca7e0, v_6e0fd3, { invite_email: v_e0c7e8 });
      console.log("[CloneInvite] sent:", v_8f00b9);
      v_3b75f3("");
      await v_92fdf2();
      const v_c226a5 = v_8f00b9.notify;
      v_03e392.alert(
        "초대 발송",
        v_c226a5
          ? `${v_e0c7e8}로 초대를 보냈어요.\n이메일: ${v_c226a5.emailSent ? "✓" : "실패"} / 푸시: ${v_c226a5.pushSent}건`
          : `${v_e0c7e8}로 초대를 보냈어요.`,
      );
    } catch (v_49263d) {
      let v_badeaf = "초대 발송에 실패했습니다.";
      if (v_49263d instanceof v_84a859) {
        if (v_49263d.code === "QUOTA_EXCEEDED") v_badeaf = "초대 가능 한도를 초과했어요.";
        else v_badeaf = v_49263d.message;
      }
      v_03e392.alert("오류", v_badeaf);
    } finally {
      v_ee9ec1(false);
    }
  };

  const v_5ca23e = async (inv: v_fb1763) => {
    if (!v_2ca7e0) return;
    v_03e392.alert("초대 취소", `"${v_f0104f.inviteEmail ?? "초대"}"을(를) 취소하시겠어요?`, [
      { text: "닫기", style: "cancel" },
      {
        text: "취소",
        style: "destructive",
        onPress: async () => {
          try {
            await v_735203(v_2ca7e0, v_6e0fd3, v_f0104f.id);
            await v_92fdf2();
          } catch (v_49263d) {
            const v_badeaf = v_49263d instanceof v_84a859 ? v_49263d.message : "취소 실패";
            v_03e392.alert("오류", v_badeaf);
          }
        },
      },
    ]);
  };

  const v_eb4082 = async (m: v_f9a81e) => {
    if (!v_2ca7e0) return;
    const v_a3c903 = v_35f85c.targetUserId === v_493eec;
    const v_9b064f = v_a3c903 ? "나가기" : "강퇴";
    const v_5f5d6d = v_a3c903
      ? "공동관리자에서 나가시겠어요?"
      : `${v_35f85c.targetUser?.name ?? v_35f85c.inviteEmail ?? "이 멤버"}을(를) 강퇴하시겠어요?`;
    v_03e392.alert(v_9b064f, v_5f5d6d, [
      { text: "닫기", style: "cancel" },
      {
        text: v_9b064f,
        style: "destructive",
        onPress: async () => {
          try {
            const v_8f00b9 = await v_81dd51(v_2ca7e0, v_6e0fd3, v_35f85c.id);
            console.log("[CloneInvite] delete share:", v_8f00b9);
            if (v_8f00b9.action === "leave") {
              v_c65f5d.goBack();
            } else {
              await v_92fdf2();
            }
          } catch (v_49263d) {
            const v_badeaf = v_49263d instanceof v_84a859 ? v_49263d.message : `${v_9b064f} 실패`;
            v_03e392.alert("오류", v_badeaf);
          }
        },
      },
    ]);
  };

  return (
    <SafeView backgroundColor={v_1bfbd0.zinc50}>
      <PageHeader
        title="공동관리자"
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />
      <ScrollView
        contentContainerStyle={v_fd5f43.content}
        refreshControl={
          <RefreshControl
            refreshing={v_612e9f}
            onRefresh={() => {
              v_575aad(true);
              v_92fdf2();
            }}
          />
        }
      >
        {v_683210 ? (
          <ActivityIndicator color={v_1bfbd0.zinc500} style={{ marginTop: 32 }} />
        ) : (
          <>
            {}
            {v_2aec08 && (
              <View style={v_fd5f43.card}>
                <Text style={v_fd5f43.sectionTitle}>공동관리자 초대</Text>
                <Text style={v_fd5f43.sectionDesc}>
                  이메일로 초대할게요. 3일 내 미수락 시 자동 만료돼요.
                </Text>
                <View style={v_fd5f43.inviteRow}>
                  <TextInput
                    style={v_fd5f43.emailInput}
                    placeholder="example@email.com"
                    placeholderTextColor={v_1bfbd0.zinc400}
                    value={v_c75cd4}
                    onChangeText={v_3b75f3}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                  <TouchableOpacity
                    style={[v_fd5f43.sendBtn, (!v_c75cd4 || v_cb66b4) && v_fd5f43.sendBtnDisabled]}
                    onPress={v_371aa6}
                    disabled={!v_c75cd4 || v_cb66b4}
                  >
                    {v_cb66b4 ? (
                      <ActivityIndicator color={v_1bfbd0.white} />
                    ) : (
                      <Text style={v_fd5f43.sendBtnText}>초대</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {}
            {v_2aec08 && v_483de2.length > 0 && (
              <View style={v_fd5f43.card}>
                <Text style={v_fd5f43.sectionTitle}>대기 중 ({v_483de2.length})</Text>
                {v_483de2.map((v_f0104f) => (
                  <View key={v_f0104f.id} style={v_fd5f43.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={v_fd5f43.rowEmail}>{v_f0104f.inviteEmail ?? "(이메일 없음)"}</Text>
                      <Text style={v_fd5f43.rowSub}>
                        {v_9e04ad(v_f0104f.expiresAt)}
                      </Text>
                    </View>
                    <TouchableOpacity style={v_fd5f43.cancelBtn} onPress={() => v_5ca23e(v_f0104f)}>
                      <Text style={v_fd5f43.cancelBtnText}>취소</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {}
            <View style={v_fd5f43.card}>
              <Text style={v_fd5f43.sectionTitle}>
                멤버 ({v_8673d6.length})
              </Text>
              {v_8673d6.length === 0 ? (
                <Text style={v_fd5f43.empty}>아직 공동관리자가 없어요.</Text>
              ) : (
                v_8673d6.map((v_35f85c) => {
                  const v_a3c903 = v_35f85c.targetUserId === v_493eec;
                  const v_c48a58 = v_35f85c.role === "owner";
                  return (
                    <View key={v_35f85c.id} style={v_fd5f43.row}>
                      <View style={{ flex: 1 }}>
                        <Text style={v_fd5f43.rowEmail}>
                          {v_35f85c.targetUser?.name ?? v_35f85c.targetUser?.email ?? v_35f85c.inviteEmail ?? "—"}
                          {v_a3c903 && <Text style={v_fd5f43.selfBadge}> (나)</Text>}
                          {v_c48a58 && <Text style={v_fd5f43.ownerBadge}> 반장</Text>}
                        </Text>
                        <Text style={v_fd5f43.rowSub}>
                          {v_35f85c.targetUser?.email ?? v_35f85c.inviteEmail ?? ""}
                        </Text>
                      </View>
                      {}
                      {!(v_a3c903 && v_c48a58) && (v_2aec08 || v_a3c903) && (
                        <TouchableOpacity
                          style={v_a3c903 ? v_fd5f43.leaveBtn : v_fd5f43.kickBtn}
                          onPress={() => v_eb4082(v_35f85c)}
                        >
                          <Text style={v_a3c903 ? v_fd5f43.leaveBtnText : v_fd5f43.kickBtnText}>
                            {v_a3c903 ? "나가기" : "강퇴"}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeView>
  );
}

function v_9e04ad(v_0b8131): string {
  try {
    const v_f900a6 = new Date(v_0b8131.replace(" ", "T") + "Z").getTime();
    const v_d799e2 = v_f900a6 - Date.now();
    if (v_d799e2 <= 0) return "만료됨";
    const v_6a53fd = Math.floor(v_d799e2 / (24 * 60 * 60 * 1000));
    const v_12ebc1 = Math.floor((v_d799e2 % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    if (v_6a53fd > 0) return `${v_6a53fd}일 ${v_12ebc1}시간 후 만료`;
    return `${v_12ebc1}시간 후 만료`;
  } catch {
    return "만료 정보 없음";
  }
}

const v_fd5f43 = v_472849.create({
  content: { padding: v_9b1a04.large, gap: v_9b1a04.medium },
  card: {
    backgroundColor: v_1bfbd0.white,
    borderRadius: v_8b0c90.lg,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    padding: v_9b1a04.large,
    gap: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: v_1bfbd0.zinc900 },
  sectionDesc: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: -4 },
  inviteRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  emailInput: {
    flex: 1,
    fontSize: 14,
    color: v_1bfbd0.zinc900,
    backgroundColor: v_1bfbd0.zinc50,
    borderRadius: v_8b0c90.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sendBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: v_8b0c90.md,
    backgroundColor: v_1bfbd0.zinc900,
    alignItems: "center",
  },
  sendBtnDisabled: { backgroundColor: v_1bfbd0.zinc300 },
  sendBtnText: { fontSize: 13, fontWeight: "700", color: v_1bfbd0.white },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 12,
  },
  rowEmail: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc900 },
  rowSub: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },
  selfBadge: { fontSize: 12, color: v_1bfbd0.violet500, fontWeight: "500" },
  ownerBadge: {
    fontSize: 11,
    color: v_1bfbd0.success,
    backgroundColor: "#dcfce7",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: "hidden",
  },

  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: v_8b0c90.md,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc300,
  },
  cancelBtnText: { fontSize: 12, color: v_1bfbd0.zinc700, fontWeight: "600" },
  kickBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: v_8b0c90.md,
    backgroundColor: v_1bfbd0.error,
  },
  kickBtnText: { fontSize: 12, color: v_1bfbd0.white, fontWeight: "700" },
  leaveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: v_8b0c90.md,
    borderWidth: 1,
    borderColor: v_1bfbd0.error,
  },
  leaveBtnText: { fontSize: 12, color: v_1bfbd0.error, fontWeight: "600" },

  empty: { fontSize: 13, color: v_1bfbd0.zinc500, textAlign: "center", paddingVertical: 12 },
});
