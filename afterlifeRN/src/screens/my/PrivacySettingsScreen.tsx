

import { showAlert } from "../../stores/dialogStore";
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import SafeScrollView from "../../components/ui/SafeScrollView";
import PageHeader from "../../components/common/PageHeader";
import { COLORS, RADIUS } from "../../components/constants";
import type { MyStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../stores/authStore";
import {
  listMyBlocks,
  unblockClone,
  type BlockedClone,
} from "../../api/clones";

export default function PrivacySettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MyStackParamList>>();
  const accessToken = useAuthStore((s) => s.accessToken);
  const { t } = useTranslation();

  const [items, setItems] = useState<BlockedClone[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!accessToken) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await listMyBlocks(accessToken);
      setItems(res.items);
    } catch (err) {
      console.warn("[Privacy] listMyBlocks failed:", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const handleUnblock = (item: BlockedClone) => {
    showAlert(
      "차단 해제",
      `${item.clone.name} 차단을 해제하시겠어요?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "해제",
          onPress: async () => {
            if (!accessToken) return;
            setUnblockingId(item.clone.id);
            try {
              await unblockClone(accessToken, item.clone.id);
              setItems((prev) => prev.filter((b) => b.clone.id !== item.clone.id));
            } catch (err) {
              const msg = err instanceof Error ? err.message : "해제에 실패했어요.";
              showAlert("오류", msg);
            } finally {
              setUnblockingId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeScrollView backgroundColor={COLORS.white} showBottomBackground={false}>
      <PageHeader
        title={t("settings.privacy.title")}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <View style={s.content}>
        {loading ? (
          <ActivityIndicator color={COLORS.zinc500} style={{ paddingTop: 60 }} />
        ) : items.length === 0 ? (
          <View style={s.empty}>
            <Feather name="slash" size={36} color={COLORS.zinc300} />
            <Text style={s.emptyText}>차단한 클론이 없어요</Text>
            <Text style={s.emptySub}>
              클론 메뉴에서 차단할 수 있어요
            </Text>
          </View>
        ) : (
          <View style={s.card}>
            {items.map((it, i) => (
              <View key={it.blockId}>
                <View style={s.row}>
                  {it.clone.avatarUrl ? (
                    <Image source={{ uri: it.clone.avatarUrl }} style={s.avatar} />
                  ) : (
                    <View style={[s.avatar, s.avatarPh]}>
                      <Feather name="user" size={20} color={COLORS.zinc400} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowName} numberOfLines={1}>
                      {it.clone.name}
                    </Text>
                    <Text style={s.rowSub} numberOfLines={1}>
                      @{it.clone.username}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      s.unblockBtn,
                      unblockingId === it.clone.id && { opacity: 0.6 },
                    ]}
                    onPress={() => handleUnblock(it)}
                    disabled={unblockingId === it.clone.id}
                  >
                    {unblockingId === it.clone.id ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <Text style={s.unblockText}>차단 해제</Text>
                    )}
                  </TouchableOpacity>
                </View>
                {i < items.length - 1 && <View style={s.divider} />}
              </View>
            ))}
          </View>
        )}
      </View>
    </SafeScrollView>
  );
}

const s = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    maxWidth: 780,
    alignSelf: "center",
    width: "100%",
  },
  card: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPh: {
    backgroundColor: COLORS.zinc100,
    alignItems: "center",
    justifyContent: "center",
  },
  rowName: { fontSize: 15, fontWeight: "600", color: COLORS.zinc900 },
  rowSub: { fontSize: 12, color: COLORS.zinc500, marginTop: 2 },
  unblockBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.zinc900,
    minWidth: 78,
    alignItems: "center",
  },
  unblockText: { fontSize: 12, fontWeight: "700", color: COLORS.white },
  divider: { height: 1, backgroundColor: COLORS.zinc100, marginLeft: 72 },

  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyText: { color: COLORS.zinc600, fontSize: 14, fontWeight: "600" },
  emptySub: { color: COLORS.zinc400, fontSize: 12 },
});
