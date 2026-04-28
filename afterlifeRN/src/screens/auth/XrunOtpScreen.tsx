import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";

import SafeView from "../../components/ui/SafeView";
import SafeScrollView from "../../components/ui/SafeScrollView";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/common/PageHeader";
import { COLORS, SIZES, RADIUS } from "../../components/constants";
import { xrunVerify, AuthApiError } from "../../api/auth";

type Props = NativeStackScreenProps<AuthStackParamList, "XrunOtp">;

const RESEND_COOLDOWN_SEC = 60;

export default function XrunOtpScreen({ navigation, route }: Props) {
  const { email, pin } = route.params;
  const [code, setCode] = useState("");
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
      await xrunVerify(email, pin); 
      setResendIn(RESEND_COOLDOWN_SEC);
      Alert.alert("재발송", "인증 코드를 다시 보냈습니다.");
    } catch (err) {
      const msg = err instanceof AuthApiError ? err.message : "재발송 실패";
      Alert.alert("오류", msg);
    }
  };

  const handleNext = () => {
    if (code.length !== 6) {
      Alert.alert("알림", "6자리 인증 코드를 입력해주세요.");
      return;
    }
    navigation.navigate("XrunOnboarding", { email, pin, verificationCode: code });
  };

  return (
    <SafeView backgroundColor={COLORS.zinc50}>
      <PageHeader title="이메일 인증" showBackButton onBackPress={() => navigation.goBack()} />
      <SafeScrollView contentContainerStyle={styles.content} autoAdjustKeyboardPadding showBottomBackground={false}>
        <View style={styles.container}>
          <Text style={styles.title}>이메일로 코드를 보냈어요</Text>
          <Text style={styles.subtitle}>
            <Text style={styles.email}>{email}</Text>
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
            autoFocus
          />

          <Button title="다음" onPress={handleNext} disabled={code.length !== 6} />

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

const styles = StyleSheet.create({
  content: { flexGrow: 1, alignItems: "center", paddingHorizontal: SIZES.xlarge, paddingVertical: SIZES.xxlarge },
  container: { width: "100%", maxWidth: 480, gap: SIZES.large },
  title: { fontSize: 22, fontWeight: "700", color: COLORS.zinc900, textAlign: "center", marginTop: SIZES.large },
  subtitle: { fontSize: 14, color: COLORS.zinc600, textAlign: "center", lineHeight: 22 },
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
