

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import SafeView from "../../components/ui/SafeView";
import PageHeader from "../../components/common/PageHeader";
import { useAuthStore } from "../../stores/authStore";
import {
  listNotifications,
  markAllRead,
  markRead,
  type NotificationItem,
} from "../../api/notifications";
import { getCloneDetail } from "../../api/clones";
import { COLORS, RADIUS, SIZES } from "../../components/constants";
import type { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const TYPE_ICON: Record<string, keyof typeof Feather.glyphMap> = {
  invite_received: "user-plus",
  invite_accepted: "check-circle",
  share_kicked: "user-x",
  ownership_transferred: "shuffle",
};

export default function NotificationsScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const reload = useCallback(async () => {
    if (!accessToken) {
      setItems([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const res = await listNotifications(accessToken, { limit: 50 });
      setItems(res.items);
    } catch (err) {
      console.warn("[Notifications] list failed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!accessToken || loading) return;
    if (items.length === 0) return;
    if (!items.some((it) => !it.isRead)) return;
    setItems((prev) => prev.map((it) => ({ ...it, isRead: true })));
    markAllRead(accessToken).catch((err) =>
      console.warn("[Notifications] auto markAllRead failed:", err),
    );

  }, [accessToken, loading]);

  const openClone = async (cloneId: number, openComments = false, feedId?: number) => {
    try {
      const det = await getCloneDetail(cloneId, accessToken ?? undefined);
      const c = det.clone;
      navigation.navigate("CloneFeed", {
        openComments,
        feed: {

          id: feedId ?? -c.id,
          cloneId: c.id,
          content: c.description ?? "",
          mediaUrl: c.avatarUrl,
          mediaType: null,
          likesCount: c.stats?.likes ?? 0,
          commentsCount: c.stats?.comments ?? 0,
          likedByMe: c.likedByMe ?? false,
          createdAt: c.createdAt,
          clone: {
            id: c.id,
            ownerId: c.ownerId,
            name: c.name,
            username: c.username,
            avatarUrl: c.avatarUrl,
            cloneType: c.cloneType as never,
            visibility: c.visibility as never,
          },
          interests: [],
        },
      });
    } catch (err) {
      console.warn("[Notifications] open clone failed:", err);
    }
  };

  const handleItemPress = async (n: NotificationItem) => {
    if (!accessToken) return;
    if (!n.isRead) {

      setItems((prev) =>
        prev.map((it) => (it.id === n.id ? { ...it, isRead: true } : it)),
      );
      try {
        await markRead(accessToken, n.id);
      } catch (err) {
        console.warn("[Notifications] markRead failed:", err);
      }
    }

    const d = (n.data ?? {}) as Record<string, unknown>;
    const url = typeof d.url === "string" ? d.url : "";
    let m: RegExpMatchArray | null;

    const cloneIdFromData = typeof d.cloneId === "number" ? d.cloneId : 0;

    if (n.type === "clone_gift") {
      navigation.navigate("Main", {
        screen: "MyTab",
        params: { screen: "Purchase" },
      });
      return;
    }
    if (
      n.type === "clone_like" ||
      n.type === "clone_comment" ||
      n.type === "clone_follow"
    ) {

      if (cloneIdFromData > 0) {
        const tab =
          n.type === "clone_like"
            ? ("likes" as const)
            : n.type === "clone_comment"
              ? ("comments" as const)
              : ("followers" as const);
        navigation.navigate("Main", {
          screen: "ClonesTab",
          params: {
            screen: "Dashboard",
            params: { openStatsCloneId: cloneIdFromData, openStatsTab: tab },
          },
        });
        return;
      }
    }
    if (n.type === "user_follow") {

      const myId = useAuthStore.getState().apiUser?.id;
      if (myId) {
        navigation.navigate("UserFollowList", { userId: myId, mode: "followers" });
        return;
      }
    }
    if (n.type === "followee_new_clone" && cloneIdFromData > 0) {

      navigation.navigate("Main", {
        screen: "ClonesTab",
        params: { screen: "CloneDetail", params: { cloneId: cloneIdFromData } },
      });
      return;
    }

    if ((m = url.match(/^afterlife:\/\/invite\/(.+)$/))) {
      navigation.navigate("InviteAccept", { token: decodeURIComponent(m[1]) });
    } else if (n.type === "moderation" || url.startsWith("afterlife://reports")) {

      navigation.navigate("Main", {
        screen: "MyTab",
        params: { screen: "Reports", params: { tab: "received" } },
      });
    } else if ((m = url.match(/^afterlife:\/\/oth-path\/(\d+)/))) {

      navigation.navigate("UserProfile", { userId: Number(m[1]) });
    } else if (
      n.type === "intimacy_score" ||
      (m = url.match(/^afterlife:\/\/clone\/(\d+)\/intimacy/)) !== null
    ) {

      const cloneId =
        typeof d.cloneId === "number"
          ? d.cloneId
          : Number(url.match(/clone\/(\d+)/)?.[1] ?? 0);
      if (cloneId > 0) {
        navigation.navigate("Main", {
          screen: "ShortsTab",
          params: { openIntimacyCloneId: cloneId },
        });
      }
    } else if ((m = url.match(/^afterlife:\/\/clone\/(\d+)/))) {

      const feedId = typeof d.feedId === "number" ? d.feedId : undefined;
      await openClone(Number(m[1]), n.type === "clone_comment", feedId);
    } else if (n.type === "user_follow" && typeof d.followerId === "number") {
      navigation.navigate("UserProfile", { userId: d.followerId });
    } else if (n.type === "invite_received" && typeof d.token === "string") {
      navigation.navigate("InviteAccept", { token: d.token });
    } else if (typeof d.cloneId === "number") {
      const feedId = typeof d.feedId === "number" ? d.feedId : undefined;
      await openClone(d.cloneId, n.type === "clone_comment", feedId);
    }
  };

  const handleMarkAll = async () => {
    if (!accessToken) return;
    setItems((prev) => prev.map((it) => ({ ...it, isRead: true })));
    try {
      await markAllRead(accessToken);
    } catch (err) {
      console.warn("[Notifications] markAllRead failed:", err);
    }
  };

  const hasUnread = items.some((it) => !it.isRead);

  const renderItem = ({ item }: { item: NotificationItem }) => {
    return (
      <TouchableOpacity
        style={[s.row, !item.isRead && s.rowUnread]}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.6}
      >
        <View style={s.body}>
          {item.title ? <Text style={s.title}>{item.title}</Text> : null}
          {item.body ? (
            <Text style={s.text} numberOfLines={2}>
              {item.body}
            </Text>
          ) : null}
          <Text style={s.time}>{formatRelative(item.createdAt, t)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeView backgroundColor={COLORS.zinc50}>
      <PageHeader
        title={t("notifications.title")}
        showBackButton
        onBackPress={() => navigation.goBack()}
        rightAction={
          hasUnread ? (
            <TouchableOpacity onPress={handleMarkAll} style={{ padding: 6 }}>
              <Text style={s.markAll}>{t("notifications.markAllRead")}</Text>
            </TouchableOpacity>
          ) : null
        }
      />
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={COLORS.zinc500} />
        </View>
      ) : items.length === 0 ? (
        <View style={s.center}>
          <Feather name="bell-off" size={32} color={COLORS.zinc300} />
          <Text style={s.empty}>{t("notifications.empty")}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.id)}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                reload();
              }}
            />
          }
          contentContainerStyle={{ paddingVertical: 8 }}
        />
      )}
    </SafeView>
  );
}

function formatRelative(iso: string, tFn: (k: string, opts?: Record<string, unknown>) => string): string {
  try {
    const ms = new Date(iso.replace(" ", "T") + "Z").getTime();
    const diff = Date.now() - ms;
    const min = Math.floor(diff / 60000);
    if (min < 1) return tFn("common.now");
    if (min < 60) return tFn("common.agoMinutes", { n: min });
    const hr = Math.floor(min / 60);
    if (hr < 24) return tFn("common.agoHours", { n: hr });
    const d = Math.floor(hr / 24);
    if (d < 30) return tFn("common.agoDays", { n: d });
    return new Date(ms).toLocaleDateString();
  } catch {
    return iso;
  }
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  empty: { color: COLORS.zinc500, fontSize: 13 },
  markAll: { fontSize: 13, color: COLORS.violet600, fontWeight: "600" },

  row: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: SIZES.large,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  rowUnread: { backgroundColor: "#faf5ff" },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.violet100,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  unreadDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.error,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  body: { flex: 1 },
  title: { fontSize: 14, fontWeight: "600", color: COLORS.zinc900, marginBottom: 2 },
  text: { fontSize: 13, color: COLORS.zinc600, lineHeight: 18 },
  time: { fontSize: 11, color: COLORS.zinc400, marginTop: 6 },
});

void RADIUS;
