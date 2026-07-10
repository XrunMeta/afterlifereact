import { showAlert } from "../../stores/dialogStore";
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useTranslation } from "react-i18next";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";

import SafeView from "../../components/ui/SafeView";
import SafeScrollView from "../../components/ui/SafeScrollView";
import Button from "../../components/ui/Button";
import OtpVerifyView from "../../components/auth/OtpVerifyView";
import PageHeader from "../../components/common/PageHeader";
import { COLORS, SIZES, RADIUS } from "../../components/constants";
import { requestEmailCode, signup, AuthApiError } from "../../api/auth";
import { saveCallLearningConsent, saveFaceBiometricConsent } from "../../api/consent";

type Props = NativeStackScreenProps<AuthStackParamList, "EmailVerify">;

const RESEND_COOLDOWN_SEC = 60;

export default function EmailVerifyScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const params = route.params;
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resendIn, setResendIn] = useState(RESEND_COOLDOWN_SEC);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const t = setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, []);

  const handleResend = async () => {
    if (resendIn > 0) return;
    try {
      await requestEmailCode(params.email);
      setResendIn(RESEND_COOLDOWN_SEC);
      showAlert(t("auth.emailVerify.resend"), t("auth.emailVerify.resentToast"));
    } catch (err) {
      const msg =
        err instanceof AuthApiError ? err.message : t("common.error");
      showAlert(t("common.error"), msg);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      showAlert(t("common.notice"), t("auth.emailVerify.codePlaceholder"));
      return;
    }
    setSubmitting(true);
    try {

      const res = await signup({
        email: params.email,
        password: params.password,
        name: params.name,
        verificationCode: code,
        phone: params.phone,
        gender: params.gender,
        age: params.age,
        interests: params.interests,
        country: params.country,
        mobileCode: params.mobileCode,
        region: params.region,
        marketingConsent: params.marketingConsent,
        deviceId: params.deviceId,
        pushToken: params.pushToken,
        platform: params.platform,
      });

      if (params.agreeCallLearning) {
        try {
          await saveCallLearningConsent(res.accessToken, "granted", { channel: "signup" });
        } catch (err) {
          console.warn("[AUTH/signup] saveCallLearningConsent failed:", err);
        }
      }

      if (params.agreeFaceBiometric) {
        try {
          await saveFaceBiometricConsent(res.accessToken, "granted", { termsVersion: "v1", channel: "signup" });
        } catch (err) {
          console.warn("[AUTH/signup] saveFaceBiometricConsent failed:", err);
        }
      }

      console.log("[AUTH/signup] success, accessExpiresIn:", res.accessExpiresIn);
      navigation.replace("SignupComplete", {
        accessToken: res.accessToken,
        persist: true,
        email: params.email,
      });
    } catch (err) {
      let msg = t("auth.signup.signupFailed");
      if (err instanceof AuthApiError) {
        msg = err.message;
        if (err.code === "CONFLICT") {
          msg = t("auth.signup.alreadyExists");
        } else if (err.code === "OTP_EXPIRED") {
          msg = t("auth.emailVerify.expired");
        } else if (err.code === "OTP_INVALID") {
          msg = t("auth.emailVerify.wrongCode");
        } else if (err.code === "OTP_REQUIRED") {
          msg = t("auth.emailVerify.expired");
        } else if (err.code === "VALIDATION_FAILED" && Array.isArray(err.details)) {
          const fields = err.details
            .map((d: any) => `• ${(d.path ?? []).join(".")}: ${d.message}`)
            .join("\n");
          msg = `${msg}\n\n${fields}`;
        }
      }
      showAlert(t("common.error"), msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeView backgroundColor={COLORS.zinc50}>
      <PageHeader
        title={t("auth.emailVerify.title")}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <SafeScrollView
        contentContainerStyle={styles.content}
        autoAdjustKeyboardPadding
        showBottomBackground={false}
      >
        <OtpVerifyView
          title={t("auth.emailVerify.title")}
          subtitle={t("auth.emailVerify.desc", { email: params.email })}
          code={code}
          onChangeCode={setCode}
          onSubmit={handleVerify}
          submitting={submitting}
          submitLabel={t("auth.emailVerify.verifyBtn")}
          submittingLabel={t("auth.signup.verifying")}
          resendIn={resendIn}
          onResend={handleResend}
          resendLabel={t("auth.emailVerify.resend")}
        />
      </SafeScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: SIZES.xlarge,
    paddingVertical: SIZES.xxlarge,
  },
  container: {
    width: "100%",
    maxWidth: 480,
    gap: SIZES.large,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.zinc900,
    textAlign: "center",
    marginTop: SIZES.large,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.zinc600,
    textAlign: "center",
    lineHeight: 22,
  },
  email: {
    fontWeight: "600",
    color: COLORS.zinc900,
  },
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
  loadingRow: {
    alignItems: "center",
    marginTop: -8,
  },
  resendRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: SIZES.medium,
  },
  resendText: {
    fontSize: 14,
    color: COLORS.zinc500,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.zinc900,
  },
  resendLinkDisabled: {
    color: COLORS.zinc400,
  },
});
