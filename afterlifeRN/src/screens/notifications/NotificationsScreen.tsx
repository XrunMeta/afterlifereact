

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

    const url = (n.data as { url?: string } | null)?.url;
    if (url) {
      const m = url.match(/^afterlife:\/\/invite\/(.+)$/);
      if (m) {
        navigation.navigate("InviteAccept", { token: decodeURIComponent(m[1]) });
      }
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
    const icon = TYPE_ICON[item.type] ?? "bell";
    return (
      <TouchableOpacity
        style={[s.row, !item.isRead && s.rowUnread]}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.6}
      >
        <View style={s.iconWrap}>
          <Feather name={icon} size={18} color={COLORS.violet600} />
          {!item.isRead && <View style={s.unreadDot} />}
        </View>
        <View style={s.body}>
          {item.title ? <Text style={s.title}>{item.title}</Text> : null}
          {item.body ? (
            <Text style={s.text} numberOfLines={2}>
              {item.body}
            </Text>
          ) : null}
          <Text style={s.time}>{formatRelative(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeView backgroundColor={COLORS.zinc50}>
      <PageHeader
        title="알림"
        showBackButton
        onBackPress={() => navigation.goBack()}
        rightAction={
          hasUnread ? (
            <TouchableOpacity onPress={handleMarkAll} style={{ padding: 6 }}>
              <Text style={s.markAll}>모두 읽음</Text>
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
          <Text style={s.empty}>받은 알림이 없어요.</Text>
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

function formatRelative(iso: string): string {
  try {
    const t = new Date(iso.replace(" ", "T") + "Z").getTime();
    const diff = Date.now() - t;
    const min = Math.floor(diff / 60000);
    if (min < 1) return "방금";
    if (min < 60) return `${min}분 전`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}시간 전`;
    const d = Math.floor(hr / 24);
    if (d < 30) return `${d}일 전`;
    return new Date(t).toLocaleDateString("ko-KR");
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
