

import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../constants";

interface Props {
  visible: boolean;
  targetKind?: "comment" | "clone" | "post";
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}

const REASONS = [
  "마음에 들지 않습니다",
  "따돌림 또는 원치 않는 연락",
  "자살, 자해 및 섭식 장애",
  "나체 이미지 또는 성적 행위",
  "혐오 발언 또는 상징",
  "폭력 또는 학대",
  "규제 품목의 판매 또는 홍보",
  "스캠, 사기 또는 스팸",
  "거짓 정보",
];

export default function ReportReasonSheet({ visible, targetKind = "comment", onCancel, onConfirm }: Props) {
  const { height } = useWindowDimensions();

  const insets = useSafeAreaInsets();
  const targetWord = targetKind === "comment" ? "댓글" : targetKind === "post" ? "게시물" : "클론";
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable
          style={[styles.sheet, { maxHeight: height * 0.92 }]}
          onPress={(e) => e.stopPropagation?.()}
        >
          {}
          <View style={styles.header}>
            <View style={{ width: 40 }} />
            <Text style={styles.headerTitle}>신고하기</Text>
            <Pressable onPress={onCancel} hitSlop={8}>
              <Feather name="x" size={26} color="#000000" />
            </Pressable>
          </View>

          <View style={styles.divider} />

          <ScrollView showsVerticalScrollIndicator={false}>
            {}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>이 {targetWord}을 신고하는 이유</Text>
              <Text style={styles.sectionDesc}>
                회원님의 신고는 익명으로 처리됩니다. 누군가 위급한 상황에 있다고 생각된다면 즉시 현지 응급 서비스 기관에 연락하시기 바랍니다.
              </Text>
            </View>

            {}
            <View>
              {REASONS.map((r) => (
                <Pressable
                  key={r}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                  onPress={() => onConfirm(r)}
                  android_ripple={{ color: "rgba(0,0,0,0.05)" }}
                >
                  <Text style={styles.rowText}>{r}</Text>
                  <Feather name="chevron-right" size={20} color={COLORS.zinc400} />
                </Pressable>
              ))}
            </View>

            <View style={{ height: 32 + Math.max(insets.bottom, 0) }} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.zinc200,
  },
  section: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 12,
    textAlign: "center",
  },
  sectionDesc: {
    fontSize: 13,
    color: COLORS.zinc600,
    lineHeight: 18,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  rowPressed: {
    backgroundColor: COLORS.zinc50 ?? "#f4f4f5",
  },
  rowText: {
    fontSize: 15,
    color: "#000000",
    fontWeight: "500",
  },
});
