

import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../../stores/authStore";
import { listUserFollowing, type UserFollowItem } from "../../../api/users";
import Button from "../../../components/ui/Button";
import SwipeDownSheet from "../../../components/ui/SwipeDownSheet";
import { COLORS, RADIUS, SIZES } from "../../../components/constants";

interface Props {
  visible: boolean;

  initialSelected?: number[];
  onClose: () => void;
  onConfirm: (userIds: number[]) => void;
}

export default function FriendPickerModal({
  visible,
  initialSelected = [],
  onClose,
  onConfirm,
}: Props) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const myUserId = useAuthStore((s) => s.apiUser?.id ?? s.user?.id ?? null);
  const insets = useSafeAreaInsets();

  const bottomPad = Math.max(insets.bottom, Platform.OS === "android" ? 24 : 12);

  const [following, setFollowing] = useState<UserFollowItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set(initialSelected));

  useEffect(() => {
    if (!visible) return;
    setSelected(new Set(initialSelected));
    if (!accessToken || !myUserId) {
      setFollowing([]);
      return;
    }
    setLoading(true);
    listUserFollowing(accessToken, myUserId)
      .then((res) => setFollowing(res.items))
      .catch((err) => {
        console.warn("[FriendPicker] fetch following failed:", err);
        setFollowing([]);
      })
      .finally(() => setLoading(false));

  }, [visible, accessToken, myUserId]);

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      <Pressable style={s.overlay} onPress={onClose}>
        <SwipeDownSheet
          onClose={onClose}
          style={[s.box, { paddingBottom: bottomPad }]}
        >
          <View style={s.handle} />
          <Text style={s.title}>특정 친구에게만 공개</Text>
          <Text style={s.desc}>
            내가 팔로우 중인 사람 중에 공개할 친구를 선택하세요.
          </Text>

          {loading ? (
            <ActivityIndicator style={{ paddingVertical: 24 }} color={COLORS.zinc500} />
          ) : following.length === 0 ? (
            <View style={s.empty}>
              <Feather name="users" size={32} color={COLORS.zinc300} />
              <Text style={s.emptyText}>아직 팔로우 중인 사람이 없어요</Text>
            </View>
          ) : (
            <ScrollView style={s.list} keyboardShouldPersistTaps="handled">
              {following.map((u) => {
                const checked = selected.has(u.userId);
                return (
                  <TouchableOpacity
                    key={u.userId}
                    style={s.row}
                    onPress={() => toggle(u.userId)}
                    activeOpacity={0.7}
                  >
                    {u.avatarUrl ? (
                      <Image source={{ uri: u.avatarUrl }} style={s.avatar} />
                    ) : (
                      <View style={[s.avatar, s.avatarPh]}>
                        <Feather name="user" size={18} color={COLORS.zinc400} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={s.name} numberOfLines={1}>
                        {u.name ?? u.email}
                      </Text>
                      <Text style={s.email} numberOfLines={1}>
                        {u.email}
                      </Text>
                    </View>
                    <View style={[s.check, checked && s.checkOn]}>
                      {checked && <Feather name="check" size={14} color={COLORS.white} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <View style={s.actions}>
            <Button title="취소" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
            <Button
              title={`확인 (${selected.size}명)`}
              variant="primary"
              onPress={() => onConfirm(Array.from(selected))}
              style={{ flex: 1 }}
            />
          </View>
        </SwipeDownSheet>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  box: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: SIZES.large,
    paddingTop: 12,

    maxHeight: "85%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.zinc300,
    alignSelf: "center",
    marginBottom: 12,
  },
  title: { fontSize: 17, fontWeight: "700", color: COLORS.zinc900, marginBottom: 4 },
  desc: { fontSize: 13, color: COLORS.zinc500, marginBottom: 12 },
  list: { maxHeight: 360 },
  empty: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 13, color: COLORS.zinc500 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarPh: {
    backgroundColor: COLORS.zinc100,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 14, fontWeight: "600", color: COLORS.zinc900 },
  email: { fontSize: 12, color: COLORS.zinc500, marginTop: 2 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: COLORS.zinc300,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },
  checkOn: {
    backgroundColor: COLORS.violet600,
    borderColor: COLORS.violet600,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
});

void RADIUS;
