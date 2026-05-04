import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";

import SafeView from "../../components/ui/SafeView";
import SafeScrollView from "../../components/ui/SafeScrollView";
import Button from "../../components/ui/Button";
import InterestChip from "../../components/ui/InterestChip";
import TextField from "../../components/ui/TextField";
import SelectField from "../../components/ui/SelectField";
import PageHeader from "../../components/common/PageHeader";
import { COLORS, SIZES, RADIUS } from "../../components/constants";
import { ALL_INTERESTS } from "../../mocks/interestHelpers";
import { xrunComplete, requestEmailCode, AuthApiError, getMe } from "../../api/auth";
import { useAuthStore } from "../../stores/authStore";
import { requestPushPermission } from "../../lib/pushNotifications";
import { getOrCreateDeviceId } from "../../lib/deviceId";

type Props = NativeStackScreenProps<AuthStackParamList, "XrunOnboarding">;

const GENDER_OPTIONS = [
  { value: "male" as const, label: "남성" },
  { value: "female" as const, label: "여성" },
  { value: "other" as const, label: "기타" },
];

export default function XrunOnboardingScreen({ navigation, route }: Props) {
  const { email } = route.params;
  const pin = "pin" in route.params ? route.params.pin : undefined;
  const verificationCode =
    "verificationCode" in route.params ? route.params.verificationCode : undefined;
  const google = "google" in route.params ? route.params.google : undefined;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
  const [age, setAge] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [agreeRequired, setAgreeRequired] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [requestingPush, setRequestingPush] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [pushPlatform, setPushPlatform] = useState<"ios" | "android" | "web" | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [step, setStep] = useState<1 | 2>(1);
  const [otpCode, setOtpCode] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const otpInputRef = useRef<TextInput>(null);

  const setApiAuth = useAuthStore((s) => s.setApiAuth);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    if (step !== 2 || resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [step, resendIn]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
    );
  };

  const validateProfileInputs = (): boolean => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedName) {
      Alert.alert("알림", "이름을 입력해주세요.");
      return false;
    }
    if (!trimmedPhone) {
      Alert.alert("알림", "전화번호를 입력해주세요.");
      return false;
    }
    if (trimmedPhone.length < 4) {
      Alert.alert("알림", "전화번호는 4자 이상이어야 합니다.");
      return false;
    }
    if (!gender) {
      Alert.alert("알림", "성별을 선택해주세요.");
      return false;
    }
    if (!age) {
      Alert.alert("알림", "나이를 입력해주세요.");
      return false;
    }
    const ageNum = parseInt(age, 10);
    if (Number.isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
      Alert.alert("알림", "나이는 13~120 사이여야 합니다.");
      return false;
    }
    return true;
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

  const handleNextToOtp = async () => {
    if (!agreeRequired) {
      Alert.alert("알림", "이용약관에 동의해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      await requestEmailCode(email);
      setStep(2);
      setResendIn(60);
      setTimeout(() => otpInputRef.current?.focus(), 200);
    } catch (err) {
      const msg = err instanceof AuthApiError
        ? err.code === "OTP_COOLDOWN" ? "잠시 후 다시 시도해주세요. (1분 쿨다운)" : err.message
        : "코드 발송에 실패했습니다.";
      Alert.alert("오류", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendIn > 0) return;
    try {
      await requestEmailCode(email);
      setResendIn(60);
      Alert.alert("재발송", "인증 코드를 다시 보냈습니다.");
    } catch (err) {
      const msg = err instanceof AuthApiError ? err.message : "재발송 실패";
      Alert.alert("오류", msg);
    }
  };

  const handleComplete = async () => {
    if (google && step === 1) {

      if (!validateProfileInputs()) return;
      await handleNextToOtp();
      return;
    }
    if (!agreeRequired) {
      Alert.alert("알림", "이용약관에 동의해주세요.");
      return;
    }
    if (!google && !validateProfileInputs()) return;
    if (google && otpCode.length !== 6) {
      Alert.alert("알림", "6자리 인증 코드를 입력해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await xrunComplete({
        email,
        pin,
        verificationCode: google ? otpCode : verificationCode,
        googleIdToken: google?.idToken,
        name: name.trim(),
        phone: phone.trim(),
        gender: gender || undefined,
        age: parseInt(age, 10),
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

  if (google && step === 2) {
    return (
      <SafeView backgroundColor={COLORS.zinc50}>
        <PageHeader title="이메일 인증" showBackButton onBackPress={() => setStep(1)} />
        <SafeScrollView contentContainerStyle={styles.content} autoAdjustKeyboardPadding showBottomBackground={false}>
          <View style={styles.container}>
            <Text style={styles.title}>이메일로 코드를 보냈어요</Text>
            <Text style={styles.subtitle}>
              <Text style={styles.email}>{email}</Text>
              {"\n"}메일함의 6자리 인증 코드를 입력해주세요. (5분간 유효)
            </Text>
            <TextInput
              ref={otpInputRef}
              value={otpCode}
              onChangeText={(t) => setOtpCode(t.replace(/\D/g, "").slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="000000"
              placeholderTextColor={COLORS.zinc300}
              style={styles.codeInput}
              autoFocus
            />
            <Button
              title={submitting ? "가입 처리 중..." : "가입 완료"}
              onPress={handleComplete}
              disabled={submitting || otpCode.length !== 6}
            />
            <View style={styles.resendRow}>
              <Text style={styles.resendText}>코드를 못 받으셨나요?</Text>
              <TouchableOpacity onPress={handleResend} disabled={resendIn > 0}>
                <Text style={[styles.resendLink, resendIn > 0 && styles.resendLinkDisabled]}>
                  {resendIn > 0 ? `재발송 (${resendIn}s)` : "재발송"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeScrollView>
      </SafeView>
    );
  }

  return (
    <SafeView backgroundColor={COLORS.zinc50}>
      <PageHeader title="가입 마지막 단계" showBackButton onBackPress={() => navigation.goBack()} />
      <SafeScrollView contentContainerStyle={styles.content} autoAdjustKeyboardPadding showBottomBackground={false}>
        <View style={styles.container}>
          <Text style={styles.title}>가입 정보 입력</Text>
          <Text style={styles.subtitle}>
            {google ? "Google 인증이 완료됐어요." : "xrun 인증이 완료됐어요."} afterlife 가입에 필요한 정보를 입력해주세요.
          </Text>

          {}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>기본 정보</Text>
            <TextField
              placeholder="이름"
              value={name}
              onChangeText={setName}
              autoCapitalize="none"
            />
            <TextField
              placeholder="전화번호"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={20}
            />
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <SelectField<"male" | "female" | "other">
                  options={GENDER_OPTIONS}
                  value={gender || null}
                  onChange={(v) => setGender(v ?? "")}
                  placeholder="성별"
                />
              </View>
              <View style={styles.ageField}>
                <TextField
                  placeholder="나이"
                  value={age}
                  onChangeText={(v) => setAge(v.replace(/\D/g, "").slice(0, 3))}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
            </View>
          </View>

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
            title={
              submitting
                ? "처리 중..."
                : google
                  ? "다음 (이메일 인증)"
                  : "가입 완료"
            }
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
  row: { flexDirection: "row", gap: 12 },
  ageField: { width: 100 },
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
  email: { fontWeight: "600", color: COLORS.zinc900 },
  codeInput: {
    height: 64,
    borderWidth: 1,
    borderColor: COLORS.zinc300,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    textAlign: "center",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 12,
    color: COLORS.zinc900,
    paddingHorizontal: SIZES.large,
  },
  resendRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, marginTop: SIZES.medium },
  resendText: { fontSize: 14, color: COLORS.zinc500 },
  resendLink: { fontSize: 14, fontWeight: "600", color: COLORS.zinc900 },
  resendLinkDisabled: { color: COLORS.zinc400 },
});
