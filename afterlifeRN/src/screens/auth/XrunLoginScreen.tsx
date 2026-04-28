import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
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
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleNext = async () => {
    if (!email || !pin) {
      Alert.alert("알림", "xrun 이메일과 비밀번호를 입력해주세요.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert("알림", "이메일 형식이 올바르지 않습니다.");
      return;
    }
    setSubmitting(true);
    try {
      await xrunVerify(email, pin);
      navigation.navigate("XrunOtp", { email, pin });
    } catch (err) {
      let msg = "xrun 검증에 실패했습니다.";
      let isConflict = false;
      if (err instanceof AuthApiError) {
        if (err.code === "UNAUTHENTICATED") msg = "xrun 이메일 또는 비밀번호가 올바르지 않습니다.";
        else if (err.code === "NOT_FOUND") msg = "xrun 계정을 찾을 수 없습니다.";
        else if (err.code === "CONFLICT") {
          msg = "이미 afterlife에 가입된 이메일입니다.\n로그인 화면에서 일반 로그인을 사용해주세요.";
          isConflict = true;
        } else msg = err.message;
      }
      if (isConflict) {
        Alert.alert("이미 가입된 이메일", msg, [
          { text: "확인", onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert("오류", msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeView backgroundColor={COLORS.zinc50}>
      <PageHeader title="Xrun으로 계속하기" showBackButton onBackPress={() => navigation.goBack()} />
      <SafeScrollView contentContainerStyle={styles.content} autoAdjustKeyboardPadding showBottomBackground={false}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Image source={require("../../../assets/images/symbol.png")} style={styles.symbol} />
            <Text style={styles.title}>Xrun 계정으로 계속</Text>
            <Text style={styles.subtitle}>
              Xrun에서 사용하시는 이메일과 비밀번호를{"\n"}입력해주세요. 인증 후 AfterLife에 연결됩니다.
            </Text>
          </View>

          <TextField
            placeholder="Xrun 이메일"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Feather name="mail" size={20} color={COLORS.zinc500} />}
          />
          <TextField
            placeholder="Xrun 비밀번호"
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
            title={submitting ? "확인 중..." : "다음 (OTP 전송)"}
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
