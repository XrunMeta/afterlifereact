

import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Keyboard,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { OtpCodeInput } from "../../../components/auth/OtpVerifyView";
import { COLORS, RADIUS } from "../../../components/constants";
import { useAuthStore } from "../../../stores/authStore";
import { useCloneStore } from "../../../stores/cloneStore";
import { listMyClones } from "../../../api/clones";
import { getXrunBalance } from "../../../api/payments";
import { API_BASE, API_BASE_PREVIEW } from "../../../config/apiBase";

const PERSONA_FULL_PRICE_XRUN = 100;

const TEST_PRICE_EMAIL = "oth-user@example.invalid";
const TEST_PRICE_XRUN = 0.05;

interface Props {

  onProceed: () => void;

  onCancel: () => void;
}

export default function PersonaCreationPaymentGate({ onProceed, onCancel }: Props) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const userEmail = useAuthStore((s) => s.apiUser?.email ?? null);
  const setCreationDraft = useCloneStore((s) => s.setCreationDraft);

  const PERSONA_PAID_PRICE_XRUN =
    userEmail === TEST_PRICE_EMAIL ? TEST_PRICE_XRUN : PERSONA_FULL_PRICE_XRUN;

  const [loading, setLoading] = useState(true);
  const [needPay, setNeedPay] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!accessToken) {

        if (!cancelled) {
          setLoading(false);
          onProceed();
        }
        return;
      }
      try {
        const res = await listMyClones(accessToken);
        if (cancelled) return;
        const count = res.items?.length ?? 0;
        if (count >= 1) {

          try {
            const bal = await getXrunBalance(accessToken);
            if (!cancelled) setBalance(bal.xrun ?? 0);
          } catch (balErr) {
            console.warn("[PaymentGate] balance fetch failed:", balErr);
            if (!cancelled) setBalance(null);
          }
          if (cancelled) return;
          setNeedPay(true);
          setLoading(false);
        } else {
          setLoading(false);
          onProceed();
        }
      } catch (err) {
        console.warn("[PaymentGate] listMyClones failed:", err);

        if (!cancelled) {
          setLoading(false);
          onProceed();
        }
      }
    })();
    return () => {
      cancelled = true;
    };

  }, [accessToken]);

  const insufficient =
    balance !== null && balance < PERSONA_PAID_PRICE_XRUN;

  const isPreviewEnv = API_BASE === API_BASE_PREVIEW;
  const blockInput = insufficient && !isPreviewEnv;

  const handleCancel = () => {
    console.log("[PaymentGate] cancel tapped");
    Keyboard.dismiss();
    onCancel();
  };

  const handleConfirm = () => {

    if (blockInput) return;
    if (pin.length !== 6) {
      setError("PIN 6자리를 입력해주세요.");
      return;
    }

    setCreationDraft({ pin });
    onProceed();
  };

  if (loading) {
    return (
      <View style={styles.fullCenter}>
        <ActivityIndicator color={COLORS.violet600} />
      </View>
    );
  }

  if (!needPay) return null; 

  return (
    <Modal visible transparent statusBarTranslucent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {
}
        <Pressable
          style={styles.overlay}
          onPress={() => {
            console.log("[PaymentGate] overlay tapped");
            Keyboard.dismiss();
          }}
        >
          <Pressable style={styles.box} onPress={(e) => e.stopPropagation()}>
            <View style={styles.iconWrap}>
              <Feather name="credit-card" size={26} color={COLORS.violet600} />
            </View>
            <Text style={styles.title}>클론 생성 결제</Text>
            <Text style={styles.desc}>
              두 번째 클론부터 {PERSONA_PAID_PRICE_XRUN} XRUN 이 부과돼요.{"\n"}
              결제 비밀번호 6자리를 입력해주세요.
            </Text>
            {balance !== null && (
              <Text style={[styles.balance, insufficient && styles.balanceLow]}>
                내 XRUN 잔액: {balance.toLocaleString()} XRUN
                {insufficient && " — 잔액 부족"}
              </Text>
            )}
            <View style={styles.pinWrap}>
              <OtpCodeInput
                value={pin}
                onChange={(v) => {
                  setPin(v);
                  setError(null);
                }}
                masked
                autoFocus={!blockInput}
                editable={!blockInput}
              />
            </View>
            {error && <Text style={styles.error}>{error}</Text>}
            <View style={styles.btns}>
              <TouchableOpacity
                style={styles.cancel}
                onPress={handleCancel}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirm,
                  (pin.length !== 6 || blockInput) && styles.disabled,
                ]}
                onPress={handleConfirm}
                disabled={pin.length !== 6 || blockInput}
              >
                <Text style={styles.confirmText}>
                  결제
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  box: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 24,
    alignItems: "center",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(167,139,250,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.zinc900,
    marginBottom: 6,
    textAlign: "center",
  },
  desc: {
    fontSize: 13,
    color: COLORS.zinc600,
    marginBottom: 16,
    textAlign: "center",
    lineHeight: 20,
  },
  balance: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.zinc700,
    marginBottom: 10,
  },
  balanceLow: {
    color: "#ef4444",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    borderRadius: RADIUS.md,
    padding: 12,
    fontSize: 18,
    textAlign: "center",
    letterSpacing: 4,
    color: COLORS.zinc900,
    marginBottom: 8,
  },
  inputDisabled: {
    backgroundColor: COLORS.zinc100,
    color: COLORS.zinc400,
  },

  pinWrap: { width: "100%", paddingVertical: 16 },
  error: { fontSize: 12, color: "#ef4444", marginTop: 4, marginBottom: 0 },
  btns: { flexDirection: "row", gap: 8, width: "100%", marginTop: 20 },
  cancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.zinc100,
    alignItems: "center",
  },
  cancelText: { fontSize: 14, fontWeight: "600", color: COLORS.zinc700 },
  confirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.violet600,
    alignItems: "center",
  },
  disabled: { opacity: 0.5 },
  confirmText: { fontSize: 14, fontWeight: "700", color: COLORS.white },
});
