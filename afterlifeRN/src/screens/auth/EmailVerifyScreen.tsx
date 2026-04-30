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
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";

import SafeView from "../../components/ui/SafeView";
import SafeScrollView from "../../components/ui/SafeScrollView";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/common/PageHeader";
import { COLORS, SIZES, RADIUS } from "../../components/constants";
import { requestEmailCode, signup, getMe, AuthApiError } from "../../api/auth";
import { useAuthStore } from "../../stores/authStore";

type Props = NativeStackScreenProps<AuthStackParamList, "EmailVerify">;

const RESEND_COOLDOWN_SEC = 60;

export default function EmailVerifyScreen({ navigation, route }: Props) {
  const params = route.params;
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resendIn, setResendIn] = useState(RESEND_COOLDOWN_SEC);
  const inputRef = useRef<TextInput>(null);
  const setApiAuth = useAuthStore((s) => s.setApiAuth);

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
      Alert.alert("재발송", "인증 코드를 다시 보냈습니다. 메일함을 확인하세요.");
    } catch (err) {
      const msg =
        err instanceof AuthApiError ? err.message : "재발송에 실패했습니다.";
      Alert.alert("오류", msg);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert("알림", "6자리 인증 코드를 입력해주세요.");
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
        marketingConsent: params.marketingConsent,
        deviceId: params.deviceId,
        pushToken: params.pushToken,
        platform: params.platform,
      });

      const meRes = await getMe(res.accessToken);
      await setApiAuth(res.accessToken, meRes.user);
      console.log("[AUTH/signup] user:", meRes.user, "accessExpiresIn:", res.accessExpiresIn);

      Alert.alert("가입 완료", "회원가입이 완료되었습니다.", [
        { text: "확인", onPress: () => navigation.navigate("Login") },
      ]);
    } catch (err) {
      let msg = "가입 처리 중 오류가 발생했습니다.";
      if (err instanceof AuthApiError) {
        msg = err.message;

        if (/public breaches/i.test(err.message)) {
          msg = "보안상 사용할 수 없는 비밀번호입니다. 다른 비밀번호를 사용해주세요.";
        } else if (err.code === "CONFLICT") {
          msg = "이미 가입된 이메일입니다. 로그인을 진행해주세요.";
        } else if (err.code === "OTP_EXPIRED") {
          msg = "인증 코드가 만료됐습니다. 재발송을 눌러 새 코드를 받아주세요.";
        } else if (err.code === "OTP_INVALID") {
          const left = err.message.match(/(\d+)\s*attempts? left/)?.[1];
          msg = left
            ? `잘못된 인증 코드입니다. (${left}회 시도 가능)`
            : "인증 코드를 너무 많이 틀렸습니다. 재발송 받아 다시 시도해주세요.";
        } else if (err.code === "OTP_REQUIRED") {
          msg = "인증 코드가 만료됐거나 폐기됐습니다. 재발송을 눌러주세요.";
        } else if (err.code === "VALIDATION_FAILED" && Array.isArray(err.details)) {

          const fields = err.details
            .map((d: any) => `• ${(d.path ?? []).join(".")}: ${d.message}`)
            .join("\n");
          msg = `${msg}\n\n${fields}`;
        }
      }
      Alert.alert("오류", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeView backgroundColor={COLORS.zinc50}>
      <PageHeader
        title="이메일 인증"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <SafeScrollView
        contentContainerStyle={styles.content}
        autoAdjustKeyboardPadding
        showBottomBackground={false}
      >
        <View style={styles.container}>
          <Text style={styles.title}>이메일로 코드를 보냈어요</Text>
          <Text style={styles.subtitle}>
            <Text style={styles.email}>{params.email}</Text>
            {"\n"}메일함의 6자리 인증 코드를 입력해주세요. (5분간 유효)
          </Text>

          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="000000"
            placeholderTextColor={COLORS.zinc300}
            style={styles.codeInput}
            editable={!submitting}
            autoFocus
          />

          <Button
            title={submitting ? "처리 중..." : "인증하고 가입 완료"}
            onPress={handleVerify}
            disabled={submitting || code.length !== 6}
          />
          {submitting && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={COLORS.zinc500} />
            </View>
          )}

          <View style={styles.resendRow}>
            <Text style={styles.resendText}>코드를 못 받으셨나요?</Text>
            <TouchableOpacity onPress={handleResend} disabled={resendIn > 0}>
              <Text
                style={[
                  styles.resendLink,
                  resendIn > 0 && styles.resendLinkDisabled,
                ]}
              >
                {resendIn > 0 ? `재발송 (${resendIn}s)` : "재발송"}
              </Text>
            </TouchableOpacity>
          </View>
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
