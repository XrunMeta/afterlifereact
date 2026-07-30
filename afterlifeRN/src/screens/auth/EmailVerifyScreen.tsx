import { showAlert } from "../../stores/dialogStore";
import { activateAuthSession } from "../../lib/activateAuthSession";
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
import { requestEmailCode, signup, googleCheck, googleSignIn, AuthApiError } from "../../api/auth";
import { saveCallLearningConsent, saveFaceBiometricConsent } from "../../api/consent";
import { faceBiometricSignupState } from "./faceBiometricSignupFlag";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { getOrCreateDeviceId } from "../../lib/deviceId";
import { Platform } from "react-native";
import { useAuthConfigStore } from "../../stores/authConfigStore";
import { ensureGoogleConfigured } from "../../lib/googleAuth";

type Props = NativeStackScreenProps<AuthStackParamList, "EmailVerify">;

const RESEND_COOLDOWN_SEC = 60;

export default function EmailVerifyScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const params = route.params;
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resendIn, setResendIn] = useState(RESEND_COOLDOWN_SEC);
  const [resending, setResending] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const goToComplete = (accessToken: string, refreshToken?: string | null) => {
    void activateAuthSession({ accessToken, refreshToken, persist: true });
  };

  const promptGoogleLink = (accessToken: string, refreshToken?: string | null) => {
    showAlert(
      t("auth.emailVerify.googleLinkTitle", { defaultValue: "구글 계정 연동" }),
      t("auth.emailVerify.googleLinkDesc", {
        defaultValue:
          "가입하신 Gmail 계정을 Google 로그인과 연동하시겠어요?\n연동하면 다음부터 간편하게 로그인할 수 있습니다.",
      }),
      [
        {
          text: t("auth.emailVerify.later", { defaultValue: "나중에" }),
          style: "cancel",
          onPress: () => goToComplete(accessToken, refreshToken),
        },
        {
          text: t("auth.emailVerify.linkNow", { defaultValue: "연동하기" }),
          onPress: () => void tryGoogleLink(accessToken, refreshToken),
        },
      ],
    );
  };

  const tryGoogleLink = async (accessToken: string, refreshToken?: string | null) => {

    if (!ensureGoogleConfigured()) {
      goToComplete(accessToken, refreshToken);
      return;
    }
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      try {
        await GoogleSignin.signOut();
      } catch {

      }
      const userInfo = (await GoogleSignin.signIn()) as unknown as {
        idToken?: string | null;
        data?: { idToken?: string | null };
      };
      const idToken = userInfo?.idToken ?? userInfo?.data?.idToken;
      if (!idToken) {
        console.warn("[google-link] no idToken");
        goToComplete(accessToken, refreshToken);
        return;
      }

      const check = await googleCheck(idToken);
      const googleEmail = (check.email ?? "").toLowerCase();
      const signupEmail = params.email.toLowerCase();
      if (googleEmail !== signupEmail) {
        showAlert(
          t("common.notice"),
          t("auth.emailVerify.googleEmailMismatch", {
            defaultValue:
              "가입 시 입력하신 이메일과 구글 로그인 이메일이 다릅니다. 연동 없이 계속 진행합니다.",
          }),
          [{ text: t("common.confirm", { defaultValue: "확인" }), onPress: () => goToComplete(accessToken, refreshToken) }],
        );
        return;
      }

      const deviceId = await getOrCreateDeviceId();
      const gRes = await googleSignIn({
        idToken,
        deviceId,
        platform: Platform.OS === "ios" ? "ios" : "android",
      });
      goToComplete(gRes.accessToken, gRes.refreshToken ?? null);
    } catch (err: unknown) {
      const errAny = err as { code?: string };
      if (errAny?.code === statusCodes.SIGN_IN_CANCELLED) {
        goToComplete(accessToken, refreshToken);
        return;
      }
      console.warn("[google-link] failed:", err);
      goToComplete(accessToken, refreshToken);
    }
  };

  useEffect(() => {
    const t = setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, []);

  const handleResend = async () => {

    if (resendIn > 0 || resending) return;
    setResending(true);
    setResendIn(RESEND_COOLDOWN_SEC);
    try {
      await requestEmailCode(params.email);
      showAlert(t("auth.emailVerify.resend"), t("auth.emailVerify.resentToast"));
    } catch (err) {
      const msg =
        err instanceof AuthApiError ? err.message : t("common.error");
      showAlert(t("common.error"), msg);
    } finally {
      setResending(false);
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

      try {
        await saveFaceBiometricConsent(res.accessToken, faceBiometricSignupState(!!params.agreeFaceBiometric), {
          termsVersion: "v1",
          channel: "signup",
        });
      } catch (err) {
        console.warn("[AUTH/signup] saveFaceBiometricConsent failed:", err);
      }

      console.log("[AUTH/signup] success, accessExpiresIn:", res.accessExpiresIn);

      if (
        useAuthConfigStore.getState().googleEnabled === true &&
        params.email.toLowerCase().endsWith("@gmail.com")
      ) {
        promptGoogleLink(res.accessToken, res.refreshToken ?? null);
      } else {
        goToComplete(res.accessToken, res.refreshToken ?? null);
      }
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
