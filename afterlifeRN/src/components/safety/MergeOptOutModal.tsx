import React from "react";
import { View, Text, StyleSheet, Modal, Pressable } from "react-native";
import Button from "../ui/Button";
import { COLORS, RADIUS, SIZES } from "../constants";

interface Props {
  visible: boolean;
  sourceCloneName: string;
  targetCloneName: string;
  deadlineAt: string; 
  onDecision: (decision: "agree" | "decline") => void;
  onDismiss: () => void;
}

export default function MergeOptOutModal({
  visible,
  sourceCloneName,
  targetCloneName,
  deadlineAt,
  onDecision,
  onDismiss,
}: Props) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onDismiss}>
      <Pressable style={s.backdrop} onPress={onDismiss}>
        <Pressable style={s.card} onPress={() => {}}>
          <Text style={s.title}>클론 병합 확인 필요</Text>
          <Text style={s.body}>
            <Text style={s.highlight}>{sourceCloneName}</Text>이(가)
            <Text style={s.highlight}> {targetCloneName}</Text>와 병합될 예정입니다.
            {"\n\n"}
            병합 결과 원본 클론은 아카이브(archived_merged)되고 새로운 통합 클론이 생성됩니다.
            공유자 전원의 응답이 필요하며, 기한({new Date(deadlineAt).toLocaleString("ko-KR")})까지
            응답이 없으면 <Text style={s.highlight}>기본값(비동의)</Text>으로 처리됩니다.
            {"\n\n"}
            원본 클론은 복구 가능한 상태로 보존되므로, 추후 이의를 제기할 수 있습니다.
          </Text>

          <View style={s.btnRow}>
            <Button title="동의" onPress={() => onDecision("agree")} />
            <View style={{ height: 10 }} />
            <Button title="거절" variant="ghost" onPress={() => onDecision("decline")} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: SIZES.large,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SIZES.large,
    width: "100%",
    maxWidth: 440,
  },
  title: { fontSize: 18, fontWeight: "700", color: COLORS.zinc900, marginBottom: 12 },
  body: { fontSize: 14, lineHeight: 22, color: COLORS.zinc700 },
  highlight: { fontWeight: "700", color: COLORS.zinc900 },
  btnRow: { marginTop: 20 },
});
