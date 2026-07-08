

import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, RADIUS } from "../constants";

export const FACE_ENROLL_NAME_MAX_LENGTH = 30;

export const FACE_ENROLL_CONSENT_TEXT =
  "등록하면 얼굴 특징 정보(법률상 생체정보예요)가 저장되어 다음 통화에서 알아볼 수 있어요. " +
  "등록은 화면 속 분을 대신해 지금 통화 중인 회원님이 진행해요 — 그분께 꼭 알려주세요. " +
  "언제든 설정에서 삭제할 수 있어요.";

export interface FaceEnrollCardProps {
  visible: boolean;
  name: string;
  onChangeName: (name: string) => void;

  onConfirm: (name: string) => void;
  onDismiss: () => void;

  onViewPolicy: () => void;

  busy?: boolean;
}

export function FaceEnrollCard(props: FaceEnrollCardProps): React.ReactElement | null {
  const { visible, name, onChangeName, onConfirm, onDismiss, onViewPolicy, busy } = props;
  const insets = useSafeAreaInsets();
  if (!visible) return null;

  const trimmed = name.trim();
  const confirmDisabled = trimmed.length < 1 || !!busy;
  const dismissDisabled = !!busy;

  return (
    <View
      style={[styles.container, { bottom: insets.bottom + 112 }]}
      testID="face-enroll-card"
    >
      <Text style={styles.title}>이 분을 기억할까요?</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={onChangeName}
        maxLength={FACE_ENROLL_NAME_MAX_LENGTH}
        placeholder="이름"
        placeholderTextColor={COLORS.zinc400}
        testID="face-enroll-name-input"
      />
      <Text style={styles.consent}>
        {FACE_ENROLL_CONSENT_TEXT}{" "}
        <Text
          style={styles.policyLink}
          onPress={onViewPolicy}
          testID="face-enroll-policy-link"
        >
          개인정보처리방침 보기
        </Text>
      </Text>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.laterBtn}
          onPress={onDismiss}
          disabled={dismissDisabled}
          testID="face-enroll-dismiss-btn"
        >
          <Text style={styles.laterText}>나중에</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.confirmBtn, confirmDisabled && styles.confirmBtnDisabled]}
          onPress={() => {
            if (confirmDisabled) return;
            onConfirm(trimmed);
          }}
          disabled={confirmDisabled}
          testID="face-enroll-confirm-btn"
        >
          <Text style={styles.confirmText}>동의하고 등록</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,

    backgroundColor: COLORS.zinc900,
    borderRadius: RADIUS.lg,
    padding: 16,
    zIndex: 30, 
  },
  title: { fontSize: 16, fontWeight: "700", color: COLORS.white, marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.zinc700,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: COLORS.white,
    fontSize: 15,
    marginBottom: 10,
  },
  consent: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.zinc300,
    marginBottom: 14,
  },
  policyLink: {
    color: COLORS.violet200,
    textDecorationLine: "underline",
  },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
  laterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  laterText: { fontSize: 14, color: COLORS.zinc300 },
  confirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.violet500,
  },
  confirmBtnDisabled: { backgroundColor: COLORS.zinc700 },
  confirmText: { fontSize: 14, fontWeight: "700", color: COLORS.white },
});
