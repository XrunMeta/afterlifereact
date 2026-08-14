

import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { COLORS, RADIUS } from "../constants";

export interface RememberMeButtonProps {
  visible: boolean;
  onPress: () => void;
}

export default function RememberMeButton({ visible, onPress }: RememberMeButtonProps) {
  if (!visible) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Remember Me"
      testID="remember-me-button"
      onPress={onPress}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}

    >
      <Text style={styles.label}>Remember Me!</Text>
      <Text style={styles.sub}>이름을 알려주세요</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: "absolute",
    left: 12,

    top: "38%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    backgroundColor: "rgba(37, 99, 235, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",

    zIndex: 60,
    elevation: 24,
  },
  pressed: { opacity: 0.75 },
  label: { color: COLORS.white, fontSize: 15, fontWeight: "800" },
  sub: { color: "rgba(255,255,255,0.85)", fontSize: 11, marginTop: 2 },
});
