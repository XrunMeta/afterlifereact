import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";

import SafeView from "../../components/ui/SafeView";
import SafeScrollView from "../../components/ui/SafeScrollView";
import Button from "../../components/ui/Button";
import InterestChip from "../../components/ui/InterestChip";
import PageHeader from "../../components/common/PageHeader";
import { COLORS, SIZES } from "../../components/constants";
import { ALL_INTERESTS } from "../../mocks/interestHelpers";
import { xrunComplete, AuthApiError, getMe } from "../../api/auth";
import { useAuthStore } from "../../stores/authStore";
import { requestPushPermission } from "../../lib/pushNotifications";
import { getOrCreateDeviceId } from "../../lib/deviceId";

type Props = NativeStackScreenProps<AuthStackParamList, "XrunOnboarding">;

export default function XrunOnboardingScreen({ navigation, route }: Props) {
  const { email, pin, verificationCode } = route.params;
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [agreeRequired, setAgreeRequired] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [requestingPush, setRequestingPush] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [pushPlatform, setPushPlatform] = useState<"ios" | "android" | "web" | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const setApiAuth = useAuthStore((s) => s.setApiAuth);
  const hydrate = useAuthStore((s) => s.hydrate);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
    );
  };

  const toggleMarketing = async () => {
    if (agreeMarketing) {
      setAgreeMarketing(false);
      setPushToken(null);
      setPushPlatform(null);
      setDeviceId(null);
      return;
    }
    setRequestingPush(true);
    try {
      const reg = await requestPushPermission();
      if (!reg.granted) {
        Alert.alert(
          "푸시 알림 권한 필요",
          "마케팅 정보 알림을 받으려면 푸시 알림 권한이 필요합니다.\n기기 설정 → 알림 → AfterLife 에서 허용해주세요.",
        );
        return;
      }
      const did = await getOrCreateDeviceId();
      setAgreeMarketing(true);
      setPushToken(reg.token ?? null);
      setPushPlatform(reg.platform);
      setDeviceId(did);
    } catch {
      Alert.alert("오류", "권한 요청 중 문제가 발생했습니다.");
    } finally {
      setRequestingPush(false);
    }
  };

  const handleComplete = async () => {
    if (!agreeRequired) {
      Alert.alert("알림", "이용약관에 동의해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await xrunComplete({
        email,
        pin,
        verificationCode,
        interests: selectedInterests.length > 0 ? selectedInterests : undefined,
        marketingConsent: agreeMarketing,
        deviceId: deviceId ?? undefined,
        pushToken: pushToken ?? undefined,
        platform: pushPlatform ?? undefined,
      });

      const meRes = await getMe(res.accessToken);
      await setApiAuth(res.accessToken, meRes.user);
      console.log("[AUTH/xrun] user:", meRes.user);
      await hydrate();
    } catch (err) {
      let msg = "처리 중 오류가 발생했습니다.";
      if (err instanceof AuthApiError) {
        if (err.code === "OTP_EXPIRED") msg = "인증 코드가 만료됐습니다. 처음부터 다시 시도해주세요.";
        else if (err.code === "OTP_INVALID") msg = "잘못된 인증 코드입니다.";
        else if (err.code === "UNAUTHENTICATED") msg = "xrun 자격증명이 무효합니다.";
        else msg = err.message;
      }
      Alert.alert("오류", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeView backgroundColor={COLORS.zinc50}>
      <PageHeader title="가입 마지막 단계" showBackButton onBackPress={() => navigation.goBack()} />
      <SafeScrollView contentContainerStyle={styles.content} autoAdjustKeyboardPadding showBottomBackground={false}>
        <View style={styles.container}>
          <Text style={styles.title}>관심사와 약관 확인</Text>
          <Text style={styles.subtitle}>
            xrun 인증이 완료됐어요. 마지막으로 관심사와 약관을 확인해주세요.
          </Text>

          {}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>관심사 선택 (선택사항)</Text>
            <View style={styles.chipGrid}>
              {ALL_INTERESTS.map((interest) => (
                <InterestChip
                  key={interest}
                  label={interest}
                  selected={selectedInterests.includes(interest)}
                  onPress={() => toggleInterest(interest)}
                />
              ))}
            </View>
          </View>

          {}
          <View style={styles.terms}>
            <TouchableOpacity onPress={() => setAgreeRequired(!agreeRequired)} style={styles.checkRow}>
              <View style={[styles.checkbox, agreeRequired && styles.checkboxChecked]}>
                {agreeRequired && <Feather name="check" size={14} color={COLORS.white} />}
              </View>
              <Text style={styles.termText}>
                <Text style={styles.termBold}>(필수)</Text> 이용약관 및 개인정보 처리방침에 동의합니다
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleMarketing} disabled={requestingPush} style={styles.checkRow}>
              <View style={[styles.checkbox, agreeMarketing && styles.checkboxChecked]}>
                {agreeMarketing && <Feather name="check" size={14} color={COLORS.white} />}
              </View>
              <Text style={styles.termText}>
                <Text style={styles.termOptional}>(선택)</Text> 마케팅 정보 수신에 동의합니다
                {requestingPush ? " (권한 요청 중...)" : ""}
              </Text>
            </TouchableOpacity>
          </View>

          <Button
            title={submitting ? "가입 처리 중..." : "가입 완료"}
            onPress={handleComplete}
            disabled={submitting || !agreeRequired}
          />
        </View>
      </SafeScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, alignItems: "center", paddingHorizontal: SIZES.xlarge, paddingVertical: SIZES.xxlarge },
  container: { width: "100%", maxWidth: 780, gap: SIZES.medium },
  title: { fontSize: 20, fontWeight: "700", color: COLORS.zinc900, textAlign: "center", marginTop: SIZES.large },
  subtitle: { fontSize: 14, color: COLORS.zinc600, textAlign: "center", lineHeight: 22, marginBottom: SIZES.medium },
  section: { gap: 12 },
  sectionLabel: { fontSize: 14, fontWeight: "600", color: COLORS.zinc900 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  terms: { gap: 12, paddingTop: SIZES.medium },
  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.zinc300,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: COLORS.zinc900, borderColor: COLORS.zinc900 },
  termText: { flex: 1, fontSize: 13, color: COLORS.zinc600, lineHeight: 20 },
  termBold: { fontWeight: "600", color: COLORS.zinc900 },
  termOptional: { color: COLORS.zinc400 },
});
