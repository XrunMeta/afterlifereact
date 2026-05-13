

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import SafeView from "../../components/ui/SafeView";
import PageHeader from "../../components/common/PageHeader";
import { COLORS, SIZES, RADIUS } from "../../components/constants";
import { useAuthStore } from "../../stores/authStore";
import { useUserFollowStore } from "../../stores/userFollowStore";
import {
  getUserProfile,
  type UserProfile,
  type UserProfileClone,
} from "../../api/users";
import type { RootStackParamList } from "../../navigation/types";

type RouteProps = RouteProp<RootStackParamList, "UserProfile">;
type NavProp = NativeStackNavigationProp<RootStackParamList>;

const GRID_GAP = 4;
const GRID_COLS = 3;

export default function UserProfileScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { userId } = route.params;
  const accessToken = useAuthStore((s) => s.accessToken);
  const isFollowingFromStore = useUserFollowStore((s) =>
    s.followingIds.has(userId),
  );
  const setFollowing = useUserFollowStore((s) => s.setFollowing);
  const toggleFollow = useUserFollowStore((s) => s.toggleFollow);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  const screenWidth = Dimensions.get("window").width;
  const sidePad = SIZES.medium;
  const cellW = Math.floor(
    (screenWidth - sidePad * 2 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS,
  );

  const load = useCallback(async () => {
    if (!accessToken) {
      setError("로그인이 필요합니다.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getUserProfile(accessToken, userId);
      setProfile(res);

      setFollowing(userId, res.user.isFollowing);
    } catch (err) {
      console.warn("[UserProfile] load failed:", err);
      setError((err as Error).message ?? "프로필을 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, userId, setFollowing]);

  useEffect(() => {
    load();
  }, [load]);

  const onPressFollow = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      const nextState = await toggleFollow(userId);

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              user: {
                ...prev.user,
                isFollowing: nextState,
                followersCount:
                  prev.user.followersCount + (nextState ? 1 : -1),
              },
            }
          : prev,
      );
    } catch (_err) {

    } finally {
      setToggling(false);
    }
  };

  const goToFollowList = (mode: "followers" | "following") => {
    if (!profile) return;
    navigation.navigate("UserFollowList", {
      userId,
      mode,
      userName: profile.user.name ?? profile.user.email,
    });
  };

  const goToClone = (cloneId: number) => {

    navigation.navigate("Main", {
      screen: "ClonesTab",
      params: { screen: "CloneDetail", params: { cloneId } },
    });
  };

  const renderCloneCell = ({
    item,
    index,
  }: {
    item: UserProfileClone;
    index: number;
  }) => {
    const col = index % GRID_COLS;
    const marginRight = col < GRID_COLS - 1 ? GRID_GAP : 0;
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => goToClone(item.id)}
        style={{ width: cellW, marginRight, marginBottom: GRID_GAP }}
      >
        <View style={[s.cellImageWrap, { width: cellW, height: cellW }]}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={s.cellImage} />
          ) : (
            <View style={[s.cellImage, s.cellPlaceholder]}>
              <Feather name="user" size={28} color={COLORS.zinc400} />
            </View>
          )}
        </View>
        <Text style={s.cellName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={s.cellSub} numberOfLines={1}>
          @{item.username}
        </Text>
      </TouchableOpacity>
    );
  };

  const headerName = profile?.user.name ?? profile?.user.email ?? "";
  const isMe = profile?.user.isMe ?? false;

  return (
    <SafeView backgroundColor={COLORS.white}>
      <PageHeader
        showBackButton
        onBackPress={() => navigation.goBack()}
        title={headerName}
      />

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={COLORS.zinc500} />
        </View>
      ) : error || !profile ? (
        <View style={s.center}>
          <Feather name="alert-circle" size={32} color={COLORS.zinc400} />
          <Text style={s.errorText}>{error ?? "프로필을 불러올 수 없어요"}</Text>
          <TouchableOpacity onPress={load} style={s.retryBtn}>
            <Text style={s.retryBtnText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={profile.clones}
          numColumns={GRID_COLS}
          keyExtractor={(it) => String(it.id)}
          renderItem={renderCloneCell}
          contentContainerStyle={{
            paddingHorizontal: sidePad,
            paddingBottom: 32,
          }}
          ListHeaderComponent={
            <>
              {}
              <View style={s.profileSection}>
                <View style={s.profileLeft}>
                  {profile.user.avatarUrl ? (
                    <Image
                      source={{ uri: profile.user.avatarUrl }}
                      style={s.profileAvatar}
                    />
                  ) : (
                    <View
                      style={[s.profileAvatar, s.profileAvatarPlaceholder]}
                    >
                      <Feather name="user" size={28} color={COLORS.zinc400} />
                    </View>
                  )}
                  <View style={{ flex: 1, marginLeft: 26 }}>
                    <Text style={s.profileName} numberOfLines={1}>
                      {profile.user.name ?? "사용자"}
                    </Text>
                    <View style={s.profileStatsRow}>
                      <TouchableOpacity
                        style={s.profileStatItem}
                        onPress={() => goToFollowList("followers")}
                      >
                        <Text style={s.profileStatValue}>
                          {profile.user.followersCount}
                        </Text>
                        <Text style={s.profileStatLabel}>팔로워</Text>
                      </TouchableOpacity>
                      <View style={s.profileStatDivider} />
                      <TouchableOpacity
                        style={s.profileStatItem}
                        onPress={() => goToFollowList("following")}
                      >
                        <Text style={s.profileStatValue}>
                          {profile.user.followingCount}
                        </Text>
                        <Text style={s.profileStatLabel}>팔로잉</Text>
                      </TouchableOpacity>
                      <View style={s.profileStatDivider} />
                      <View style={s.profileStatItem}>
                        <Text style={s.profileStatValue}>
                          {profile.clones.length}
                        </Text>
                        <Text style={s.profileStatLabel}>페르소나</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {!isMe && (
                  <TouchableOpacity
                    onPress={onPressFollow}
                    disabled={toggling}
                    activeOpacity={0.85}
                    style={[
                      s.followBtn,
                      (isFollowingFromStore || profile.user.isFollowing) &&
                        s.followBtnFollowing,
                    ]}
                  >
                    {toggling ? (
                      <ActivityIndicator
                        size="small"
                        color={
                          isFollowingFromStore || profile.user.isFollowing
                            ? COLORS.zinc900
                            : COLORS.white
                        }
                      />
                    ) : (
                      <Text
                        style={[
                          s.followBtnText,
                          (isFollowingFromStore || profile.user.isFollowing) &&
                            s.followBtnTextFollowing,
                        ]}
                      >
                        {isFollowingFromStore || profile.user.isFollowing
                          ? "팔로잉"
                          : "팔로우"}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              <Text style={s.sectionTitle}>
                만든 페르소나 ({profile.clones.length})
              </Text>
            </>
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Feather name="users" size={32} color={COLORS.zinc300} />
              <Text style={s.emptyText}>아직 만든 페르소나가 없어요</Text>
            </View>
          }
        />
      )}
    </SafeView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  errorText: { color: COLORS.zinc500, fontSize: 14 },
  retryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: COLORS.zinc100,
    borderRadius: RADIUS.md,
  },
  retryBtnText: { fontSize: 13, fontWeight: "600", color: COLORS.zinc900 },

  profileSection: {
    paddingTop: 20,
    paddingBottom: 14,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  profileLeft: { flexDirection: "row", alignItems: "center" },
  profileAvatar: { width: 64, height: 64, borderRadius: 32 },
  profileAvatarPlaceholder: {
    backgroundColor: COLORS.zinc100,
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.zinc900,
    marginBottom: 8,
  },
  profileStatsRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  profileStatItem: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  profileStatValue: { fontSize: 14, fontWeight: "700", color: COLORS.zinc900 },
  profileStatLabel: { fontSize: 12, color: COLORS.zinc500 },
  profileStatDivider: { width: 1, height: 12, backgroundColor: COLORS.zinc200 },

  followBtn: {
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.violet600,
    alignItems: "center",
    justifyContent: "center",
  },
  followBtnFollowing: {
    backgroundColor: COLORS.zinc100,
  },
  followBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.white,
  },
  followBtnTextFollowing: {
    color: COLORS.zinc900,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.zinc900,
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },

  cellImageWrap: { borderRadius: RADIUS.sm, overflow: "hidden" },
  cellImage: { width: "100%", height: "100%", backgroundColor: COLORS.zinc100 },
  cellPlaceholder: { alignItems: "center", justifyContent: "center" },
  cellName: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.zinc900,
    marginTop: 6,
  },
  cellSub: { fontSize: 11, color: COLORS.zinc500, marginTop: 1 },

  empty: { alignItems: "center", paddingTop: 40, gap: 8 },
  emptyText: { fontSize: 13, color: COLORS.zinc500 },
});
