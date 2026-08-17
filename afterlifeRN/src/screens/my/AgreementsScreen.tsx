

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
import { v_5401ae } from "../../testIDs";
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

  const [v_ede652, v_721e61] = v_5ab095<v_6a3f07>("none");
  const [v_53569b, v_147f73] = v_5ab095(true);
  const [v_1dead4, v_578637] = v_5ab095(false);
  const [v_312a6a, v_344e2f] = v_5ab095(false);

  const [v_ef3473, v_a782b8] = v_5ab095<v_f8228d>("none");
  const [v_2fe581, v_5d7683] = v_5ab095(true);
  const [v_09250c, v_07c9fd] = v_5ab095(false);

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
    v_fbea7d();
    v_ffac69();
  }, [v_fbea7d, v_ffac69]);

  v_cf763b(
    v_a3453e.useCallback(() => {
      v_fbea7d();
      v_ffac69();
    }, [v_fbea7d, v_ffac69]),
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

  return (
    <SafeScrollView backgroundColor={v_1bfbd0.white} showBottomBackground={false}>
      <PageHeader
        title={v_8d41d7("settings.agreements.title", { defaultValue: "동의" })}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />

      {}
      <FaceConsentSection t={v_8d41d7} />

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
  t: (key: string, opts?: Record<string, unknown>) => string;
}

function v_afe1c9({ t: v_8d41d7 }: FaceConsentSectionProps) {

  const v_c65f5d = v_ada615<v_390fcc<v_e57140>>();

  return (
    <View
      testID={v_5401ae.agreements.faceConsentSection}
      style={[v_fd5f43.content, { paddingTop: 16, paddingBottom: 32 }]}
    >
      <Text style={v_fd5f43.sectionTitle}>{v_8d41d7("settings.privacy.faceConsent.sectionTitle")}</Text>
      <View style={v_fd5f43.card}>
        <TouchableOpacity
          testID={v_5401ae.agreements.rememberingClonesEntry}
          style={[v_fd5f43.viewAllRow, { borderTopWidth: 0 }]}
          onPress={() => v_c65f5d.navigate("RememberingClones")}
          accessibilityRole="button"
        >
          <Text style={v_fd5f43.viewAllText}>
            {v_8d41d7("settings.rememberingClones.entry", { defaultValue: "나를 기억하는 클론" })}
          </Text>
          <Feather name="chevron-right" size={18} color={v_1bfbd0.zinc400} />
        </TouchableOpacity>
      </View>
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
      testID={v_5401ae.agreements.callLearningConsentSection}
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
              testID={v_5401ae.agreements.callLearningConsentToggle}
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
      testID={v_5401ae.agreements.faceBiometricConsentSection}
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
              testID={v_5401ae.agreements.faceBiometricConsentToggle}
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
  rowName: { fontSize: 15, fontWeight: "600", color: v_1bfbd0.zinc900 },
  rowSub: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: v_1bfbd0.zinc500,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
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
