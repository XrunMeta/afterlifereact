

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
  const [tab, setTab] = useState<"user" | "clone">("user");

  const goToItem = (item: BlockedItem) => {
    if (item.type === "user") {

      (navigation as unknown as { navigate: (n: string, p?: object) => void }).navigate(
        "UserProfile",
        { userId: item.user.id },
      );
    } else {
      const c = item.clone;
      (navigation as unknown as { navigate: (n: string, p?: object) => void }).navigate("CloneFeed", {
        feed: {
          id: -c.id,
          cloneId: c.id,
          content: "",
          mediaUrl: c.avatarUrl,
          mediaType: null,
          likesCount: 0,
          commentsCount: 0,
          likedByMe: false,
          createdAt: new Date().toISOString(),
          clone: {
            id: c.id,
            ownerId: c.ownerId,
            name: c.name,
            username: c.username,
            avatarUrl: c.avatarUrl,
            cloneType: c.cloneType,
            visibility: c.visibility,
          },
          interests: [],
        },
      });
    }
  };

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

      {}
      <View style={s.tabBar}>
        {(["user", "clone"] as const).map((tk) => {
          const count = items.filter((it) => it.type === tk).length;
          const active = tab === tk;
          return (
            <TouchableOpacity
              key={tk}
              style={[s.tab, active && s.tabActive]}
              onPress={() => setTab(tk)}
            >
              <Text style={[s.tabText, active && s.tabTextActive]}>
                {tk === "user" ? "유저" : "페르소나"} {count > 0 ? `(${count})` : ""}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={s.content}>
        {loading ? (
          <ActivityIndicator color={COLORS.zinc500} style={{ paddingTop: 60 }} />
        ) : (
          (() => {
            const visible = items.filter((it) => it.type === tab);
            if (visible.length === 0) {
              return (
                <View style={s.empty}>
                  <Feather name="slash" size={36} color={COLORS.zinc300} />
                  <Text style={s.emptyText}>
                    차단한 {tab === "user" ? "유저" : "페르소나"}가 없어요
                  </Text>
                  <Text style={s.emptySub}>
                    {tab === "user"
                      ? "사용자 프로필에서 차단할 수 있어요"
                      : "페르소나 메뉴에서 차단할 수 있어요"}
                  </Text>
                </View>
              );
            }
            return (
              <View style={s.card}>
                {visible.map((it, i) => {
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
                        {}
                        <TouchableOpacity
                          style={s.rowMain}
                          onPress={() => goToItem(it)}
                          activeOpacity={0.6}
                        >
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
                        </TouchableOpacity>
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
                      {i < visible.length - 1 && <View style={s.divider} />}
                    </View>
                  );
                })}
              </View>
            );
          })()
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
  tabBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 24,
    paddingTop: 12,
    maxWidth: 780,
    alignSelf: "center",
    width: "100%",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    alignItems: "center",
    backgroundColor: COLORS.zinc100,
  },
  tabActive: { backgroundColor: COLORS.zinc900 },
  tabText: { fontSize: 13, fontWeight: "700", color: COLORS.zinc500 },
  tabTextActive: { color: COLORS.white },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
