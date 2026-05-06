import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";

import SafeView from "../../components/ui/SafeView";
import SafeScrollView from "../../components/ui/SafeScrollView";
import TextField from "../../components/ui/TextField";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/common/PageHeader";
import { COLORS, SIZES } from "../../components/constants";
import { xrunVerify, AuthApiError } from "../../api/auth";

type Props = NativeStackScreenProps<AuthStackParamList, "XrunLogin">;

export default function XrunLoginScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleNext = async () => {
    if (!email || !pin) {
      Alert.alert(t("common.notice"), t("auth.signup.requiredFields"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert(t("common.notice"), t("auth.signup.emailInvalid"));
      return;
    }
    setSubmitting(true);
    try {
      await xrunVerify(email, pin);
      navigation.navigate("XrunOtp", { email, pin });
    } catch (err) {
      let msg = t("auth.login.loginFailed");
      let isConflict = false;
      if (err instanceof AuthApiError) {
        if (err.code === "UNAUTHENTICATED") msg = t("auth.login.invalidCredentials");
        else if (err.code === "NOT_FOUND") msg = t("auth.login.invalidCredentials");
        else if (err.code === "CONFLICT") {
          msg = t("auth.signup.alreadyExists");
          isConflict = true;
        } else msg = err.message;
      }
      if (isConflict) {
        Alert.alert(t("auth.signup.alreadyExists"), msg, [
          { text: t("common.ok"), onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert(t("common.error"), msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeView backgroundColor={COLORS.zinc50}>
      <PageHeader title={t("auth.login.xrunBtn")} showBackButton onBackPress={() => navigation.goBack()} />
      <SafeScrollView contentContainerStyle={styles.content} autoAdjustKeyboardPadding showBottomBackground={false}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Image source={require("../../../assets/images/symbol.png")} style={styles.symbol} />
            <Text style={styles.title}>{t("auth.xrun.loginTitle")}</Text>
            <Text style={styles.subtitle}>{t("auth.xrun.loginDesc")}</Text>
          </View>

          <TextField
            placeholder={t("auth.xrun.emailPlaceholder")}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Feather name="mail" size={20} color={COLORS.zinc500} />}
          />
          <TextField
            placeholder={t("auth.xrun.pinPlaceholder")}
            value={pin}
            onChangeText={setPin}
            secureTextEntry={!showPin}
            leftIcon={<Feather name="lock" size={20} color={COLORS.zinc500} />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPin(!showPin)}>
                <Feather name={showPin ? "eye-off" : "eye"} size={20} color={COLORS.zinc500} />
              </TouchableOpacity>
            }
          />

          <Button
            title={submitting ? t("auth.signup.verifying") : t("auth.xrun.next")}
            onPress={handleNext}
            disabled={submitting}
            style={{ marginTop: SIZES.medium }}
          />
        </View>
      </SafeScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, alignItems: "center", paddingHorizontal: SIZES.xlarge, paddingVertical: SIZES.xxlarge },
  container: { width: "100%", maxWidth: 480, gap: SIZES.medium },
  header: { alignItems: "center", marginBottom: SIZES.large },
  symbol: { width: 80, height: 64, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "700", color: COLORS.zinc900, marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.zinc600, textAlign: "center", lineHeight: 22 },
});
