import { showAlert } from "../../stores/dialogStore";
import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput } from "react-native";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
      showAlert(t("auth.emailVerify.resend"), t("auth.emailVerify.resentToast"));
    } catch (err) {
      const msg = err instanceof AuthApiError ? err.message : t("common.error");
      showAlert(t("common.error"), msg);
    }
  };

  const handleNext = () => {
    if (code.length !== 6) {
      showAlert(t("common.notice"), t("auth.emailVerify.codePlaceholder"));
      return;
    }
    navigation.navigate("XrunOnboarding", { email, pin, verificationCode: code });
  };

  return (
    <SafeView backgroundColor={COLORS.zinc50}>
      <PageHeader title={t("auth.xrun.otpTitle")} showBackButton onBackPress={() => navigation.goBack()} />
      <SafeScrollView contentContainerStyle={styles.content} autoAdjustKeyboardPadding showBottomBackground={false}>
        <View style={styles.container}>
          <Text style={styles.title}>{t("auth.xrun.otpTitle")}</Text>
          <Text style={styles.subtitle}>
            {t("auth.xrun.otpDesc")}
            {"\n"}<Text style={styles.email}>{email}</Text>
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

          <Button title={t("auth.xrun.next")} onPress={handleNext} disabled={code.length !== 6} />

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
