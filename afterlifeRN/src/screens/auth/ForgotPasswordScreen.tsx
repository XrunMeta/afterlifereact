

import { showAlert } from "../../stores/dialogStore";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { Feather } from "@expo/vector-icons";
import SafeView from "../../components/ui/SafeView";
import PageHeader from "../../components/common/PageHeader";
import { COLORS, RADIUS } from "../../components/constants";
import type { AuthStackParamList } from "../../navigation/types";
import {
  AuthApiError,
  requestPasswordReset,
  resetPassword,
} from "../../api/auth";

type Step = "email" | "otp" | "password";

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSendCode = async () => {
    const e = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(e)) {
      showAlert("알림", "이메일 형식이 올바르지 않아요.");
      return;
    }
    setSubmitting(true);
    try {
      await requestPasswordReset(e);
      showAlert(t("auth.forgot.title"), t("auth.forgot.codeSent"));
      setStep("otp");
    } catch (err) {
      const msg =
        err instanceof AuthApiError && err.code === "OTP_COOLDOWN"
          ? err.message
          : t("auth.forgot.resetFailed");
      showAlert("오류", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyCode = () => {
    if (!/^\d{6}$/.test(code.trim())) {
      showAlert("알림", t("auth.forgot.wrongCode"));
      return;
    }

    setStep("password");
  };

  const handleSavePassword = async () => {

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{7,}$/.test(password)) {
      showAlert("알림", t("auth.forgot.passwordTooShort"));
      return;
    }
    if (password !== passwordConfirm) {
      showAlert("알림", t("auth.forgot.passwordMismatch"));
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword({
        email: email.trim().toLowerCase(),
        verificationCode: code.trim(),
        newPassword: password,
      });
      showAlert(t("auth.forgot.successTitle"), t("auth.forgot.successDesc"), [
        { text: "확인", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      let msg = t("auth.forgot.resetFailed");
      if (err instanceof AuthApiError) {
        if (err.code === "OTP_INVALID") msg = t("auth.forgot.wrongCode");
        else if (err.code === "OTP_EXPIRED") {
          msg = t("auth.forgot.expiredCode");
          setStep("email");
        } else if (err.code === "NOT_FOUND") msg = t("auth.forgot.notFound");
        else if (err.message) msg = err.message;
      }
      showAlert("오류", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeView backgroundColor={COLORS.white}>
      <PageHeader
        title={t("auth.forgot.title")}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <View style={s.body}>
        {step === "email" && (
          <>
            <Text style={s.desc}>{t("auth.forgot.step1Desc")}</Text>
            <View style={s.inputRow}>
              <Feather name="mail" size={18} color={COLORS.zinc500} style={s.inputIcon} />
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                placeholder={t("auth.forgot.emailPlaceholder")}
                placeholderTextColor={COLORS.placeholder}
                autoCapitalize="none"
                keyboardType="email-address"
                autoFocus
              />
            </View>
            <TouchableOpacity
              style={[s.primaryBtn, (submitting || !email.trim()) && s.btnDisabled]}
              disabled={submitting || !email.trim()}
              onPress={handleSendCode}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={s.primaryBtnText}>{t("auth.forgot.sendCode")}</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {step === "otp" && (
          <>
            <Text style={s.desc}>{t("auth.forgot.step2Desc")}</Text>
            <Text style={s.emailHint}>{email}</Text>
            <View style={s.inputRow}>
              <Feather name="lock" size={18} color={COLORS.zinc500} style={s.inputIcon} />
              <TextInput
                style={[s.input, { letterSpacing: 4, fontSize: 16 }]}
                value={code}
                onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
                placeholder={t("auth.forgot.codePlaceholder")}
                placeholderTextColor={COLORS.placeholder}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
            </View>
            <TouchableOpacity
              style={[s.primaryBtn, code.length !== 6 && s.btnDisabled]}
              disabled={code.length !== 6}
              onPress={handleVerifyCode}
            >
              <Text style={s.primaryBtnText}>{t("auth.forgot.verify")}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSendCode} disabled={submitting} style={s.secondaryBtn}>
              <Text style={s.secondaryBtnText}>
                {submitting ? t("auth.forgot.sendingCode") : t("auth.forgot.sendCode")}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {step === "password" && (
          <>
            <Text style={s.desc}>{t("auth.forgot.step3Desc")}</Text>
            <View style={s.inputRow}>
              <Feather name="key" size={18} color={COLORS.zinc500} style={s.inputIcon} />
              <TextInput
                style={s.input}
                value={password}
                onChangeText={setPassword}
                placeholder={t("auth.forgot.newPasswordPlaceholder")}
                placeholderTextColor={COLORS.placeholder}
                secureTextEntry
                autoFocus
              />
            </View>
            <View style={s.inputRow}>
              <Feather name="key" size={18} color={COLORS.zinc500} style={s.inputIcon} />
              <TextInput
                style={s.input}
                value={passwordConfirm}
                onChangeText={setPasswordConfirm}
                placeholder={t("auth.forgot.confirmPasswordPlaceholder")}
                placeholderTextColor={COLORS.placeholder}
                secureTextEntry
              />
            </View>
            <TouchableOpacity
              style={[s.primaryBtn, (submitting || !password || !passwordConfirm) && s.btnDisabled]}
              disabled={submitting || !password || !passwordConfirm}
              onPress={handleSavePassword}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={s.primaryBtnText}>{t("auth.forgot.save")}</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeView>
  );
}

const s = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 24, gap: 16 },
  desc: { fontSize: 14, color: COLORS.zinc600, lineHeight: 20 },
  emailHint: {
    fontSize: 13,
    color: COLORS.zinc900,
    fontFamily: "monospace",
    backgroundColor: COLORS.zinc100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.zinc50,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    height: 48,
    fontSize: 14,
    color: COLORS.zinc900,
  },
  primaryBtn: {
    height: 50,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.zinc900,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  primaryBtnText: { fontSize: 15, fontWeight: "700", color: COLORS.white },
  btnDisabled: { backgroundColor: COLORS.zinc300 },
  secondaryBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryBtnText: { fontSize: 13, color: COLORS.zinc500 },
});
