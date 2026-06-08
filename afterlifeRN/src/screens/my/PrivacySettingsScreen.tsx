

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
  type BlockedItem,
} from "../../api/clones";
import { unblockUser } from "../../api/users";

const itemKey = (it: BlockedItem) => `${it.type}-${it.blockId}`;

export default function PrivacySettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MyStackParamList>>();
  const accessToken = useAuthStore((s) => s.accessToken);
  const { t } = useTranslation();

  const [items, setItems] = useState<BlockedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockingKey, setUnblockingKey] = useState<string | null>(null);

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

  const handleUnblock = (item: BlockedItem) => {
    const label =
      item.type === "clone"
        ? item.clone.name
        : item.user.name || item.user.email.split("@")[0];
    const key = itemKey(item);
    showAlert(
      "차단 해제",
      `${label} 차단을 해제하시겠어요?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "해제",
          onPress: async () => {
            if (!accessToken) return;
            setUnblockingKey(key);
            try {
              if (item.type === "clone") {
                await unblockClone(accessToken, item.clone.id);
              } else {
                await unblockUser(accessToken, item.user.id);
              }
              setItems((prev) => prev.filter((b) => itemKey(b) !== key));
            } catch (err) {
              const msg = err instanceof Error ? err.message : "해제에 실패했어요.";
              showAlert("오류", msg);
            } finally {
              setUnblockingKey(null);
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
            <Text style={s.emptyText}>차단한 대상이 없어요</Text>
            <Text style={s.emptySub}>
              클론이나 사용자 메뉴에서 차단할 수 있어요
            </Text>
          </View>
        ) : (
          <View style={s.card}>
            {items.map((it, i) => {
              const key = itemKey(it);
              const avatarUrl =
                it.type === "clone" ? it.clone.avatarUrl : it.user.avatarUrl;
              const name =
                it.type === "clone"
                  ? it.clone.name
                  : it.user.name || it.user.email.split("@")[0];
              const sub =
                it.type === "clone" ? `@${it.clone.username}` : it.user.email;
              const busy = unblockingKey === key;
              return (
                <View key={key}>
                  <View style={s.row}>
                    {avatarUrl ? (
                      <Image source={{ uri: avatarUrl }} style={s.avatar} />
                    ) : (
                      <View style={[s.avatar, s.avatarPh]}>
                        <Feather name="user" size={20} color={COLORS.zinc400} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={s.rowName} numberOfLines={1}>
                        {name}
                      </Text>
                      <Text style={s.rowSub} numberOfLines={1}>
                        {sub}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[s.unblockBtn, busy && { opacity: 0.6 }]}
                      onPress={() => handleUnblock(it)}
                      disabled={busy}
                    >
                      {busy ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                      ) : (
                        <Text style={s.unblockText}>차단 해제</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                  {i < items.length - 1 && <View style={s.divider} />}
                </View>
              );
            })}
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
