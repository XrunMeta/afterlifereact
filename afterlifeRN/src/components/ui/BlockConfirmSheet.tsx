

import React from "react";
import {
  Modal,
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../constants";

interface Props {
  visible: boolean;
  userName: string;
  userAvatarUrl?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

interface RowProps {
  icon: React.ComponentProps<typeof Feather>["name"];
  text: string;
}

const InfoRow: React.FC<RowProps> = ({ icon, text }) => (
  <View style={styles.row}>
    <Feather name={icon} size={24} color="#000000" style={{ marginTop: 2 }} />
    <Text style={styles.rowText}>{text}</Text>
  </View>
);

export default function BlockConfirmSheet({ visible, userName, userAvatarUrl, onCancel, onConfirm }: Props) {
  const { height } = useWindowDimensions();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={[styles.sheet, { maxHeight: height * 0.85 }]} onPress={(e) => e.stopPropagation?.()}>
          <View style={styles.handle} />

          {}
          <View style={styles.avatarWrap}>
            {userAvatarUrl ? (
              <Image source={{ uri: userAvatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Feather name="user" size={32} color={COLORS.zinc400} />
              </View>
            )}
          </View>

          {}
          <Text style={styles.title}>{userName} 님을{'\n'}차단하시겠어요?</Text>

          {}
          <Text style={styles.subtitle}>
            이 사람이 만든 다른 프로필과 앞으로 만드는 모든 프로필이 함께 차단됩니다.
          </Text>

          {}
          <View style={styles.infoList}>
            <InfoRow
              icon="slash"
              text="차단된 사람은 회원님에게 댓글을 작성하거나 회원님의 프로필 · 콘텐츠를 찾을 수 없게 됩니다."
            />
            <InfoRow
              icon="bell-off"
              text="상대방에게는 회원님이 차단한 사실을 알리지 않습니다."
            />
            <InfoRow
              icon="settings"
              text="마이페이지 > 차단 사용자 관리에서 언제든지 차단을 해제할 수 있습니다."
            />
          </View>

          {}
          <Pressable
            style={({ pressed }) => [styles.confirmBtn, pressed && { opacity: 0.85 }]}
            onPress={onConfirm}
          >
            <Text style={styles.confirmBtnText}>차단</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.zinc300,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  avatarWrap: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.zinc100,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.zinc700,
    lineHeight: 20,
    marginBottom: 24,
  },
  infoList: {
    gap: 18,
    marginBottom: 32,
  },
  row: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  rowText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.zinc700,
    lineHeight: 20,
  },
  confirmBtn: {
    backgroundColor: "#6366f1",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
  },
});
