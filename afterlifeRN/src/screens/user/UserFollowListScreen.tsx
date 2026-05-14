

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import SafeView from "../../components/ui/SafeView";
import PageHeader from "../../components/common/PageHeader";
import { COLORS, RADIUS } from "../../components/constants";
import { useAuthStore } from "../../stores/authStore";
import { useUserFollowStore } from "../../stores/userFollowStore";
import {
  listUserFollowers,
  listUserFollowing,
  type UserFollowItem,
} from "../../api/users";
import type { RootStackParamList } from "../../navigation/types";

type RouteProps = RouteProp<RootStackParamList, "UserFollowList">;
type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function UserFollowListScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();

  const { userId, mode } = route.params;
  const accessToken = useAuthStore((s) => s.accessToken);
  const myUserId = useAuthStore((s) => s.apiUser?.id ?? s.user?.id ?? null);

  const followingIds = useUserFollowStore((st) => st.followingIds);
  const isFollowingUser = useUserFollowStore((st) => st.isFollowing);
  const toggleFollowUser = useUserFollowStore((st) => st.toggleFollow);
  const hydrateUserFollows = useUserFollowStore((st) => st.hydrate);
  const userFollowHydrated = useUserFollowStore((st) => st.hydrated);
  void followingIds; 

  useEffect(() => {
    if (!userFollowHydrated) void hydrateUserFollows();
  }, [userFollowHydrated, hydrateUserFollows]);

  const [items, setItems] = useState<UserFollowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const res =
        mode === "followers"
          ? await listUserFollowers(accessToken, userId, 200)
          : await listUserFollowing(accessToken, userId, 200);
      setItems(res.items);
    } catch (err) {
      console.warn("[UserFollowList] load failed:", err);
      setError((err as Error).message ?? "불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, userId, mode]);

  useEffect(() => {
    load();
  }, [load]);

  const renderRow = ({ item }: { item: UserFollowItem }) => {
    const isMe = item.userId === myUserId;
    const followed = isFollowingUser(item.userId);
    return (
      <TouchableOpacity
        style={s.row}
        onPress={() => navigation.push("UserProfile", { userId: item.userId })}
        activeOpacity={0.7}
      >
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={s.avatar} />
        ) : (
          <View style={[s.avatar, s.avatarPh]}>
            <Feather name="user" size={20} color={COLORS.zinc400} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={s.name} numberOfLines={1}>
            {item.name ?? item.email}
          </Text>
          <Text style={s.email} numberOfLines={1}>
            {item.email}
          </Text>
        </View>
        {}
        {!isMe && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation?.();
              void toggleFollowUser(item.userId);
            }}
            style={[s.followBtn, followed && s.followBtnActive]}
            activeOpacity={0.8}
          >
            <Text style={[s.followBtnText, followed && s.followBtnTextActive]}>
              {followed ? "팔로잉" : "팔로우"}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const title = mode === "followers" ? "팔로워" : "팔로잉";

  return (
    <SafeView backgroundColor={COLORS.white}>
      <PageHeader
        showBackButton
        onBackPress={() => navigation.goBack()}
        title={title}
      />
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={COLORS.zinc500} />
        </View>
      ) : error ? (
        <View style={s.center}>
          <Feather name="alert-circle" size={32} color={COLORS.zinc400} />
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={s.center}>
          <Feather name="users" size={32} color={COLORS.zinc300} />
          <Text style={s.emptyText}>
            {mode === "followers" ? "아직 팔로워가 없어요" : "아직 팔로잉이 없어요"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.userId)}
          renderItem={renderRow}
        />
      )}
    </SafeView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  errorText: { color: COLORS.zinc500, fontSize: 14 },
  emptyText: { color: COLORS.zinc500, fontSize: 14 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPh: {
    backgroundColor: COLORS.zinc100,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 14, fontWeight: "600", color: COLORS.zinc900 },
  email: { fontSize: 12, color: COLORS.zinc500, marginTop: 2 },
  followBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.violet600,
    minWidth: 70,
    alignItems: "center",
  },
  followBtnActive: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.zinc300,
  },
  followBtnText: { color: COLORS.white, fontSize: 13, fontWeight: "700" },
  followBtnTextActive: { color: COLORS.zinc700 },
});
