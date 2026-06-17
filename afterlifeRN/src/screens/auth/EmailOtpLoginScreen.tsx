

import { showAlert } from "../../stores/dialogStore";
import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";

import SafeView from "../../components/ui/SafeView";
import SafeScrollView from "../../components/ui/SafeScrollView";
import PageHeader from "../../components/common/PageHeader";
import OtpVerifyView from "../../components/auth/OtpVerifyView";
import { COLORS, SIZES } from "../../components/constants";
import { useAuthStore } from "../../stores/authStore";
import { AuthApiError, requestEmailLoginCode, emailLogin, getMe } from "../../api/auth";
import { getOrCreateDeviceId } from "../../lib/deviceId";

const AUTO_LOGIN_PREF_KEY = "@afterlifeRN/auth/autoLoginPref";
const LAST_EMAIL_KEY = "@afterlifeRN/auth/lastEmail";

type Props = NativeStackScreenProps<AuthStackParamList, "EmailOtpLogin">;

const RESEND_COOLDOWN_SEC = 60;

export default function EmailOtpLoginScreen({ navigation, route }: Props) {
  const { email, autoLogin } = route.params;
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resendIn, setResendIn] = useState(RESEND_COOLDOWN_SEC);

  const hydrate = useAuthStore((s) => s.hydrate);
  const setApiAuth = useAuthStore((s) => s.setApiAuth);
  const setApiTokens = useAuthStore((s) => s.setApiTokens);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  const handleResend = async () => {
    if (resendIn > 0) return;
    try {
      await requestEmailLoginCode(email);
      setCode("");
      setResendIn(RESEND_COOLDOWN_SEC);
      showAlert("인증코드 재발송", "이메일로 코드를 다시 보냈어요.");
    } catch (err) {
      const msg = err instanceof AuthApiError ? err.message : "코드 재발송에 실패했어요.";
      showAlert("오류", msg);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setSubmitting(true);
    try {
      const deviceId = await getOrCreateDeviceId();
      const res = await emailLogin({ email, verificationCode: code, deviceId });
      const meRes = await getMe(res.accessToken);
      await setApiAuth(res.accessToken, meRes.user, { persist: autoLogin });
      const rt = (res as { refreshToken?: string }).refreshToken;
      if (rt) await setApiTokens(res.accessToken, rt, { persist: autoLogin });
      if (autoLogin) {
        await AsyncStorage.setItem(AUTO_LOGIN_PREF_KEY, "1");
        await AsyncStorage.setItem(LAST_EMAIL_KEY, email);
      } else {
        await AsyncStorage.removeItem(AUTO_LOGIN_PREF_KEY);
        await AsyncStorage.removeItem(LAST_EMAIL_KEY);
      }
      await hydrate();
    } catch (err) {
      let msg = "로그인에 실패했어요.";
      if (err instanceof AuthApiError) {
        if (err.code === "ACCOUNT_DELETED") {
          showAlert("로그인 실패", "이미 탈퇴한 계정이에요.");
          return;
        }
        if (err.code === "OTP_INVALID") msg = "인증코드가 올바르지 않아요.";
        else if (err.code === "OTP_EXPIRED") msg = "인증코드가 만료됐어요. 다시 받아주세요.";
        else if (err.code === "NOT_FOUND") msg = "가입된 이메일이 아니에요.";
        else msg = err.message;
      }
      showAlert("로그인 실패", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeView backgroundColor={COLORS.zinc50}>
      <PageHeader title="이메일 OTP 로그인" showBackButton onBackPress={() => navigation.goBack()} />
      <SafeScrollView
        contentContainerStyle={styles.content}
        autoAdjustKeyboardPadding
        showBottomBackground={false}
      >
        <View style={styles.container}>
          <OtpVerifyView
            title="이메일 OTP 로그인"
            email={email}
            code={code}
            onChangeCode={setCode}
            onSubmit={handleVerify}
            submitting={submitting}
            submitLabel="로그인"
            submittingLabel="로그인 중..."
            resendIn={resendIn}
            onResend={handleResend}
            resendLabel="코드 재발송"
          />
        </View>
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
  container: { width: "100%", maxWidth: 480 },
});
