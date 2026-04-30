import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import SafeScrollView from "../../components/ui/SafeScrollView";
import PageHeader from "../../components/common/PageHeader";
import { COLORS, RADIUS } from "../../components/constants";
import { useAuthStore } from "../../stores/authStore";
import { verifyPaymentPin } from "../../api/payments";
import { AuthApiError } from "../../api/auth";

const PIN_LENGTH = 6;
const MAX_ATTEMPTS = 5;
const XRUN_DEEPLINK = "xrun://";

export default function PaymentPinScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const accessToken = useAuthStore((s) => s.accessToken);

  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [locked, setLocked] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handlePress = (digit: string) => {
    if (locked) return;
    setError(null);
    if (digit === "del") {
      setPin((p) => {
        const next = p.slice(0, -1);
        console.log("[PIN] del → length:", next.length);
        return next;
      });
      return;
    }
    if (pin.length >= PIN_LENGTH) {
      console.log("[PIN] ignored (already full)");
      return;
    }
    setPin((p) => {
      const next = p + digit;
      console.log("[PIN] press:", digit, "→ length:", next.length);
      return next;
    });
  };

  const handleVerify = async () => {
    console.log("[PIN] verify clicked, len:", pin.length, "attemptsLeft:", attemptsLeft);
    if (pin.length !== PIN_LENGTH || verifying) return;
    if (!accessToken) {
      Alert.alert("알림", "로그인이 필요합니다.");
      return;
    }
    setVerifying(true);
    try {
      const result = await verifyPaymentPin(accessToken, pin);
      console.log("[PIN] verify result:", result);

      if (!result.hasPin) {

        setLocked(true);
        return;
      }
      if (result.match) {
        Alert.alert("확인", "비밀번호가 확인되었습니다.");
        navigation.goBack();
        return;
      }
      const next = attemptsLeft - 1;
      console.log("[PIN] wrong → attemptsLeft:", next);
      setAttemptsLeft(next);
      setPin("");
      if (next <= 0) {
        console.log("[PIN] LOCKED");
        setLocked(true);
      } else {
        setError(t("settings.paymentPin.wrong"));
      }
    } catch (err) {
      console.log("[PIN] verify error:", err);
      let msg = "검증 중 오류가 발생했습니다.";
      if (err instanceof AuthApiError) {
        if (err.code === "CONFLICT") msg = "xrun 회원 매핑이 안 되어 있습니다.";
        else msg = err.message;
      }
      setError(msg);
      setPin("");
    } finally {
      setVerifying(false);
    }
  };

  const handleOpenXrun = async () => {
    console.log("[PIN] open xrun:", XRUN_DEEPLINK);
    const can = await Linking.canOpenURL(XRUN_DEEPLINK);
    console.log("[PIN] canOpenURL:", can);
    if (can) {
      await Linking.openURL(XRUN_DEEPLINK);
    } else {
      Alert.alert("알림", "xrun 앱이 설치되어 있지 않습니다.");
    }
  };

  const numpadKeys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["", "0", "del"],
  ];

  return (
    <SafeScrollView backgroundColor={COLORS.white} showBottomBackground={false}>
      <PageHeader
        title={t("settings.paymentPin.title")}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <View style={s.content}>
        {locked ? (
          <View style={s.lockedBox}>
            <Feather name="alert-triangle" size={48} color={COLORS.error} />
            <Text style={s.lockedTitle}>{t("settings.paymentPin.lockedTitle")}</Text>
            <Text style={s.lockedDesc}>{t("settings.paymentPin.lockedDesc")}</Text>
            <TouchableOpacity style={s.openBtn} onPress={handleOpenXrun}>
              <Feather name="external-link" size={16} color={COLORS.white} />
              <Text style={s.openBtnText}>{t("settings.paymentPin.openXrun")}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={s.subtitle}>{t("settings.paymentPin.subtitle")}</Text>

            <View style={s.dotsRow}>
              {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                <View
                  key={i}
                  style={[s.dot, i < pin.length && s.dotFilled]}
                />
              ))}
            </View>

            {error ? (
              <Text style={s.errorText}>{error}</Text>
            ) : (
              <Text style={s.attemptsText}>
                {t("settings.paymentPin.attemptsLeft", { count: attemptsLeft })}
              </Text>
            )}

            <View style={s.numpad}>
              {numpadKeys.map((row, ri) => (
                <View key={ri} style={s.numpadRow}>
                  {row.map((key, ki) => (
                    <TouchableOpacity
                      key={`${ri}-${ki}`}
                      style={[s.numKey, !key && s.numKeyEmpty]}
                      onPress={() => key && handlePress(key)}
                      disabled={!key}
                    >
                      {key === "del" ? (
                        <Feather name="delete" size={22} color={COLORS.zinc900} />
                      ) : (
                        <Text style={s.numKeyText}>{key}</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[s.verifyBtn, (pin.length !== PIN_LENGTH || verifying) && s.verifyBtnDisabled]}
              onPress={handleVerify}
              disabled={pin.length !== PIN_LENGTH || verifying}
            >
              {verifying ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={s.verifyBtnText}>{t("settings.paymentPin.verify")}</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeScrollView>
  );
}

const s = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    maxWidth: 480,
    alignSelf: "center",
    width: "100%",
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.zinc600,
    textAlign: "center",
    marginBottom: 32,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 16,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.zinc300,
    backgroundColor: COLORS.white,
  },
  dotFilled: {
    backgroundColor: COLORS.zinc900,
    borderColor: COLORS.zinc900,
  },
  attemptsText: {
    fontSize: 12,
    color: COLORS.zinc500,
    textAlign: "center",
    marginBottom: 24,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.error,
    textAlign: "center",
    marginBottom: 24,
  },
  numpad: { gap: 12, marginBottom: 24 },
  numpadRow: { flexDirection: "row", gap: 12, justifyContent: "center" },
  numKey: {
    flex: 1,
    aspectRatio: 1.6,
    maxWidth: 96,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.zinc50,
    alignItems: "center",
    justifyContent: "center",
  },
  numKeyEmpty: { backgroundColor: "transparent" },
  numKeyText: { fontSize: 24, fontWeight: "600", color: COLORS.zinc900 },
  verifyBtn: {
    paddingVertical: 16,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.zinc900,
    alignItems: "center",
  },
  verifyBtnDisabled: { backgroundColor: COLORS.zinc300 },
  verifyBtnText: { fontSize: 15, fontWeight: "700", color: COLORS.white },
  lockedBox: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  lockedTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.zinc900,
    marginTop: 8,
  },
  lockedDesc: {
    fontSize: 14,
    color: COLORS.zinc600,
    textAlign: "center",
    marginBottom: 16,
  },
  openBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.zinc900,
  },
  openBtnText: { fontSize: 15, fontWeight: "700", color: COLORS.white },
});
