

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
  saveCallLearningConsent,
  getCallLearningConsent,
  saveFaceBiometricConsent,
  getFaceBiometricConsent,
  saveLocationConsent,
  getLocationConsent,
  type CallLearningState,
  type FaceBiometricState,
  type LocationConsentState,
} from "../../api/consent";

export default function AgreementsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MyStackParamList>>();
  const accessToken = useAuthStore((s) => s.accessToken);
  const { t } = useTranslation();

  const [callLearning, setCallLearning] = useState<CallLearningState>("none");
  const [callLearningLoading, setCallLearningLoading] = useState(true);
  const [callLearningSaving, setCallLearningSaving] = useState(false);
  const [callLearningTermsOpen, setCallLearningTermsOpen] = useState(false);

  const [faceBiometric, setFaceBiometric] = useState<FaceBiometricState>("none");
  const [faceBiometricLoading, setFaceBiometricLoading] = useState(true);
  const [faceBiometricSaving, setFaceBiometricSaving] = useState(false);

  const [location, setLocation] = useState<LocationConsentState>("none");
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationSaving, setLocationSaving] = useState(false);

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

  const refreshLocation = useCallback(async () => {
    if (!accessToken) {
      setLocation("none");
      setLocationLoading(false);
      return;
    }
    setLocationLoading(true);
    try {
      const state = await getLocationConsent(accessToken);
      setLocation(state);
    } catch (err) {
      console.warn("[Agreements] getLocationConsent failed:", err);
    } finally {
      setLocationLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    refreshCallLearning();
    refreshFaceBiometric();
    refreshLocation();
  }, [refreshCallLearning, refreshFaceBiometric, refreshLocation]);

  useFocusEffect(
    React.useCallback(() => {
      refreshCallLearning();
      refreshFaceBiometric();
      refreshLocation();
    }, [refreshCallLearning, refreshFaceBiometric, refreshLocation]),
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

  const handleToggleLocation = async (value: boolean) => {
    if (!accessToken || locationSaving) return;
    if (value) {
      setLocationSaving(true);
      try {
        const LocationMod = await import("expo-location");
        const initial = await LocationMod.getForegroundPermissionsAsync();
        const perm = initial.granted
          ? initial
          : await LocationMod.requestForegroundPermissionsAsync();
        if (!perm.granted) {
          showAlert(
            t("auth.signup.locationPermTitle", { defaultValue: "위치 권한 필요" }),
            t("auth.signup.locationPermDesc", {
              defaultValue:
                "통화 시 지역 기반 대화를 하려면 위치 권한이 필요합니다.\n기기 설정 → 위치 → AfterLife 에서 허용해 주십시오.",
            }),
          );
          setLocationSaving(false);
          return;
        }
        const r = await saveLocationConsent(accessToken, "granted", { channel: "settings" });
        setLocation(r.state === "granted" ? "granted" : "none");
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        showAlert(t("common.error"), msg);
      } finally {
        setLocationSaving(false);
      }
      return;
    }

    const prev = location;
    setLocationSaving(true);
    setLocation("none");
    try {
      const r = await saveLocationConsent(accessToken, "revoked", { channel: "settings" });
      setLocation(r.state === "granted" ? "granted" : "none");
    } catch (err) {
      setLocation(prev);
      const msg = err instanceof Error ? err.message : String(err);
      showAlert(t("common.error"), msg);
    } finally {
      setLocationSaving(false);
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

  return (
    <SafeScrollView backgroundColor={COLORS.white} showBottomBackground={false}>
      <PageHeader
        title={t("settings.agreements.title", { defaultValue: "동의" })}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      {}
      <FaceConsentSection t={t} />

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

      {}
      <LocationConsentSection
        state={location}
        loading={locationLoading}
        saving={locationSaving}
        onToggle={handleToggleLocation}
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
  t: (key: string, opts?: Record<string, unknown>) => string;
}

function FaceConsentSection({ t }: FaceConsentSectionProps) {

  const navigation = useNavigation<NativeStackNavigationProp<MyStackParamList>>();

  return (
    <View
      testID="face-consent-section"
      style={[s.content, { paddingTop: 16, paddingBottom: 32 }]}
    >
      <Text style={s.sectionTitle}>{t("settings.privacy.faceConsent.sectionTitle")}</Text>
      <View style={s.card}>
        <TouchableOpacity
          testID="remembering-clones-entry"
          style={[s.viewAllRow, { borderTopWidth: 0 }]}
          onPress={() => navigation.navigate("RememberingClones")}
          accessibilityRole="button"
        >
          <Text style={s.viewAllText}>
            {t("settings.rememberingClones.entry", { defaultValue: "나를 기억하는 클론" })}
          </Text>
          <Feather name="chevron-right" size={18} color={COLORS.zinc400} />
        </TouchableOpacity>
      </View>
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

interface LocationConsentSectionProps {
  state: LocationConsentState;
  loading: boolean;
  saving: boolean;
  onToggle: (value: boolean) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

function LocationConsentSection({
  state,
  loading,
  saving,
  onToggle,
  t,
}: LocationConsentSectionProps) {
  return (
    <View
      testID="location-consent-section"
      style={[s.content, { paddingTop: 0, paddingBottom: 32 }]}
    >
      <Text style={s.sectionTitle}>
        {t("settings.privacy.location.sectionTitle", { defaultValue: "위치기반 서비스" })}
      </Text>
      <View style={s.card}>
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={s.rowName}>
              {t("settings.privacy.location.toggleLabel", { defaultValue: "위치 정보 사용" })}
            </Text>
            <Text style={s.rowSub}>
              {t("settings.privacy.location.description", {
                defaultValue: "통화 시 현재 지역을 페르소나에게 힌트로 전달합니다. (선택)",
              })}
            </Text>
          </View>
          {loading ? (
            <ActivityIndicator color={COLORS.zinc500} />
          ) : (
            <Switch
              testID="location-consent-toggle"
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
  rowName: { fontSize: 15, fontWeight: "600", color: COLORS.zinc900 },
  rowSub: { fontSize: 12, color: COLORS.zinc500, marginTop: 2 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.zinc500,
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
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.zinc100,
  },
  viewAllText: { fontSize: 13, color: COLORS.zinc700, fontWeight: "600" },
  callLearningTermsLink: {
    color: COLORS.zinc700,
    textDecorationLine: "underline",
    marginTop: 6,
  },
});
