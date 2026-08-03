

import { v_889fad } from "../../stores/dialogStore";
import v_a3453e, { v_de06a3, v_c4deb2, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
  v_39a996,
  v_79139e,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_cf763b, v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import { v_772971 } from "jmpfvteuuztnp";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import v_c0caa9 from "../../components/common/TermsModal";
import { v_1bfbd0, v_8b0c90 } from "../../components/constants";
import type { v_e57140 } from "../../navigation/types";
import { v_1ed7d9 } from "../../stores/authStore";
import {
  v_865d38,
  v_31967f,
  type v_5c12dc,
} from "../../api/persons";
import {
  v_7f847d,
  v_b14b3b,
  v_421733,
  v_0f8436,
  type v_6a3f07,
  type v_f8228d,
} from "../../api/consent";

export default function v_c78d4f() {
  const v_c65f5d = v_ada615<v_390fcc<v_e57140>>();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const { t: v_8d41d7 } = v_772971();

  const [v_fded81, v_1b22c3] = v_5ab095<v_5c12dc[]>([]);
  const [v_947634, v_8c4301] = v_5ab095(true);
  const [v_8728fe, v_efdde3] = v_5ab095<number | null>(null);

  const [v_ede652, v_721e61] = v_5ab095<v_6a3f07>("none");
  const [v_53569b, v_147f73] = v_5ab095(true);
  const [v_1dead4, v_578637] = v_5ab095(false);
  const [v_312a6a, v_344e2f] = v_5ab095(false);

  const [v_ef3473, v_a782b8] = v_5ab095<v_f8228d>("none");
  const [v_2fe581, v_5d7683] = v_5ab095(true);
  const [v_09250c, v_07c9fd] = v_5ab095(false);

  const v_ae477e = v_de06a3(async () => {
    if (!v_2ca7e0) {
      v_1b22c3([]);
      v_8c4301(false);
      return;
    }
    v_8c4301(true);
    try {
      const v_8f00b9 = await v_865d38(v_2ca7e0);
      v_1b22c3(v_8f00b9.items);
    } catch (v_49263d) {
      console.warn("[Agreements] listPersons failed:", v_49263d);
    } finally {
      v_8c4301(false);
    }
  }, [v_2ca7e0]);

  const v_fbea7d = v_de06a3(async () => {
    if (!v_2ca7e0) {
      v_721e61("none");
      v_147f73(false);
      return;
    }
    v_147f73(true);
    try {
      const v_b6e533 = await v_b14b3b(v_2ca7e0);
      v_721e61(v_b6e533);
    } catch (v_49263d) {
      console.warn("[Agreements] getCallLearningConsent failed:", v_49263d);
    } finally {
      v_147f73(false);
    }
  }, [v_2ca7e0]);

  const v_ffac69 = v_de06a3(async () => {
    if (!v_2ca7e0) {
      v_a782b8("none");
      v_5d7683(false);
      return;
    }
    v_5d7683(true);
    try {
      const v_cb35cb = await v_0f8436(v_2ca7e0);
      v_a782b8(v_cb35cb.state);
    } catch (v_49263d) {
      console.warn("[Agreements] getFaceBiometricConsent failed:", v_49263d);
    } finally {
      v_5d7683(false);
    }
  }, [v_2ca7e0]);

  v_c4deb2(() => {
    v_ae477e();
    v_fbea7d();
    v_ffac69();
  }, [v_ae477e, v_fbea7d, v_ffac69]);

  v_cf763b(
    v_a3453e.useCallback(() => {
      v_ae477e();
      v_fbea7d();
      v_ffac69();
    }, [v_ae477e, v_fbea7d, v_ffac69]),
  );

  const v_da6541 = async (v_3b402b) => {
    if (!v_2ca7e0 || v_1dead4) return;
    const v_ba2215 = v_ede652;
    v_578637(true);
    v_721e61(v_3b402b ? "granted" : "none");
    try {
      const v_cb35cb = await v_7f847d(
        v_2ca7e0,
        v_3b402b ? "granted" : "revoked",
        { channel: "settings" },
      );
      v_721e61(v_cb35cb.state === "granted" ? "granted" : "none");
    } catch (v_49263d) {
      v_721e61(v_ba2215);
      const v_badeaf =
        v_49263d instanceof Error ? v_49263d.message : v_8d41d7("settings.privacy.callLearning.saveError");
      v_889fad(v_8d41d7("common.error"), v_badeaf);
    } finally {
      v_578637(false);
    }
  };

  const v_0e6e60 = async (v_3b402b) => {
    if (!v_2ca7e0) return;
    const v_ba2215 = v_ef3473;
    v_07c9fd(true);
    v_a782b8(v_3b402b ? "granted" : "none");
    try {
      const v_cb35cb = await v_421733(
        v_2ca7e0,
        v_3b402b ? "granted" : "revoked",
        v_3b402b ? { termsVersion: "v1", channel: "settings" } : { channel: "settings" },
      );
      v_a782b8(v_cb35cb.state === "granted" ? "granted" : "none");
    } catch (v_49263d) {
      v_a782b8(v_ba2215);
      const v_badeaf = v_49263d instanceof Error ? v_49263d.message : v_8d41d7("settings.privacy.faceBiometric.saveError");
      v_889fad(v_8d41d7("common.error"), v_badeaf);
    } finally {
      v_07c9fd(false);
    }
  };

  const v_e334fb = (v_3b402b) => {
    if (!v_2ca7e0 || v_09250c) return;
    if (!v_3b402b) {
      v_889fad(
        v_8d41d7("settings.privacy.faceBiometric.revokeConfirmTitle"),
        v_8d41d7("settings.privacy.faceBiometric.revokeConfirmMessage"),
        [
          { text: v_8d41d7("settings.privacy.faceConsent.revokeConfirmCancel"), style: "cancel" },
          {
            text: v_8d41d7("settings.privacy.faceConsent.revokeConfirmOk"),
            style: "destructive",
            onPress: () => {
              void v_0e6e60(false);
            },
          },
        ],
      );
      return;
    }
    void v_0e6e60(true);
  };

  const v_74c662 = (person: v_5c12dc) => {
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
              v_1b22c3((v_ba2215) =>
                v_ba2215.map((v_e2a85c) =>
                  v_e2a85c.id === v_306a28.id ? { ...v_e2a85c, consentState: "revoked" } : v_e2a85c,
                ),
              );
            } catch (v_49263d) {
              const v_badeaf = v_49263d instanceof Error ? v_49263d.message : v_8d41d7("settings.privacy.faceConsent.revokeError");
              v_889fad(v_8d41d7("settings.privacy.faceConsent.revokeConfirmTitle"), v_badeaf);
            } finally {
              v_efdde3(null);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeScrollView backgroundColor={v_1bfbd0.white} showBottomBackground={false}>
      <PageHeader
        title={v_8d41d7("settings.agreements.title", { defaultValue: "동의" })}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />

      {}
      <FaceConsentSection
        persons={v_fded81}
        loading={v_947634}
        revokingId={v_8728fe}
        onRevoke={v_74c662}
        t={v_8d41d7}
      />

      {}
      <CallLearningConsentSection
        state={v_ede652}
        loading={v_53569b}
        saving={v_1dead4}
        onToggle={v_da6541}
        onViewTerms={() => v_344e2f(true)}
        t={v_8d41d7}
      />

      {}
      <FaceBiometricConsentSection
        state={v_ef3473}
        loading={v_2fe581}
        saving={v_09250c}
        onToggle={v_e334fb}
        t={v_8d41d7}
      />

      <TermsModal
        visible={v_312a6a}
        type={5}
        onClose={() => v_344e2f(false)}
        onAgree={() => v_344e2f(false)}
      />
    </SafeScrollView>
  );
}

interface FaceConsentSectionProps {
  persons: v_5c12dc[];
  loading: boolean;
  revokingId: number | null;
  onRevoke: (person: v_5c12dc) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

function v_afe1c9({ persons: v_fded81, loading: v_683210, revokingId: v_8728fe, onRevoke: v_9b29ab, t: v_8d41d7 }: FaceConsentSectionProps) {
  const v_b4ca3a = v_fded81.filter((v_e2a85c) => v_e2a85c.consentState === "granted");

  return (
    <View
      testID="face-consent-section"
      style={[v_fd5f43.content, { paddingTop: 16, paddingBottom: 32 }]}
    >
      <Text style={v_fd5f43.sectionTitle}>{v_8d41d7("settings.privacy.faceConsent.sectionTitle")}</Text>
      {v_683210 ? (
        <ActivityIndicator color={v_1bfbd0.zinc500} style={{ paddingTop: 20 }} />
      ) : v_b4ca3a.length === 0 ? (
        <View style={v_fd5f43.empty}>
          <Feather name="eye-off" size={32} color={v_1bfbd0.zinc300} />
          <Text style={v_fd5f43.emptyText}>{v_8d41d7("settings.privacy.faceConsent.noConsent")}</Text>
          <Text style={v_fd5f43.emptySub}>{v_8d41d7("settings.privacy.faceConsent.noConsentSub")}</Text>
        </View>
      ) : (
        <View style={v_fd5f43.card}>
          {v_b4ca3a.slice(0, 3).map((v_306a28, v_ebec57) => {
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
                    onPress={() => v_9b29ab(v_306a28)}
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
                {v_ebec57 < Math.min(v_b4ca3a.length, 3) - 1 && <View style={v_fd5f43.divider} />}
              </View>
            );
          })}
          {}
          {v_b4ca3a.length > 3 ? (
            <TouchableOpacity
              style={v_fd5f43.viewAllRow}
              onPress={() => (navigation as any).navigate("AcquaintanceManagement")}
              accessibilityRole="button"
            >
              <Text style={v_fd5f43.viewAllText}>
                {v_8d41d7("settings.privacy.faceConsent.viewAll", {
                  count: v_b4ca3a.length,
                  defaultValue: `전체 보기 (${v_b4ca3a.length}명)`,
                })}
              </Text>
              <Feather name="chevron-right" size={18} color={v_1bfbd0.zinc400} />
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
  );
}

interface CallLearningConsentSectionProps {
  state: v_6a3f07;
  loading: boolean;
  saving: boolean;
  onToggle: (value: boolean) => void;
  onViewTerms: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

function v_efb928({
  state: v_b6e533,
  loading: v_683210,
  saving: v_35bf26,
  onToggle: v_0a2cea,
  onViewTerms: v_6c57c3,
  t: v_8d41d7,
}: CallLearningConsentSectionProps) {
  return (
    <View
      testID="call-learning-consent-section"
      style={[v_fd5f43.content, { paddingTop: 0, paddingBottom: 32 }]}
    >
      <Text style={v_fd5f43.sectionTitle}>{v_8d41d7("settings.privacy.callLearning.sectionTitle")}</Text>
      <View style={v_fd5f43.card}>
        <View style={v_fd5f43.row}>
          <View style={{ flex: 1 }}>
            <Text style={v_fd5f43.rowName}>{v_8d41d7("settings.privacy.callLearning.toggleLabel")}</Text>
            <Text style={v_fd5f43.rowSub}>{v_8d41d7("settings.privacy.callLearning.description")}</Text>
            <TouchableOpacity onPress={v_6c57c3} hitSlop={8}>
              <Text style={[v_fd5f43.rowSub, v_fd5f43.callLearningTermsLink]}>
                {v_8d41d7("settings.privacy.callLearning.viewTerms")}
              </Text>
            </TouchableOpacity>
          </View>
          {v_683210 ? (
            <ActivityIndicator color={v_1bfbd0.zinc500} />
          ) : (
            <Switch
              testID="call-learning-consent-toggle"
              value={v_b6e533 === "granted"}
              onValueChange={v_0a2cea}
              disabled={v_35bf26}
              trackColor={{ false: v_1bfbd0.zinc200, true: v_1bfbd0.violet600 }}
              thumbColor={v_1bfbd0.white}
            />
          )}
        </View>
      </View>
    </View>
  );
}

interface FaceBiometricConsentSectionProps {
  state: v_f8228d;
  loading: boolean;
  saving: boolean;
  onToggle: (value: boolean) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

function v_b8358a({
  state: v_b6e533,
  loading: v_683210,
  saving: v_35bf26,
  onToggle: v_0a2cea,
  t: v_8d41d7,
}: FaceBiometricConsentSectionProps) {
  return (
    <View
      testID="face-biometric-consent-section"
      style={[v_fd5f43.content, { paddingTop: 0, paddingBottom: 32 }]}
    >
      <Text style={v_fd5f43.sectionTitle}>{v_8d41d7("settings.privacy.faceBiometric.sectionTitle")}</Text>
      <View style={v_fd5f43.card}>
        <View style={v_fd5f43.row}>
          <View style={{ flex: 1 }}>
            <Text style={v_fd5f43.rowName}>{v_8d41d7("settings.privacy.faceBiometric.toggleLabel")}</Text>
            <Text style={v_fd5f43.rowSub}>{v_8d41d7("settings.privacy.faceBiometric.description")}</Text>
          </View>
          {v_683210 ? (
            <ActivityIndicator color={v_1bfbd0.zinc500} />
          ) : (
            <Switch
              testID="face-biometric-consent-toggle"
              value={v_b6e533 === "granted"}
              onValueChange={v_0a2cea}
              disabled={v_35bf26}
              trackColor={{ false: v_1bfbd0.zinc200, true: v_1bfbd0.violet600 }}
              thumbColor={v_1bfbd0.white}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const v_fd5f43 = v_472849.create({
  content: {
    paddingHorizontal: 24,
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
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  empty: { alignItems: "center", paddingTop: 20, gap: 10 },
  emptyText: { color: v_1bfbd0.zinc600, fontSize: 14, fontWeight: "600" },
  emptySub: { color: v_1bfbd0.zinc400, fontSize: 12 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: v_1bfbd0.zinc500,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  revokeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: v_1bfbd0.zinc900,
    minWidth: 78,
    alignItems: "center",
  },
  revokeBtnText: { fontSize: 12, fontWeight: "700", color: v_1bfbd0.white },
  viewAllRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: v_472849.hairlineWidth,
    borderTopColor: v_1bfbd0.zinc100,
  },
  viewAllText: { fontSize: 13, color: v_1bfbd0.zinc700, fontWeight: "600" },
  callLearningTermsLink: {
    color: v_1bfbd0.zinc700,
    textDecorationLine: "underline",
    marginTop: 6,
  },
});
