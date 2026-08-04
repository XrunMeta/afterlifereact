

import v_a3453e, { v_de06a3, v_c4deb2, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_122070,
  v_39a996,
  v_6c4f62,
  v_4623af,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_cf763b, v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import { v_772971 } from "jmpfvteuuztnp";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0, v_8b0c90 } from "../../components/constants";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_889fad } from "../../stores/dialogStore";
import { v_865d38, v_31967f, type v_5c12dc } from "../../api/persons";

export default function v_99450d() {
  const v_c65f5d = v_ada615();
  const { t: v_8d41d7 } = v_772971();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);

  const [v_4622b9, v_fa923c] = v_5ab095<v_5c12dc[]>([]);
  const [v_683210, v_34a50a] = v_5ab095(true);
  const [v_612e9f, v_575aad] = v_5ab095(false);
  const [v_8728fe, v_efdde3] = v_5ab095<number | null>(null);

  const v_1a1b9b = v_de06a3(async () => {
    if (!v_2ca7e0) {
      v_34a50a(false);
      return;
    }
    try {
      const v_8f00b9 = await v_865d38(v_2ca7e0);
      v_fa923c(v_8f00b9.items);
    } catch (v_49263d) {
      console.warn("[Acquaintance] list failed:", v_49263d);
    } finally {
      v_34a50a(false);
      v_575aad(false);
    }
  }, [v_2ca7e0]);

  v_c4deb2(() => { void v_1a1b9b(); }, [v_1a1b9b]);
  v_cf763b(v_de06a3(() => { void v_1a1b9b(); }, [v_1a1b9b]));

  const v_0cde43 = v_de06a3(() => {
    v_575aad(true);
    void v_1a1b9b();
  }, [v_1a1b9b]);

  const v_74c662 = v_de06a3((person: v_5c12dc) => {
    v_889fad(
      v_8d41d7("settings.privacy.faceConsent.revokeConfirmTitle"),
      v_8d41d7("settings.privacy.faceConsent.revokeConfirmMessage"),
      [
        { text: v_8d41d7("settings.privacy.faceConsent.revokeConfirmCancel"), style: "cancel" },
        {
          text: v_8d41d7("settings.privacy.faceConsent.revokeConfirmOk"),
          style: "destructive",
          onPress: async () => {
            if (!v_2ca7e0) return;
            v_efdde3(v_306a28.id);
            try {
              await v_31967f(v_2ca7e0, v_306a28.id, "revoked");

              v_fa923c((v_ba2215) =>
                v_ba2215.map((v_e2a85c) =>
                  v_e2a85c.id === v_306a28.id ? { ...v_e2a85c, consentState: "revoked" } : v_e2a85c,
                ),
              );
            } catch (v_49263d) {
              const v_badeaf =
                v_49263d instanceof Error
                  ? v_49263d.message
                  : v_8d41d7("settings.privacy.faceConsent.revokeError");
              v_889fad(v_8d41d7("settings.privacy.faceConsent.revokeConfirmTitle"), v_badeaf);
            } finally {
              v_efdde3(null);
            }
          },
        },
      ],
    );
  }, [v_2ca7e0, v_8d41d7]);

  const v_b6d66b = v_4622b9.filter((v_e2a85c) => v_e2a85c.consentState === "granted");

  return (
    <View style={{ flex: 1, backgroundColor: v_1bfbd0.white }}>
      <PageHeader
        title={v_8d41d7("settings.acquaintance.title", { defaultValue: "지인 관리" })}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />
      <ScrollView
        contentContainerStyle={v_fd5f43.content}
        refreshControl={
          <RefreshControl
            refreshing={v_612e9f}
            onRefresh={v_0cde43}
            tintColor={v_1bfbd0.zinc400}
          />
        }
      >
        {v_683210 ? (
          <ActivityIndicator color={v_1bfbd0.zinc400} style={{ marginTop: 40 }} />
        ) : v_b6d66b.length === 0 ? (
          <View style={v_fd5f43.empty}>
            <Feather name="eye-off" size={32} color={v_1bfbd0.zinc300} />
            <Text style={v_fd5f43.emptyText}>
              {v_8d41d7("settings.privacy.faceConsent.noConsent", {
                defaultValue: "동의한 지인이 없어요",
              })}
            </Text>
            <Text style={v_fd5f43.emptySub}>
              {v_8d41d7("settings.privacy.faceConsent.noConsentSub", {
                defaultValue: "얼굴 감지 동의가 여기에 표시돼요.",
              })}
            </Text>
          </View>
        ) : (
          <>
            <Text style={v_fd5f43.countLabel}>
              {v_8d41d7("settings.acquaintance.count", {
                defaultValue: "총 {{n}}명",
                n: v_b6d66b.length,
              })}
            </Text>
            <View style={v_fd5f43.card}>
              {v_b6d66b.map((v_306a28, v_ebec57) => {
                const v_3f8465 = v_8728fe === v_306a28.id;
                const v_8f5b15 = v_306a28.createdAt
                  ? v_8d41d7("settings.privacy.faceConsent.consentedAt", {
                      date: new Date(v_306a28.createdAt).toLocaleDateString(),
                    })
                  : v_8d41d7("settings.privacy.faceConsent.stateGranted");
                const v_24c1e9 = v_306a28.cloneId
                  ? v_8d41d7("settings.privacy.faceConsent.cloneLabel", { cloneId: v_306a28.cloneId })
                  : `Person #${v_306a28.id}`;

                const v_531384 = v_306a28.displayName?.trim() || v_24c1e9;
                return (
                  <View key={v_306a28.id}>
                    <View style={v_fd5f43.row}>
                      <View style={[v_fd5f43.avatar, v_fd5f43.avatarPh]}>
                        <Feather name="eye" size={20} color={v_1bfbd0.zinc400} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={v_fd5f43.rowName} numberOfLines={1}>
                          {v_531384}
                        </Text>
                        <Text style={v_fd5f43.rowSub} numberOfLines={1}>
                          {v_8f5b15}
                        </Text>
                      </View>
                      <TouchableOpacity
                        testID={`revoke-btn-${v_306a28.id}`}
                        style={[v_fd5f43.revokeBtn, v_3f8465 && { opacity: 0.6 }]}
                        onPress={() => v_74c662(v_306a28)}
                        disabled={v_3f8465}
                        accessibilityLabel={v_8d41d7("settings.privacy.faceConsent.revokeButton")}
                        accessibilityRole="button"
                      >
                        {v_3f8465 ? (
                          <ActivityIndicator size="small" color={v_1bfbd0.white} />
                        ) : (
                          <Text style={v_fd5f43.revokeBtnText}>
                            {v_8d41d7("settings.privacy.faceConsent.revokeButton")}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                    {v_ebec57 < v_b6d66b.length - 1 && <View style={v_fd5f43.divider} />}
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const v_fd5f43 = v_472849.create({
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 60 },
  countLabel: {
    fontSize: 13,
    color: v_1bfbd0.zinc500,
    marginBottom: 12,
    fontWeight: "500",
  },
  card: {
    borderRadius: v_8b0c90.lg,
    backgroundColor: v_1bfbd0.white,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc100,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPh: {
    backgroundColor: v_1bfbd0.zinc100,
    alignItems: "center",
    justifyContent: "center",
  },
  rowName: { fontSize: 15, fontWeight: "600", color: v_1bfbd0.zinc900 },
  rowSub: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },
  divider: { height: 1, backgroundColor: v_1bfbd0.zinc100, marginLeft: 72 },
  revokeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: v_1bfbd0.zinc900,
    minWidth: 76,
    alignItems: "center",
  },
  revokeBtnText: { fontSize: 12, fontWeight: "700", color: v_1bfbd0.white },
  empty: { alignItems: "center", paddingTop: 60, paddingHorizontal: 24, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: "600", color: v_1bfbd0.zinc700, marginTop: 8 },
  emptySub: {
    fontSize: 13,
    color: v_1bfbd0.zinc500,
    textAlign: "center",
    lineHeight: 20,
  },
});
