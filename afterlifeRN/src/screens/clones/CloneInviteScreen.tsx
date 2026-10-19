

import { v_889fad } from "../../stores/dialogStore";
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
import { v_772971 } from "jmpfvteuuztnp";
import type { v_ee3714 } from "ixigazcpvfldbecwtbvavtbi";
import type { v_2d88fc } from "../../navigation/types";
import v_556baf from "../../components/ui/SafeView";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0, v_8b0c90, v_9b1a04, v_8f28b1 } from "../../components/constants";
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
import { v_84a859, v_a41961 } from "../../api/auth";

type Route = v_ee3714<v_2d88fc, "CloneInvite">;

const v_57ffc4 = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function v_07335f() {
  const v_c65f5d = v_ada615();
  const { t: v_8d41d7 } = v_772971();
  const { params: v_24baff } = v_2d8264<Route>();
  const v_6e0fd3 = v_24baff.cloneId;
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const v_493eec = v_1ed7d9((v_fd5f43) => v_fd5f43.apiUser?.id ?? v_fd5f43.user?.id ?? null);

  const v_78547c = v_1ed7d9((v_fd5f43) => v_fd5f43.apiUser?.email ?? null);
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

      v_ce60a3(v_19ed0e.items ?? (v_19ed0e as unknown as { shares?: v_f9a81e[] }).shares ?? []);
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
      v_889fad(v_8d41d7("common.notice"), v_8d41d7("invite.invalidEmail"));
      return;
    }
    if (v_78547c && v_e0c7e8.toLowerCase() === v_78547c.toLowerCase()) {
      v_889fad(v_8d41d7("common.notice"), v_8d41d7("invite.selfNotAllowed"));
      return;
    }
    if (!v_2ca7e0) return;
    v_ee9ec1(true);
    try {
      const v_9875a1 = await v_a41961(v_2ca7e0, v_e0c7e8);
      const v_5f5d6d = v_e0c7e8.toLowerCase();
      const v_17ec8d = v_9875a1.items.find((v_ceb55a) => v_ceb55a.email.toLowerCase() === v_5f5d6d);
      if (!v_17ec8d) {
        v_889fad(v_8d41d7("common.notice"), v_8d41d7("invite.memberNotFound"));
        v_ee9ec1(false);
        return;
      }

      const v_8f00b9 = await v_e4a407(v_2ca7e0, v_6e0fd3, { invite_email: v_e0c7e8 });
      console.log("[CloneInvite] sent:", v_8f00b9);
      v_3b75f3("");
      await v_92fdf2();
      v_889fad(v_8d41d7("common.success"), v_8d41d7("invite.sentToast", { target: v_e0c7e8 }));
      void v_8f00b9;
    } catch (v_49263d) {
      let v_badeaf = v_8d41d7("invite.sendFailed");
      if (v_49263d instanceof v_84a859) {
        if (v_49263d.code === "QUOTA_EXCEEDED") v_badeaf = v_8d41d7("invite.quotaExceeded");
        else if (v_49263d.code === "ALREADY_INVITED") v_badeaf = v_8d41d7("invite.alreadyInvited");
        else if (v_49263d.code === "ALREADY_MEMBER") v_badeaf = v_8d41d7("invite.alreadyMember");
        else v_badeaf = v_49263d.message;
      }
      v_889fad(v_8d41d7("common.error"), v_badeaf);
    } finally {
      v_ee9ec1(false);
    }
  };

  const v_5ca23e = async (inv: v_fb1763) => {
    if (!v_2ca7e0) return;
    v_889fad(
      v_8d41d7("invite.cancelInviteTitle"),
      v_8d41d7("invite.cancelInviteDesc", { target: v_f0104f.inviteEmail ?? v_8d41d7("invite.create") }),
      [
        { text: v_8d41d7("common.close"), style: "cancel" },
        {
          text: v_8d41d7("common.cancel"),
          style: "destructive",
          onPress: async () => {
            try {
              await v_735203(v_2ca7e0, v_6e0fd3, v_f0104f.id);
              await v_92fdf2();
            } catch (v_49263d) {
              const v_badeaf = v_49263d instanceof v_84a859 ? v_49263d.message : v_8d41d7("invite.cancelFailed");
              v_889fad(v_8d41d7("common.error"), v_badeaf);
            }
          },
        },
      ],
    );
  };

  const v_eb4082 = async (m: v_f9a81e) => {
    if (!v_2ca7e0) return;
    const v_a3c903 = v_35f85c.targetUserId === v_493eec;
    const v_5ea0fe = v_a3c903 ? v_8d41d7("invite.leave") : v_8d41d7("invite.kick");
    const v_c4e8fe = v_a3c903
      ? v_8d41d7("invite.leaveTitle")
      : v_8d41d7("invite.kickTitle", { name: v_35f85c.targetUser?.name ?? v_35f85c.inviteEmail ?? "—" });
    v_889fad(v_5ea0fe, v_c4e8fe, [
      { text: v_8d41d7("common.close"), style: "cancel" },
      {
        text: v_5ea0fe,
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
            const v_badeaf =
              v_49263d instanceof v_84a859
                ? v_49263d.message
                : v_8d41d7("invite.actionFailed", { action: v_5ea0fe });
            v_889fad(v_8d41d7("common.error"), v_badeaf);
          }
        },
      },
    ]);
  };

  return (
    <SafeView backgroundColor={v_1bfbd0.zinc50}>
      <PageHeader
        title={v_8d41d7("invite.title")}
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
                <Text style={v_fd5f43.sectionTitle}>{v_8d41d7("invite.create")}</Text>
                <Text style={v_fd5f43.sectionDesc}>{v_8d41d7("invite.createHint")}</Text>
                <View style={v_fd5f43.inviteRow}>
                  <TextInput
                    style={v_fd5f43.emailInput}
                    placeholder={v_8d41d7("invite.emailPlaceholder")}
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
                      <Text style={v_fd5f43.sendBtnText}>{v_8d41d7("invite.send")}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {}
            {v_2aec08 && v_483de2.length > 0 && (
              <View style={v_fd5f43.card}>
                <Text style={v_fd5f43.sectionTitle}>{v_8d41d7("invite.pending", { n: v_483de2.length })}</Text>
                {v_483de2.map((v_f0104f) => (
                  <View key={v_f0104f.id} style={v_fd5f43.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={v_fd5f43.rowEmail}>{v_f0104f.inviteEmail ?? v_8d41d7("invite.noEmail")}</Text>
                      <Text style={v_fd5f43.rowSub}>
                        {v_9e04ad(v_f0104f.expiresAt, v_8d41d7)}
                      </Text>
                    </View>
                    <TouchableOpacity style={v_fd5f43.cancelBtn} onPress={() => v_5ca23e(v_f0104f)}>
                      <Text style={v_fd5f43.cancelBtnText}>{v_8d41d7("common.cancel")}</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {}
            <View style={v_fd5f43.card}>
              <Text style={v_fd5f43.sectionTitle}>{v_8d41d7("invite.members", { n: v_8673d6.length })}</Text>
              {v_8673d6.length === 0 ? (
                <Text style={v_fd5f43.empty}>{v_8d41d7("invite.noMembers")}</Text>
              ) : (
                v_8673d6.map((v_35f85c) => {
                  const v_a3c903 = v_35f85c.targetUserId === v_493eec;
                  const v_c48a58 = v_35f85c.role === "owner";
                  return (
                    <View key={v_35f85c.id} style={v_fd5f43.row}>
                      <View style={{ flex: 1 }}>
                        <Text style={v_fd5f43.rowEmail}>
                          {v_35f85c.targetUser?.name ?? v_35f85c.targetUser?.email ?? v_35f85c.inviteEmail ?? "—"}
                          {v_a3c903 && <Text style={v_fd5f43.selfBadge}> {v_8d41d7("invite.self")}</Text>}
                          {v_c48a58 && <Text style={v_fd5f43.ownerBadge}> {v_8d41d7("invite.ownerBadge")}</Text>}
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
                            {v_a3c903 ? v_8d41d7("invite.leave") : v_8d41d7("invite.kick")}
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

function v_9e04ad(
  v_0b8131,
  v_8d41d7,
): string {
  try {
    const v_f900a6 = new Date(v_0b8131.replace(" ", "T") + "Z").getTime();
    const v_d799e2 = v_f900a6 - Date.now();
    if (v_d799e2 <= 0) return v_8d41d7("invite.expired");
    const v_6a53fd = Math.floor(v_d799e2 / (24 * 60 * 60 * 1000));
    const v_12ebc1 = Math.floor((v_d799e2 % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    if (v_6a53fd > 0) return v_8d41d7("invite.expiresInDays", { days: v_6a53fd, hours: v_12ebc1 });
    return v_8d41d7("invite.expiresInHours", { hours: v_12ebc1 });
  } catch {
    return v_8d41d7("invite.noExpiresInfo");
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
    color: v_1bfbd0.zinc900,
    backgroundColor: v_1bfbd0.zinc50,
    borderRadius: v_8f28b1.borderRadius,
    height: v_8f28b1.height,
    paddingHorizontal: v_8f28b1.paddingHorizontal,
    paddingVertical: 0,
    fontSize: v_8f28b1.fontSize,
    lineHeight: v_8f28b1.lineHeight,
    textAlignVertical: v_8f28b1.textAlignVertical,
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
