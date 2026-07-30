

import { showAlert } from "../../stores/dialogStore";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Feather } from "@expo/vector-icons";
import SafeView from "../../components/ui/SafeView";
import OtpVerifyView from "../../components/auth/OtpVerifyView";
import PageHeader from "../../components/common/PageHeader";
import { COLORS, RADIUS } from "../../components/constants";
import {
  AuthApiError,
  requestPasswordReset,
  resetPassword,
} from "../../api/auth";

type Step = "email" | "otp" | "password";

type Params = { email?: string } | undefined;

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ key: Params }, "key">>();
  const initialEmail = (route.params as { email?: string } | undefined)?.email;
  const lockEmail = !!initialEmail;

  const [step, setStep] = useState<Step>(initialEmail ? "otp" : "email");
  const [email, setEmail] = useState(initialEmail ?? "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSendCode = async () => {
    const e = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(e)) {
      showAlert(t("common.notice"), t("common.emailInvalid"));
      return;
    }
    setSubmitting(true);
    try {
      await requestPasswordReset(e);
      showAlert(t("auth.forgot.title"), t("auth.forgot.codeSent"));
      setStep("otp");
    } catch (err) {
      let msg = t("auth.forgot.resetFailed");
      if (err instanceof AuthApiError && err.code === "OTP_COOLDOWN") {

        const match = err.message.match(/(\d+)\s*s/);
        const secs = match ? match[1] : "";
        msg = secs
          ? t("auth.forgot.cooldown", { secs })
          : t("auth.signup.rateLimit");
      }
      showAlert(t("common.error"), msg);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!initialEmail) return;
    void handleSendCode();

  }, []);

  const handleVerifyCode = () => {
    if (!/^\d{6}$/.test(code.trim())) {
      showAlert(t("common.notice"), t("auth.forgot.wrongCode"));
      return;
    }

    setStep("password");
  };

  const handleSavePassword = async () => {

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{7,}$/.test(password)) {
      showAlert(t("common.notice"), t("auth.forgot.passwordTooShort"));
      return;
    }
    if (password !== passwordConfirm) {
      showAlert(t("common.notice"), t("auth.forgot.passwordMismatch"));
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
        { text: t("common.confirm"), onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      let msg = t("auth.forgot.resetFailed");
      if (err instanceof AuthApiError) {
        if (err.code === "OTP_INVALID") msg = t("auth.forgot.wrongCode");
        else if (err.code === "OTP_EXPIRED") {
          msg = t("auth.forgot.expiredCode");

          if (!lockEmail) setStep("email");
          else setStep("otp");
        } else if (err.code === "NOT_FOUND") msg = t("auth.forgot.notFound");
        else if (err.code === "VALIDATION_FAILED") {

          msg = t("auth.forgot.passwordTooShort");
        }

      }
      showAlert(t("common.error"), msg);
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
                autoFocus={!lockEmail}
                editable={!lockEmail}
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
          <OtpVerifyView
            title={t("auth.forgot.title")}
            subtitle={t("auth.forgot.step2Desc")}
            email={email}
            code={code}
            onChangeCode={(v) => setCode(v)}
            onSubmit={handleVerifyCode}
            submitting={false}
            submitLabel={t("auth.forgot.verify")}
            resendIn={0}
            onResend={handleSendCode}
            resendLabel={t("auth.forgot.sendCode")}
          />
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
                secureTextEntry={!showPassword}
                autoFocus
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={8}
                accessibilityLabel={t("auth.forgot.togglePasswordLabel")}
                style={s.toggleBtn}
              >
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={18}
                  color={COLORS.zinc500}
                />
              </TouchableOpacity>
            </View>
            <View style={s.inputRow}>
              <Feather name="key" size={18} color={COLORS.zinc500} style={s.inputIcon} />
              <TextInput
                style={s.input}
                value={passwordConfirm}
                onChangeText={setPasswordConfirm}
                placeholder={t("auth.forgot.confirmPasswordPlaceholder")}
                placeholderTextColor={COLORS.placeholder}
                secureTextEntry={!showPasswordConfirm}
              />
              <TouchableOpacity
                onPress={() => setShowPasswordConfirm((v) => !v)}
                hitSlop={8}
                accessibilityLabel={t("auth.forgot.toggleConfirmLabel")}
                style={s.toggleBtn}
              >
                <Feather
                  name={showPasswordConfirm ? "eye-off" : "eye"}
                  size={18}
                  color={COLORS.zinc500}
                />
              </TouchableOpacity>
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
  toggleBtn: { paddingHorizontal: 6, paddingVertical: 8 },
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
