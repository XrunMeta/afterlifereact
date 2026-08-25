

import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
} from "react-native";
import { COLORS, RADIUS } from "../constants";

export interface RememberMeSheetProps {
  visible: boolean;

  saving?: boolean;

  error?: string | null;
  onSubmit: (name: string, relation: string) => void;
  onDismiss: () => void;
}

export default function RememberMeSheet({
  visible,
  saving = false,
  error = null,
  onSubmit,
  onDismiss,
}: RememberMeSheetProps) {
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");

  const [keyboardUp, setKeyboardUp] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setKeyboardUp(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardUp(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      setName("");
      setRelation("");
    }
  }, [visible]);

  const trimmedName = name.trim();
  const canSubmit = trimmedName.length > 0 && !saving;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      {

}
      <Pressable
        testID="remember-me-backdrop"
        style={styles.backdropTouch}
        onPress={() => {
          if (keyboardUp) {
            Keyboard.dismiss();
            return;
          }
          onDismiss();
        }}
        accessibilityLabel="닫기"
      />
      <KeyboardAvoidingView
        style={styles.backdrop}
        pointerEvents="box-none"

        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {
}
        <View style={styles.cardWrapper} pointerEvents="box-none">
        <View style={styles.card} testID="remember-me-sheet">
          <Text style={styles.title}>이 분은 누구신가요?</Text>
          <Text style={styles.desc}>
            알려주시면 다음 통화부터 기억할게요.
          </Text>

          <Text style={styles.label}>이름</Text>
          <TextInput
            testID="remember-me-name"
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="예: 지호"
            placeholderTextColor="#9ca3af"
            autoFocus
            returnKeyType="next"
            editable={!saving}
          />

          <Text style={styles.label}>관계</Text>
          <TextInput
            testID="remember-me-relation"
            style={styles.input}
            value={relation}
            onChangeText={setRelation}
            placeholder="예: 손주, 오랜 친구"
            placeholderTextColor="#9ca3af"
            returnKeyType="done"
            editable={!saving}
            onSubmitEditing={() => canSubmit && onSubmit(trimmedName, relation.trim())}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.row}>
            <Pressable
              testID="remember-me-dismiss"
              accessibilityRole="button"
              onPress={onDismiss}
              disabled={saving}
              style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && styles.pressed]}
            >
              <Text style={styles.btnGhostText}>나중에</Text>
            </Pressable>
            <Pressable
              testID="remember-me-submit"
              accessibilityRole="button"
              onPress={() => onSubmit(trimmedName, relation.trim())}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.btn,
                styles.btnPrimary,
                !canSubmit && styles.btnDisabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.btnPrimaryText}>{saving ? "저장 중…" : "저장"}</Text>
            </Pressable>
          </View>
        </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({

  backdropTouch: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,

    justifyContent: "flex-end",
    alignItems: "center",
    padding: 24,
  },
  cardWrapper: {
    width: "100%",
    maxWidth: 380,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#18181b",
    borderRadius: RADIUS.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  title: { color: COLORS.white, fontSize: 19, fontWeight: "800" },
  desc: { color: "#a1a1aa", fontSize: 13, marginTop: 6, marginBottom: 14 },
  label: { color: "#d4d4d8", fontSize: 12, marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: "#27272a",
    color: COLORS.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  error: { color: "#f87171", fontSize: 12, marginTop: 10 },
  row: { flexDirection: "row", gap: 10, marginTop: 18 },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    alignItems: "center",
  },
  btnGhost: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#3f3f46" },
  btnGhostText: { color: "#d4d4d8", fontSize: 15, fontWeight: "600" },
  btnPrimary: { backgroundColor: "#2563eb" },
  btnPrimaryText: { color: COLORS.white, fontSize: 15, fontWeight: "700" },
  btnDisabled: { opacity: 0.45 },
  pressed: { opacity: 0.75 },
});
