

import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Pressable,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { COLORS, RADIUS } from "../constants";
import { useAuthStore } from "../../stores/authStore";

const STORAGE_KEY = "afterlife_payment_pin_dismissed_until";
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000;
const XRUN_SCHEME = "xrun://";

function buildXrunDeeplink(email: string | null | undefined): string {
  if (!email) return XRUN_SCHEME;
  return `${XRUN_SCHEME}?email=${encodeURIComponent(email)}&from=afterlife`;
}

export async function shouldShowPaymentPinPrompt(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return true;
    const until = Number(raw);
    if (!Number.isFinite(until)) return true;
    return Date.now() >= until;
  } catch {
    return true;
  }
}

async function dismissForADay(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, String(Date.now() + DISMISS_DURATION_MS));
  } catch (err) {
    console.warn("[PIN-PROMPT] dismiss save failed:", err);
  }
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function PaymentPinPromptModal({ visible, onClose }: Props) {
  const email = useAuthStore((s) => s.apiUser?.email ?? null);

  const handleOpenXrun = async () => {

    if (email) {
      try {
        await Clipboard.setStringAsync(email);
        console.log("[PIN-PROMPT] email copied to clipboard");
      } catch (err) {
        console.warn("[PIN-PROMPT] clipboard set failed:", err);
      }
    }

    const deeplink = buildXrunDeeplink(email);
    try {
      await Linking.openURL(deeplink);
      onClose();
    } catch (err) {
      console.warn("[PIN-PROMPT] open xrun failed:", err);

      const storeUrl =
        Platform.OS === "ios"
          ? "https://apps.apple.com/app/xrun/id1602489406"
          : "https://play.google.com/store/apps/details?id=run.xrun.xrunapp";
      try {
        await Linking.openURL(storeUrl);
      } catch {

      }
      onClose();
    }
  };

  const handleDismiss = async () => {
    await dismissForADay();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.card} onPress={(e) => e.stopPropagation()}>
          <View style={s.iconCircle}>
            <Feather name="lock" size={28} color={COLORS.violet500} />
          </View>
          <Text style={s.title}>결제 비밀번호를 설정해주세요</Text>
          <Text style={s.body}>
            xrun 앱에서 6자리 결제 비밀번호를 등록해야 결제 기능을 사용할 수 있어요.
          </Text>

          <TouchableOpacity style={s.primaryBtn} onPress={handleOpenXrun}>
            <Feather name="external-link" size={16} color={COLORS.white} />
            <Text style={s.primaryBtnText}>xrun 앱에서 설정하기</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.secondaryBtn} onPress={handleDismiss}>
            <Text style={s.secondaryBtnText}>오늘은 그만 보기</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 28,
    alignItems: "center",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.violet100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.zinc900,
    textAlign: "center",
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: COLORS.zinc600,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.zinc900,
    marginBottom: 8,
  },
  primaryBtnText: { fontSize: 15, fontWeight: "700", color: COLORS.white },
  secondaryBtn: {
    width: "100%",
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryBtnText: { fontSize: 14, color: COLORS.zinc500, fontWeight: "500" },
});
