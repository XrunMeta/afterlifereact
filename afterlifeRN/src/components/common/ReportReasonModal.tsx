

import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { COLORS, RADIUS } from "../constants";

interface Props {
  visible: boolean;
  targetName?: string;

  targetKind?: "clone" | "comment" | "post";
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

const MAX_LEN = 500;

export default function ReportReasonModal({
  visible,
  targetName,
  targetKind = "clone",
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const { height: SCREEN_H } = useWindowDimensions();

  useEffect(() => {
    if (visible) setReason("");
  }, [visible]);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => setKeyboardHeight(e.endCoordinates.height),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardHeight(0),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const submit = () => {
    Keyboard.dismiss();
    onConfirm(reason.trim());
  };

  const handleOverlayTap = () => {
    if (keyboardHeight > 0) {
      Keyboard.dismiss();
    } else {
      onCancel();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <Pressable style={styles.overlay} onPress={handleOverlayTap}>
          <Pressable
            style={[
              styles.box,

              Platform.OS === "android" && keyboardHeight > 0
                ? { marginBottom: Math.min(keyboardHeight - 24, SCREEN_H * 0.4) }
                : null,
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.iconWrap}>
              <Feather name="flag" size={24} color="#ef4444" />
            </View>
            {}
            <Text style={styles.title}>{
              targetKind === "comment" ? "댓글 신고하기"
              : targetKind === "post" ? "게시물 신고하기"
              : t("report.title", { defaultValue: "신고하기" })
            }</Text>
            <Text style={styles.desc}>
              {targetKind === "comment" ? (
                targetName
                  ? `'${targetName}' 님의 댓글을 신고하는 사유를 입력해 주세요.`
                  : "댓글을 신고하는 사유를 입력해 주세요."
              ) : targetKind === "post" ? (
                targetName
                  ? `'${targetName}' 님의 게시물을 신고하는 사유를 입력해 주세요.`
                  : "게시물을 신고하는 사유를 입력해 주세요."
              ) : (
                targetName
                  ? t("report.descWithName", {
                      name: targetName,
                      defaultValue: "'{{name}}' 클론을 신고하는 사유를\n간단히 입력해주세요. (선택)",
                    })
                  : t("report.descNoName", {
                      defaultValue: "클론을 신고하는 사유를\n간단히 입력해주세요. (선택)",
                    })
              )}
            </Text>
            <TextInput
              style={styles.input}
              value={reason}
              onChangeText={(v) => setReason(v.slice(0, MAX_LEN))}
              placeholder={t("report.placeholder", { defaultValue: "예: 부적절한 내용, 사칭, 스팸 등" })}
              placeholderTextColor={COLORS.zinc400}
              multiline
              numberOfLines={4}
              maxLength={MAX_LEN}
              textAlignVertical="top"
            />
            <Text style={styles.counter}>
              {reason.length}/{MAX_LEN}
            </Text>
            <View style={styles.btns}>
              <TouchableOpacity style={styles.cancel} onPress={onCancel}>
                <Text style={styles.cancelText}>{t("common.cancel", { defaultValue: "취소" })}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirm} onPress={submit}>
                <Text style={styles.confirmText}>{t("report.submit", { defaultValue: "신고하기" })}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.zinc900,
    marginBottom: 6,
  },
  desc: {
    fontSize: 13,
    color: COLORS.zinc600,
    marginBottom: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  input: {
    width: "100%",
    minHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    borderRadius: RADIUS.md,
    padding: 12,
    fontSize: 14,
    color: COLORS.zinc900,
    backgroundColor: COLORS.zinc50 ?? COLORS.zinc100,
  },
  counter: {
    alignSelf: "flex-end",
    fontSize: 11,
    color: COLORS.zinc400,
    marginTop: 4,
    marginBottom: 12,
  },
  btns: { flexDirection: "row", gap: 8, width: "100%" },
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
    backgroundColor: "#ef4444",
    alignItems: "center",
  },
  confirmText: { fontSize: 14, fontWeight: "700", color: COLORS.white },
});
