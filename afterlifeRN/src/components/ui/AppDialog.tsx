

import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
import { useDialogStore, type DialogButton } from "../../stores/dialogStore";
import { COLORS, RADIUS } from "../constants";

export default function AppDialog() {
  const { visible, title, message, subMessage, buttons, key, close, messageAlign } = useDialogStore();

  const handlePress = (btn: DialogButton) => {
    close();

    setTimeout(() => {
      try {
        btn.onPress?.();
      } catch (err) {
        console.warn("[AppDialog] onPress threw:", err);
      }
    }, 0);
  };

  const stacked = buttons.length >= 3;

  return (
    <Modal
      key={key}
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={close}
      statusBarTranslucent
    >
      <Pressable
        style={styles.overlay}

        onPress={() => {}}
      >
        <View style={styles.box} onStartShouldSetResponder={() => true}>
          <Text style={styles.title}>{title}</Text>
          {message ? (
            <Text style={[styles.message, messageAlign === "left" && { textAlign: "left" }]}>{message}</Text>
          ) : null}
          {subMessage ? <Text style={styles.subMessage}>{subMessage}</Text> : null}
          <View
            style={[
              styles.btnRow,
              stacked && { flexDirection: "column", gap: 8 },
            ]}
          >
            {buttons.map((btn, idx) => {
              const isCancel = btn.style === "cancel";
              const isDestructive = btn.style === "destructive";
              const btnStyle = isCancel
                ? styles.cancel
                : isDestructive
                  ? styles.destructive
                  : styles.confirm;
              const textStyle = isCancel
                ? styles.cancelText
                : styles.confirmText;
              return (
                <TouchableOpacity
                  key={`${idx}-${btn.text}`}
                  style={[btnStyle, { flex: stacked ? undefined : 1 }]}
                  activeOpacity={0.85}
                  onPress={() => handlePress(btn)}
                >
                  <Text style={textStyle}>{btn.text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  box: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 20,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.zinc900,
    textAlign: "center",

    marginBottom: 20,
  },
  message: {
    fontSize: 14,
    color: COLORS.zinc600,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 6,
  },

  subMessage: {
    fontSize: 11,
    color: COLORS.zinc400,
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 14,
  },
  btnRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },

  confirm: {
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.violet600,
    alignItems: "center",
  },
  confirmText: { color: COLORS.white, fontSize: 15, fontWeight: "700" },

  destructive: {
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: "#ef4444",
    alignItems: "center",
  },

  cancel: {
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    alignItems: "center",
  },
  cancelText: { color: COLORS.zinc700, fontSize: 15, fontWeight: "600" },
});
