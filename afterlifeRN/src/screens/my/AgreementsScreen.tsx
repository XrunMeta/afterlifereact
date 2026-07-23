

import { showAlert } from "../../stores/dialogStore";
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import SafeScrollView from "../../components/ui/SafeScrollView";
import PageHeader from "../../components/common/PageHeader";
import TermsModal from "../../components/common/TermsModal";
import { COLORS, RADIUS } from "../../components/constants";
import type { MyStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../stores/authStore";
import {
  listPersons,
  saveFaceConsent,
  type Person,
} from "../../api/persons";
import {
  saveCallLearningConsent,
  getCallLearningConsent,
  saveFaceBiometricConsent,
  getFaceBiometricConsent,
  type CallLearningState,
  type FaceBiometricState,
} from "../../api/consent";

export default function AgreementsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MyStackParamList>>();
  const accessToken = useAuthStore((s) => s.accessToken);
  const { t } = useTranslation();

  const [persons, setPersons] = useState<Person[]>([]);
  const [personsLoading, setPersonsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<number | null>(null);

  const [callLearning, setCallLearning] = useState<CallLearningState>("none");
  const [callLearningLoading, setCallLearningLoading] = useState(true);
  const [callLearningSaving, setCallLearningSaving] = useState(false);
  const [callLearningTermsOpen, setCallLearningTermsOpen] = useState(false);

  const [faceBiometric, setFaceBiometric] = useState<FaceBiometricState>("none");
  const [faceBiometricLoading, setFaceBiometricLoading] = useState(true);
  const [faceBiometricSaving, setFaceBiometricSaving] = useState(false);

  const refreshPersons = useCallback(async () => {
    if (!accessToken) {
      setPersons([]);
      setPersonsLoading(false);
      return;
    }
    setPersonsLoading(true);
    try {
      const res = await listPersons(accessToken);
      setPersons(res.items);
    } catch (err) {
      console.warn("[Agreements] listPersons failed:", err);
    } finally {
      setPersonsLoading(false);
    }
  }, [accessToken]);

  const refreshCallLearning = useCallback(async () => {
    if (!accessToken) {
      setCallLearning("none");
      setCallLearningLoading(false);
      return;
    }
    setCallLearningLoading(true);
    try {
      const state = await getCallLearningConsent(accessToken);
      setCallLearning(state);
    } catch (err) {
      console.warn("[Agreements] getCallLearningConsent failed:", err);
    } finally {
      setCallLearningLoading(false);
    }
  }, [accessToken]);

  const refreshFaceBiometric = useCallback(async () => {
    if (!accessToken) {
      setFaceBiometric("none");
      setFaceBiometricLoading(false);
      return;
    }
    setFaceBiometricLoading(true);
    try {
      const r = await getFaceBiometricConsent(accessToken);
      setFaceBiometric(r.state);
    } catch (err) {
      console.warn("[Agreements] getFaceBiometricConsent failed:", err);
    } finally {
      setFaceBiometricLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    refreshPersons();
    refreshCallLearning();
    refreshFaceBiometric();
  }, [refreshPersons, refreshCallLearning, refreshFaceBiometric]);

  useFocusEffect(
    React.useCallback(() => {
      refreshPersons();
      refreshCallLearning();
      refreshFaceBiometric();
    }, [refreshPersons, refreshCallLearning, refreshFaceBiometric]),
  );

  const handleToggleCallLearning = async (value: boolean) => {
    if (!accessToken || callLearningSaving) return;
    const prev = callLearning;
    setCallLearningSaving(true);
    setCallLearning(value ? "granted" : "none");
    try {
      const r = await saveCallLearningConsent(
        accessToken,
        value ? "granted" : "revoked",
        { channel: "settings" },
      );
      setCallLearning(r.state === "granted" ? "granted" : "none");
    } catch (err) {
      setCallLearning(prev);
      const msg =
        err instanceof Error ? err.message : t("settings.privacy.callLearning.saveError");
      showAlert(t("common.error"), msg);
    } finally {
      setCallLearningSaving(false);
    }
  };

  const saveFaceBiometricToggle = async (value: boolean) => {
    if (!accessToken) return;
    const prev = faceBiometric;
    setFaceBiometricSaving(true);
    setFaceBiometric(value ? "granted" : "none");
    try {
      const r = await saveFaceBiometricConsent(
        accessToken,
        value ? "granted" : "revoked",
        value ? { termsVersion: "v1", channel: "settings" } : { channel: "settings" },
      );
      setFaceBiometric(r.state === "granted" ? "granted" : "none");
    } catch (err) {
      setFaceBiometric(prev);
      const msg = err instanceof Error ? err.message : t("settings.privacy.faceBiometric.saveError");
      showAlert(t("common.error"), msg);
    } finally {
      setFaceBiometricSaving(false);
    }
  };

  const handleToggleFaceBiometric = (value: boolean) => {
    if (!accessToken || faceBiometricSaving) return;
    if (!value) {
      showAlert(
        t("settings.privacy.faceBiometric.revokeConfirmTitle"),
        t("settings.privacy.faceBiometric.revokeConfirmMessage"),
        [
          { text: t("settings.privacy.faceConsent.revokeConfirmCancel"), style: "cancel" },
          {
            text: t("settings.privacy.faceConsent.revokeConfirmOk"),
            style: "destructive",
            onPress: () => {
              void saveFaceBiometricToggle(false);
            },
          },
        ],
      );
      return;
    }
    void saveFaceBiometricToggle(true);
  };

  const handleRevoke = (person: Person) => {
    showAlert(
      t("settings.privacy.faceConsent.revokeConfirmTitle"),
      t("settings.privacy.faceConsent.revokeConfirmMessage"),
      [
        { text: t("settings.privacy.faceConsent.revokeConfirmCancel"), style: "cancel" },
        {
          text: t("settings.privacy.faceConsent.revokeConfirmOk"),
          style: "destructive",
          onPress: async () => {
            if (!accessToken) return;
            setRevokingId(person.id);
            try {
              await saveFaceConsent(accessToken, person.id, "revoked");
              setPersons((prev) =>
                prev.map((p) =>
                  p.id === person.id ? { ...p, consentState: "revoked" } : p,
                ),
              );
            } catch (err) {
              const msg = err instanceof Error ? err.message : t("settings.privacy.faceConsent.revokeError");
              showAlert(t("settings.privacy.faceConsent.revokeConfirmTitle"), msg);
            } finally {
              setRevokingId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeScrollView backgroundColor={COLORS.white} showBottomBackground={false}>
      <PageHeader
        title={t("settings.agreements.title", { defaultValue: "동의" })}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      {}
      <FaceConsentSection
        persons={persons}
        loading={personsLoading}
        revokingId={revokingId}
        onRevoke={handleRevoke}
        t={t}
      />

      {}
      <CallLearningConsentSection
        state={callLearning}
        loading={callLearningLoading}
        saving={callLearningSaving}
        onToggle={handleToggleCallLearning}
        onViewTerms={() => setCallLearningTermsOpen(true)}
        t={t}
      />

      {}
      <FaceBiometricConsentSection
        state={faceBiometric}
        loading={faceBiometricLoading}
        saving={faceBiometricSaving}
        onToggle={handleToggleFaceBiometric}
        t={t}
      />

      <TermsModal
        visible={callLearningTermsOpen}
        type={5}
        onClose={() => setCallLearningTermsOpen(false)}
        onAgree={() => setCallLearningTermsOpen(false)}
      />
    </SafeScrollView>
  );
}

interface FaceConsentSectionProps {
  persons: Person[];
  loading: boolean;
  revokingId: number | null;
  onRevoke: (person: Person) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

function FaceConsentSection({ persons, loading, revokingId, onRevoke, t }: FaceConsentSectionProps) {
  const grantedPersons = persons.filter((p) => p.consentState === "granted");

  return (
    <View
      testID="face-consent-section"
      style={[s.content, { paddingTop: 16, paddingBottom: 32 }]}
    >
      <Text style={s.sectionTitle}>{t("settings.privacy.faceConsent.sectionTitle")}</Text>
      {loading ? (
        <ActivityIndicator color={COLORS.zinc500} style={{ paddingTop: 20 }} />
      ) : grantedPersons.length === 0 ? (
        <View style={s.empty}>
          <Feather name="eye-off" size={32} color={COLORS.zinc300} />
          <Text style={s.emptyText}>{t("settings.privacy.faceConsent.noConsent")}</Text>
          <Text style={s.emptySub}>{t("settings.privacy.faceConsent.noConsentSub")}</Text>
        </View>
      ) : (
        <View style={s.card}>
          {grantedPersons.map((person, i) => {
            const busy = revokingId === person.id;
            const consentLabel = person.createdAt
              ? t("settings.privacy.faceConsent.consentedAt", {
                  date: new Date(person.createdAt).toLocaleDateString(),
                })
              : t("settings.privacy.faceConsent.stateGranted");
            const cloneLabel = person.cloneId
              ? t("settings.privacy.faceConsent.cloneLabel", { cloneId: person.cloneId })
              : `Person #${person.id}`;

            return (
              <View key={person.id}>
                <View style={s.row}>
                  <View style={[s.avatar, s.avatarPh]}>
                    <Feather name="eye" size={20} color={COLORS.zinc400} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowName} numberOfLines={1}>
                      {cloneLabel}
                    </Text>
                    <Text style={s.rowSub} numberOfLines={1}>
                      {consentLabel}
                    </Text>
                  </View>
                  <TouchableOpacity
                    testID={`revoke-btn-${person.id}`}
                    style={[s.revokeBtn, busy && { opacity: 0.6 }]}
                    onPress={() => onRevoke(person)}
                    disabled={busy}
                    accessibilityLabel={t("settings.privacy.faceConsent.revokeButton")}
                    accessibilityRole="button"
                  >
                    {busy ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <Text style={s.revokeBtnText}>
                        {t("settings.privacy.faceConsent.revokeButton")}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
                {i < grantedPersons.length - 1 && <View style={s.divider} />}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

interface CallLearningConsentSectionProps {
  state: CallLearningState;
  loading: boolean;
  saving: boolean;
  onToggle: (value: boolean) => void;
  onViewTerms: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

function CallLearningConsentSection({
  state,
  loading,
  saving,
  onToggle,
  onViewTerms,
  t,
}: CallLearningConsentSectionProps) {
  return (
    <View
      testID="call-learning-consent-section"
      style={[s.content, { paddingTop: 0, paddingBottom: 32 }]}
    >
      <Text style={s.sectionTitle}>{t("settings.privacy.callLearning.sectionTitle")}</Text>
      <View style={s.card}>
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={s.rowName}>{t("settings.privacy.callLearning.toggleLabel")}</Text>
            <Text style={s.rowSub}>{t("settings.privacy.callLearning.description")}</Text>
            <TouchableOpacity onPress={onViewTerms} hitSlop={8}>
              <Text style={[s.rowSub, s.callLearningTermsLink]}>
                {t("settings.privacy.callLearning.viewTerms")}
              </Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator color={COLORS.zinc500} />
          ) : (
            <Switch
              testID="call-learning-consent-toggle"
              value={state === "granted"}
              onValueChange={onToggle}
              disabled={saving}
              trackColor={{ false: COLORS.zinc200, true: COLORS.violet600 }}
              thumbColor={COLORS.white}
            />
          )}
        </View>
      </View>
    </View>
  );
}

interface FaceBiometricConsentSectionProps {
  state: FaceBiometricState;
  loading: boolean;
  saving: boolean;
  onToggle: (value: boolean) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

function FaceBiometricConsentSection({
  state,
  loading,
  saving,
  onToggle,
  t,
}: FaceBiometricConsentSectionProps) {
  return (
    <View
      testID="face-biometric-consent-section"
      style={[s.content, { paddingTop: 0, paddingBottom: 32 }]}
    >
      <Text style={s.sectionTitle}>{t("settings.privacy.faceBiometric.sectionTitle")}</Text>
      <View style={s.card}>
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={s.rowName}>{t("settings.privacy.faceBiometric.toggleLabel")}</Text>
            <Text style={s.rowSub}>{t("settings.privacy.faceBiometric.description")}</Text>
          </View>
          {loading ? (
            <ActivityIndicator color={COLORS.zinc500} />
          ) : (
            <Switch
              testID="face-biometric-consent-toggle"
              value={state === "granted"}
              onValueChange={onToggle}
              disabled={saving}
              trackColor={{ false: COLORS.zinc200, true: COLORS.violet600 }}
              thumbColor={COLORS.white}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxWidth: 780,
    alignSelf: "center",
    width: "100%",
  },
  card: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    borderRadius: RADIUS.lg,
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
    backgroundColor: COLORS.zinc100,
    alignItems: "center",
    justifyContent: "center",
  },
  rowName: { fontSize: 15, fontWeight: "600", color: COLORS.zinc900 },
  rowSub: { fontSize: 12, color: COLORS.zinc500, marginTop: 2 },
  divider: { height: 1, backgroundColor: COLORS.zinc100, marginLeft: 72 },
  empty: { alignItems: "center", paddingTop: 20, gap: 10 },
  emptyText: { color: COLORS.zinc600, fontSize: 14, fontWeight: "600" },
  emptySub: { color: COLORS.zinc400, fontSize: 12 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.zinc500,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  revokeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.zinc900,
    minWidth: 78,
    alignItems: "center",
  },
  revokeBtnText: { fontSize: 12, fontWeight: "700", color: COLORS.white },
  callLearningTermsLink: {
    color: COLORS.zinc700,
    textDecorationLine: "underline",
    marginTop: 6,
  },
});
