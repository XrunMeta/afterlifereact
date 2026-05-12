import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
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

export default function XrunOnboardingScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const GENDER_OPTIONS = [
    { value: "male" as const, label: t("auth.signup.male") },
    { value: "female" as const, label: t("auth.signup.female") },
    { value: "other" as const, label: t("auth.signup.other") },
  ];
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
      Alert.alert(t("common.notice"), t("auth.signup.requiredFields"));
      return false;
    }
    if (!trimmedPhone) {
      Alert.alert(t("common.notice"), t("auth.signup.phoneTooShort"));
      return false;
    }
    if (trimmedPhone.length < 4) {
      Alert.alert(t("common.notice"), t("auth.signup.phoneTooShort"));
      return false;
    }
    if (!gender) {
      Alert.alert(t("common.notice"), t("auth.signup.requiredFields"));
      return false;
    }
    if (!age) {
      Alert.alert(t("common.notice"), t("auth.signup.requiredFields"));
      return false;
    }
    const ageNum = parseInt(age, 10);
    if (Number.isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
      Alert.alert(t("common.notice"), t("auth.signup.ageInvalid"));
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
        Alert.alert(t("auth.signup.pushPermTitle"), t("auth.signup.pushPermDesc"));
        return;
      }
      const did = await getOrCreateDeviceId();
      setAgreeMarketing(true);
      setPushToken(reg.token ?? null);
      setPushPlatform(reg.platform);
      setDeviceId(did);
    } catch {
      Alert.alert(t("common.error"), t("auth.signup.pushPermError"));
    } finally {
      setRequestingPush(false);
    }
  };

  const handleNextToOtp = async () => {
    if (!agreeRequired) {
      Alert.alert(t("common.notice"), t("auth.signup.termsAccept"));
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
        ? err.code === "OTP_COOLDOWN" ? t("auth.signup.rateLimit") : err.message
        : t("auth.signup.sendCodeFailed");
      Alert.alert(t("common.error"), msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendIn > 0) return;
    try {
      await requestEmailCode(email);
      setResendIn(60);
      Alert.alert(t("auth.emailVerify.resend"), t("auth.emailVerify.resentToast"));
    } catch (err) {
      const msg = err instanceof AuthApiError ? err.message : t("common.error");
      Alert.alert(t("common.error"), msg);
    }
  };

  const handleComplete = async () => {
    if (google && step === 1) {
      if (!validateProfileInputs()) return;
      await handleNextToOtp();
      return;
    }
    if (!agreeRequired) {
      Alert.alert(t("common.notice"), t("auth.signup.termsAccept"));
      return;
    }
    if (!google && !validateProfileInputs()) return;
    if (google && otpCode.length !== 6) {
      Alert.alert(t("common.notice"), t("auth.emailVerify.codePlaceholder"));
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

      console.log("[AUTH/xrun] success");
      navigation.replace("SignupComplete", {
        accessToken: res.accessToken,
        persist: true,
        email,
      });
    } catch (err) {
      let msg = t("common.error");
      if (err instanceof AuthApiError) {
        if (err.code === "OTP_EXPIRED") msg = t("auth.emailVerify.expired");
        else if (err.code === "OTP_INVALID") msg = t("auth.emailVerify.wrongCode");
        else if (err.code === "UNAUTHENTICATED") msg = t("auth.login.invalidCredentials");
        else msg = err.message;
      }
      Alert.alert(t("common.error"), msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (google && step === 2) {
    return (
      <SafeView backgroundColor={COLORS.zinc50}>
        <PageHeader title={t("auth.emailVerify.title")} showBackButton onBackPress={() => setStep(1)} />
        <SafeScrollView contentContainerStyle={styles.content} autoAdjustKeyboardPadding showBottomBackground={false}>
          <View style={styles.container}>
            <Text style={styles.title}>{t("auth.emailVerify.title")}</Text>
            <Text style={styles.subtitle}>
              {t("auth.emailVerify.desc", { email })}
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
              title={submitting ? t("auth.signup.signingUp") : t("auth.xrun.submit")}
              onPress={handleComplete}
              disabled={submitting || otpCode.length !== 6}
            />
            <View style={styles.resendRow}>
              <TouchableOpacity onPress={handleResend} disabled={resendIn > 0}>
                <Text style={[styles.resendLink, resendIn > 0 && styles.resendLinkDisabled]}>
                  {resendIn > 0 ? `${t("auth.emailVerify.resend")} (${resendIn}s)` : t("auth.emailVerify.resend")}
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
      <PageHeader title={t("auth.xrun.onboardingTitle")} showBackButton onBackPress={() => navigation.goBack()} />
      <SafeScrollView contentContainerStyle={styles.content} autoAdjustKeyboardPadding showBottomBackground={false}>
        <View style={styles.container}>
          <Text style={styles.title}>{t("auth.xrun.onboardingTitle")}</Text>
          <Text style={styles.subtitle}>
            {google ? t("auth.xrun.googleOnboardingDesc") : t("auth.xrun.onboardingDesc")}
          </Text>

          {}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t("edit.basicSection")}</Text>
            <TextField
              placeholder={t("auth.signup.name")}
              value={name}
              onChangeText={setName}
              autoCapitalize="none"
            />
            <TextField
              placeholder={t("auth.signup.phone")}
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
                  placeholder={t("auth.signup.gender")}
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
            <Text style={styles.sectionLabel}>{t("auth.signup.interests")}</Text>
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
              <Text style={styles.termText}>{t("auth.signup.termsRequired")}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleMarketing} disabled={requestingPush} style={styles.checkRow}>
              <View style={[styles.checkbox, agreeMarketing && styles.checkboxChecked]}>
                {agreeMarketing && <Feather name="check" size={14} color={COLORS.white} />}
              </View>
              <Text style={styles.termText}>
                {t("auth.signup.marketingConsent")}
                {requestingPush ? ` (${t("auth.signup.verifying")})` : ""}
              </Text>
            </TouchableOpacity>
          </View>

          <Button
            title={
              submitting
                ? t("auth.xrun.submitting")
                : google
                  ? t("auth.xrun.next")
                  : t("auth.xrun.submit")
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
