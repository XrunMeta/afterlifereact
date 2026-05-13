import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Share,
  Platform,
  Linking,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { pickAndCropImage } from "../../lib/imagePicker";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, CommonActions } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import * as Clipboard from "expo-clipboard";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import SafeView from "../../components/ui/SafeView";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/common/PageHeader";
import HashtagText from "../../components/common/HashtagText";
import FriendPickerModal from "./components/FriendPickerModal";
import { useCloneStore } from "../../stores/cloneStore";
import { useAuthStore } from "../../stores/authStore";
import { useFollowStore } from "../../stores/followStore";
import { seedSource } from "../../api/source";
import { listMyClones, deleteClone, listCloneLikes, listCloneComments, listCloneFollowers, type MyClone, type FeedLikeUser, type FeedComment, type CloneFollower } from "../../api/clones";
import { AuthApiError, patchMe } from "../../api/auth";
import { getXrunBalance } from "../../api/payments";
import { uploadFile } from "../../api/files";
import { COLORS, SIZES, RADIUS } from "../../components/constants";
import type { Clone, Visibility } from "../../types/clone";
import type { ClonesStackParamList } from "../../navigation/types";
import type { RootStackParamList } from "../../navigation/types";

type ClonesNav = NativeStackNavigationProp<ClonesStackParamList>;

const DEFAULT_USER_ID = 1;

function formatRelativeShort(iso: string): string {
  try {
    const ms = new Date(iso.replace(" ", "T") + "Z").getTime();
    const diff = Date.now() - ms;
    if (diff < 60_000) return "방금";
    const min = Math.floor(diff / 60_000);
    if (min < 60) return `${min}분 전`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}시간 전`;
    const d = Math.floor(hr / 24);
    if (d < 30) return `${d}일 전`;
    return new Date(ms).toLocaleDateString();
  } catch {
    return "";
  }
}

function formatStat(n: number | null | undefined): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return "0";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function adaptMyClone(c: MyClone): Clone {
  return {
    id: c.id,
    cloneType: c.cloneType,
    ownerId: c.ownerId,
    displayName: c.name,
    description: c.description ?? "",
    interests: c.interests ?? [],
    imageUrl: c.avatarUrl ?? undefined,
    visibility: c.visibility,
    status: (c.trainingStatus as Clone["status"]) ?? "active",
    createdAt: c.createdAt,
    myRole: c.myRole,
    coownerCount: c.coownerCount,
    likesCount: c.likesCount,
    commentsCount: c.commentsCount,
    followersCount: c.followersCount,
    messagesCount: c.messagesCount,
    ...(c.l1Profile ? { l1Profile: c.l1Profile } : {}),
  };
}

export default function MyClonesDashboardScreen() {
  const navigation = useNavigation<ClonesNav>();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const authUser = useAuthStore((s) => s.user);
  const apiUser = useAuthStore((s) => s.apiUser);
  const accessToken = useAuthStore((s) => s.accessToken);
  const patchApiUser = useAuthStore((s) => s.patchApiUser);
  const localClones = useCloneStore((s) => s.localClones);
  const upsertClones = useCloneStore((s) => s.upsertClones);
  const follows = useFollowStore((s) => s.follows);

  const [apiClones, setApiClones] = useState<Clone[] | null>(null);

  const fetchMyClones = React.useCallback(async () => {
    if (!accessToken) {
      setApiClones(null);
      return;
    }
    try {
      const res = await listMyClones(accessToken);
      const adapted = res.items.map(adaptMyClone);
      setApiClones(adapted);

      upsertClones(adapted);
    } catch (err) {
      console.warn("[Dashboard] listMyClones failed:", err);

    }
  }, [accessToken, upsertClones]);

  useEffect(() => {
    fetchMyClones();
  }, [fetchMyClones]);

  useFocusEffect(
    React.useCallback(() => {
      fetchMyClones();
    }, [fetchMyClones]),
  );

  const myClones = useMemo<Clone[]>(() => {
    const uid = apiUser?.id ?? authUser?.id ?? DEFAULT_USER_ID;
    if (apiClones != null) {

      const apiIds = new Set(apiClones.map((c) => c.id));
      const localOnly = localClones.filter(
        (c) => c.ownerId === uid && !apiIds.has(c.id),
      );
      return [...apiClones, ...localOnly];
    }

    return [
      ...seedSource.clones().filter((c) => c.ownerId === uid),
      ...localClones.filter((c) => c.ownerId === uid),
    ];
  }, [apiClones, apiUser, authUser, localClones]);

  const [cloneStates, setCloneStates] = useState<
    Record<number, { isActive: boolean; visibility: Visibility }>
  >(
    myClones.reduce(
      (acc, clone, i) => ({
        ...acc,
        [clone.id]: {
          isActive: i !== 1, 
          visibility: clone.visibility,
        },
      }),
      {},
    ),
  );

  const [hiddenCloneIds, setHiddenCloneIds] = useState<Set<number>>(new Set());
  const [menuCloneId, setMenuCloneId] = useState<number | null>(null);

  const [xrunBalance, setXrunBalance] = useState<number | null | undefined>(undefined);
  const [xrunBalanceLoading, setXrunBalanceLoading] = useState(true);

  const followingCount = (apiUser as { followingCount?: number } | null)?.followingCount ?? 0;
  const followersCount = (apiUser as { followersCount?: number } | null)?.followersCount ?? 0;

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [chargeModalVisible, setChargeModalVisible] = useState(false);

  const [statsModal, setStatsModal] = useState<{
    type: "likes" | "interactions" | "comments" | "followers";
    cloneId: number;
    cloneName: string;
  } | null>(null);
  const [likesList, setLikesList] = useState<FeedLikeUser[] | null>(null);
  const [likesLoading, setLikesLoading] = useState(false);
  const [commentsList, setCommentsList] = useState<FeedComment[] | null>(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [followersList, setFollowersList] = useState<CloneFollower[] | null>(null);
  const [followersLoading, setFollowersLoading] = useState(false);

  useEffect(() => {
    if (statsModal?.type !== "likes" || statsModal.cloneId == null) {
      setLikesList(null);
      return;
    }
    let cancelled = false;
    setLikesLoading(true);
    setLikesList(null);
    listCloneLikes(statsModal.cloneId, { limit: 50 })
      .then((res) => {
        if (cancelled) return;
        setLikesList(res.items);
      })
      .catch((err) => {
        console.warn("[Dashboard] listCloneLikes failed:", err);
        if (!cancelled) setLikesList([]);
      })
      .finally(() => {
        if (!cancelled) setLikesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [statsModal?.type, statsModal?.cloneId]);

  useEffect(() => {
    if (statsModal?.type !== "comments" || statsModal.cloneId == null) {
      setCommentsList(null);
      return;
    }
    let cancelled = false;
    setCommentsLoading(true);
    setCommentsList(null);
    listCloneComments(statsModal.cloneId, { limit: 50 })
      .then((res) => {
        if (cancelled) return;
        setCommentsList(res.items);
      })
      .catch((err) => {
        console.warn("[Dashboard] listCloneComments failed:", err);
        if (!cancelled) setCommentsList([]);
      })
      .finally(() => {
        if (!cancelled) setCommentsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [statsModal?.type, statsModal?.cloneId]);

  useEffect(() => {
    if (statsModal?.type !== "followers" || statsModal.cloneId == null) {
      setFollowersList(null);
      return;
    }
    let cancelled = false;
    setFollowersLoading(true);
    setFollowersList(null);
    listCloneFollowers(statsModal.cloneId, { limit: 100 })
      .then((res) => {
        if (cancelled) return;
        setFollowersList(res.items);
      })
      .catch((err) => {
        console.warn("[Dashboard] listCloneFollowers failed:", err);
        if (!cancelled) setFollowersList([]);
      })
      .finally(() => {
        if (!cancelled) setFollowersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [statsModal?.type, statsModal?.cloneId]);
  const [toggleModal, setToggleModal] = useState<{
    cloneId: number;
    currentState: boolean;
  } | null>(null);
  const [visibilityModal, setVisibilityModal] = useState<{
    cloneId: number;
    currentVisibility: Visibility;
  } | null>(null);
  const [deleteModal, setDeleteModal] = useState<number | null>(null);

  const visibleClones = myClones.filter((c) => !hiddenCloneIds.has(c.id));

  const handleToggle = (cloneId: number) => {
    const currentState = cloneStates[cloneId]?.isActive ?? true;
    setToggleModal({ cloneId, currentState });
  };

  const confirmToggle = () => {
    if (!toggleModal) return;
    setCloneStates((prev) => ({
      ...prev,
      [toggleModal.cloneId]: {
        ...prev[toggleModal.cloneId],
        isActive: !toggleModal.currentState,
      },
    }));
    setToggleModal(null);
  };

  const handleVisibility = (cloneId: number) => {
    const current = cloneStates[cloneId]?.visibility ?? "public";
    setVisibilityModal({ cloneId, currentVisibility: current });
    setMenuCloneId(null);
  };

  useEffect(() => {
    if (!accessToken) {
      setXrunBalanceLoading(false);
      setXrunBalance(undefined);
      return;
    }
    let cancelled = false;
    setXrunBalanceLoading(true);
    getXrunBalance(accessToken)
      .then((res) => {
        if (cancelled) return;
        console.log(
          "[Dashboard] xrun balance ←",
          "linked=", res.linked,
          "xrun=", res.xrun,
          "balances.length=", res.balances?.length ?? 0,
          "balances=", JSON.stringify(res.balances),
        );

        if (!res.linked) {
          setXrunBalance(undefined);
        } else if (typeof res.xrun === "number" && Number.isFinite(res.xrun)) {
          setXrunBalance(res.xrun);
        } else {
          setXrunBalance(undefined);
        }
      })
      .catch((err) => {
        console.warn("[Dashboard] xrun balance fetch failed:", err);
        if (!cancelled) setXrunBalance(undefined);
      })
      .finally(() => {
        if (!cancelled) setXrunBalanceLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const handleEditAvatar = async () => {
    if (!accessToken) {
      Alert.alert(t("common.notice", { defaultValue: "알림" }), t("my.loginRequired", { defaultValue: "로그인이 필요해요." }));
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        t("my.permTitle", { defaultValue: "권한 필요" }),
        t("my.permDesc", { defaultValue: "사진 라이브러리 접근 권한을 허용해주세요." }),
      );
      return;
    }

    const picked = await pickAndCropImage({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];

    setUploadingAvatar(true);
    try {
      const uploaded = await uploadFile(accessToken, asset.uri, {
        purpose: "avatar",
        fileName: asset.fileName ?? "avatar.jpg",
        mimeType: asset.mimeType ?? "image/jpeg",
      });
      await patchMe(accessToken, { avatarUrl: uploaded.url });
      patchApiUser({ avatarUrl: uploaded.url });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "이미지 업로드에 실패했어요";
      Alert.alert(t("common.error", { defaultValue: "오류" }), msg);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const openXrunStore = async () => {
    const playStore = "market://details?id=run.xrun.xrunapp";
    const playStoreWeb = "https://play.google.com/store/apps/details?id=run.xrun.xrunapp";
    const appStore = "https://apps.apple.com/app/id1492389867";
    try {
      if (Platform.OS === "android") {
        const canMarket = await Linking.canOpenURL(playStore);
        await Linking.openURL(canMarket ? playStore : playStoreWeb);
      } else {
        await Linking.openURL(appStore);
      }
    } catch (err) {
      console.warn("[Dashboard] open xrun store failed:", err);
    }
  };

  const [friendPickerCloneId, setFriendPickerCloneId] = useState<number | null>(null);

  const confirmVisibility = async (v: Visibility) => {
    if (!visibilityModal) return;
    const cloneId = visibilityModal.cloneId;
    setVisibilityModal(null);

    if (v === "selected") {
      setFriendPickerCloneId(cloneId);
      return;
    }

    setCloneStates((prev) => ({
      ...prev,
      [cloneId]: { ...prev[cloneId], visibility: v },
    }));

    if (accessToken) {
      try {
        const { patchClone } = await import("../../api/clones");
        await patchClone(accessToken, cloneId, {
          visibility: v,

          allowed_viewers: [],
        });
      } catch (err) {
        console.warn("[Dashboard] update visibility failed:", err);
      }
    }
  };

  const handleDelete = (cloneId: number) => {
    setDeleteModal(cloneId);
    setMenuCloneId(null);
  };

  const [deleteResultMessage, setDeleteResultMessage] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (!deleteModal) return;
    const targetId = deleteModal;
    setDeleteModal(null);

    if (!accessToken) {

      setHiddenCloneIds((prev) => new Set(prev).add(targetId));
      return;
    }
    console.log("[Dashboard] deleteClone start:", targetId);
    try {
      const res = await deleteClone(accessToken, targetId);
      console.log("[Dashboard] deleteClone success:", res);
      if (res.state === "transferred" && res.transferred) {
        setDeleteResultMessage(t("dashboard.deleteSuccessTransferred"));
      } else {
        setDeleteResultMessage(t("dashboard.deleteSuccessSimple"));
      }

      setHiddenCloneIds((prev) => new Set(prev).add(targetId));
      await fetchMyClones();
    } catch (err) {
      if (err instanceof AuthApiError) {
        console.warn(
          "[Dashboard] deleteClone failed:",
          err.code,
          err.status,
          err.message,
          "details=",
          JSON.stringify(err.details),
        );

        if (err.code === "CONFLICT" && /already deleted/i.test(err.message)) {
          setHiddenCloneIds((prev) => new Set(prev).add(targetId));
          setDeleteResultMessage(t("dashboard.deleteAlreadyDeleted"));
          await fetchMyClones();
          return;
        }

        if (err.code === "UNAUTHENTICATED" || err.status === 401) {
          await useAuthStore.getState().apiLogout();
          setDeleteResultMessage(t("dashboard.sessionExpired"));
          return;
        }
      } else {
        console.warn("[Dashboard] deleteClone failed:", err);
      }
      const msg = err instanceof AuthApiError ? err.message : t("dashboard.deleteFailed");
      setDeleteResultMessage(msg);
    }
  };

  const getVisibilityLabel = (v: Visibility) => {
    switch (v) {
      case "public": return "전체 공개";
      case "followers": return "팔로워만";
      case "selected": return "특정 친구";
      case "private": return "나만 보기";
    }
  };

  const getVisibilityIcon = (v: Visibility): keyof typeof Feather.glyphMap => {
    switch (v) {
      case "public": return "globe";
      case "followers": return "users";
      case "selected": return "user-check";
      case "private": return "lock";
    }
  };

  const renderCloneCard = ({ item: clone }: { item: Clone }) => {
    const state = cloneStates[clone.id];
    const visibility = state?.visibility ?? clone.visibility;
    const isMemlow = clone.cloneType === "memlow";

    const followerCount =
      typeof clone.followersCount === "number"
        ? clone.followersCount
        : follows.filter((f) => f.followingCloneId === clone.id).length;

    return (
      <View style={s.card}>
        {}
        <View style={s.cardTopRow}>
          <View style={s.cardTopRight}>
            {}
            {!isMemlow && (
              <View style={s.visibilityBadge}>
                <Feather name={getVisibilityIcon(visibility)} size={14} color={COLORS.zinc500} />
                <Text style={s.visibilityText}>{getVisibilityLabel(visibility)}</Text>
              </View>
            )}
            <TouchableOpacity
              style={s.moreBtn}
              onPress={() => setMenuCloneId(clone.id)}
            >
              <Feather name="more-vertical" size={18} color={COLORS.zinc400} />
            </TouchableOpacity>
          </View>
        </View>

        {}
        <View style={s.cloneHeader}>
          <View style={s.avatarWrap}>
            {clone.imageUrl ? (
              <Image source={{ uri: clone.imageUrl }} style={s.avatar} />
            ) : (
              <View style={[s.avatar, { backgroundColor: COLORS.zinc100, alignItems: 'center', justifyContent: 'center' }]}>
                <Feather name="user" size={20} color={COLORS.zinc400} />
              </View>
            )}
            {}
          </View>
          <View style={s.cloneInfo}>
            <Text style={s.cloneName}>{clone.displayName}</Text>
            <Text style={s.cloneCategory}>{clone.interests?.[0] ?? ""}</Text>
          </View>
        </View>

        {}
        <HashtagText style={s.description} numberOfLines={2}>
          {clone.description}
        </HashtagText>

        {

}
        {isMemlow ? null : (
          <View style={s.statsRow}>
            <TouchableOpacity
              style={s.stat}
              onPress={() => setStatsModal({ type: "likes", cloneId: clone.id, cloneName: clone.displayName })}
            >
              <Feather name="heart" size={14} color={COLORS.zinc500} />
              <Text style={s.statText}>{formatStat(clone.likesCount)}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.stat}
              onPress={() => setStatsModal({ type: "interactions", cloneId: clone.id, cloneName: clone.displayName })}
            >
              <Ionicons name="chatbubbles-outline" size={14} color={COLORS.zinc500} />
              <Text style={s.statText}>{formatStat(clone.messagesCount)}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.stat}
              onPress={() => setStatsModal({ type: "comments", cloneId: clone.id, cloneName: clone.displayName })}
            >
              <Feather name="message-circle" size={14} color={COLORS.zinc500} />
              <Text style={s.statText}>{formatStat(clone.commentsCount)}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.stat}
              onPress={() => setStatsModal({ type: "followers", cloneId: clone.id, cloneName: clone.displayName })}
            >
              <Feather name="user" size={14} color={COLORS.zinc500} />
              <Text style={s.statText} testID={`follower-count-${clone.id}`}>
                {followerCount} 구독자
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {}
        {clone.status === 'pending_assets' && (
          <View style={s.pendingBadge}>
            <Feather name="clock" size={12} color={COLORS.zinc600} />
            <Text style={s.pendingText}>생성대기중</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CloneEdit', { cloneId: clone.id })}>
              <Text style={s.pendingCta}>사진/음성 추가하기</Text>
            </TouchableOpacity>
          </View>
        )}

        {}
        <View style={s.tagsRow}>
          {(clone.interests ?? []).map((tag, i) => (
            <View key={i} style={s.tag}>
              <Text style={s.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>

        {}
        <View style={s.actionsRow}>
          <TouchableOpacity
            style={s.actionBtn}
            onPress={() => rootNav.navigate("Chat", { cloneId: clone.id })}
          >
            <Feather name="message-circle" size={16} color={COLORS.zinc700} />
            <Text style={s.actionText}>{t("dashboard.actionLearn")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.actionBtn}
            onPress={() => rootNav.navigate("Call", { cloneId: clone.id })}
          >
            <Feather name="video" size={16} color={COLORS.zinc700} />
            <Text style={s.actionText}>{t("dashboard.actionCall")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.actionBtn}
            onPress={async () => {

              const url = `https://afterlife.app/clone/${clone.id}`;
              const message = `${clone.displayName} 페르소나와 대화해보세요!\n${url}`;
              try {
                await Share.share(
                  Platform.OS === "ios"
                    ? { message, url, title: clone.displayName }
                    : { message },
                  { dialogTitle: clone.displayName },
                );
              } catch (err) {
                console.warn("[dashboard] share failed:", err);
                try {
                  await Clipboard.setStringAsync(url);
                  setDeleteResultMessage(t("dashboard.shareLinkCopied"));
                } catch {
                  setDeleteResultMessage(t("dashboard.shareLinkFailed"));
                }
              }
            }}
          >
            <Feather name="share-2" size={16} color={COLORS.zinc700} />
            <Text style={s.actionText}>{t("dashboard.actionShare")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeView backgroundColor={COLORS.white} showBottomBackground={false}>
      <PageHeader
        title={t("dashboard.title")}
        rightAction={

          <TouchableOpacity
            onPress={() =>
              rootNav.dispatch(
                CommonActions.navigate({
                  name: "MyTab",
                  params: { screen: "MyHome" },
                }),
              )
            }
            activeOpacity={0.7}
            hitSlop={8}
          >
            <Feather name="settings" size={22} color={COLORS.zinc700} />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={visibleClones}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderCloneCard}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.dashEmpty}>
            <View style={s.dashEmptyIconWrap}>
              <Feather name="user-plus" size={32} color={COLORS.zinc400} />
            </View>
            <Text style={s.dashEmptyTitle}>나만의 페르소나를 만들어보세요</Text>
            <Text style={s.dashEmptyDesc}>
              아래 버튼을 눌러 첫 페르소나를 만들 수 있어요
            </Text>
            <TouchableOpacity
              style={s.dashEmptyBtn}
              activeOpacity={0.85}
              onPress={() =>

                navigation.dispatch(
                  CommonActions.navigate({
                    name: "CreateTab",
                    params: { screen: "Step3" },
                  }),
                )
              }
            >
              <Feather name="plus" size={18} color={COLORS.white} />
              <Text style={s.dashEmptyBtnText}>페르소나 만들기</Text>
            </TouchableOpacity>
          </View>
        }
        ListHeaderComponent={
          <>
            {

}
            <View style={s.profileSection}>
              <View style={s.profileLeft}>
                <View style={s.profileAvatarWrap}>
                  {(() => {

                    const uri = apiUser
                      ? apiUser.avatarUrl
                      : authUser?.avatarUrl ?? null;
                    return uri ? (
                      <Image source={{ uri }} style={s.profileAvatar} />
                    ) : (
                      <View style={[s.profileAvatar, s.profileAvatarPlaceholder]}>
                        <Feather name="user" size={28} color={COLORS.zinc400} />
                      </View>
                    );
                  })()}
                  <TouchableOpacity
                    style={s.profileAvatarEditBtn}
                    onPress={handleEditAvatar}
                    disabled={uploadingAvatar}
                    activeOpacity={0.8}
                    hitSlop={6}
                  >
                    {uploadingAvatar ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <Feather name="edit-2" size={12} color={COLORS.white} />
                    )}
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1, marginLeft: 26 }}>
                  <Text style={s.profileName} numberOfLines={1}>
                    {apiUser?.name ?? authUser?.displayName ?? "사용자"}
                  </Text>
                  <View style={s.profileStatsRow}>
                    <TouchableOpacity
                      style={s.profileStatItem}
                      onPress={() => {
                        const meId = apiUser?.id;
                        if (!meId) return;
                        rootNav.navigate("UserFollowList", {
                          userId: meId,
                          mode: "followers",
                          userName: apiUser?.name ?? undefined,
                        });
                      }}
                    >
                      <Text style={s.profileStatValue}>{followersCount}</Text>
                      <Text style={s.profileStatLabel}>팔로워</Text>
                    </TouchableOpacity>
                    <View style={s.profileStatDivider} />
                    <TouchableOpacity
                      style={s.profileStatItem}
                      onPress={() => {
                        const meId = apiUser?.id;
                        if (!meId) return;
                        rootNav.navigate("UserFollowList", {
                          userId: meId,
                          mode: "following",
                          userName: apiUser?.name ?? undefined,
                        });
                      }}
                    >
                      <Text style={s.profileStatValue}>{followingCount}</Text>
                      <Text style={s.profileStatLabel}>팔로잉</Text>
                    </TouchableOpacity>
                    <View style={s.profileStatDivider} />
                    <View style={s.profileStatItem}>
                      <Text style={s.profileStatValue}>{visibleClones.length}</Text>
                      <Text style={s.profileStatLabel}>페르소나</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {
}
            <View style={s.coinRow}>
              <Image
                source={require("../../../assets/images/xrun-round-logo.png")}
                style={s.coinIcon}
              />
              <View style={{ flex: 1 }} />
              <View style={s.coinAmountWrap}>
                {xrunBalanceLoading ? (
                  <ActivityIndicator color={COLORS.zinc900} />
                ) : xrunBalance != null ? (
                  <Text style={s.coinAmountText}>
                    {xrunBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    <Text style={s.coinUnit}> XRUN</Text>
                  </Text>
                ) : (
                  <Text style={s.coinAmountText}>
                    —<Text style={s.coinUnit}> XRUN</Text>
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={s.coinChargeBtn}
                onPress={() => setChargeModalVisible(true)}
                hitSlop={8}
              >
                <Feather name="plus-circle" size={24} color={COLORS.violet600} />
              </TouchableOpacity>
            </View>

            {
}
          </>
        }
      />

      {}
      <Modal visible={!!menuCloneId} transparent animationType="fade">
        <Pressable style={s.modalOverlay} onPress={() => setMenuCloneId(null)}>
          <Pressable style={s.menuBox} onPress={(e) => e.stopPropagation()}>
            <Text style={s.menuTitle}>{t("dashboard.manage")}</Text>
            <TouchableOpacity
              style={s.menuItem}
              onPress={() => {
                const id = menuCloneId!;
                setMenuCloneId(null);
                navigation.navigate("CloneEdit", { cloneId: id });
              }}
            >
              <Feather name="edit-2" size={18} color={COLORS.zinc700} />
              <Text style={s.menuItemText}>{t("dashboard.menuEdit")}</Text>
            </TouchableOpacity>

            {}

            {
}
            {menuCloneId != null &&
              myClones.find((c) => c.id === menuCloneId)?.cloneType !== "memlow" && (
                <TouchableOpacity
                  style={s.menuItem}
                  onPress={() => {
                    const id = menuCloneId!;
                    handleVisibility(id);
                  }}
                >
                  <Feather
                    name={getVisibilityIcon(cloneStates[menuCloneId!]?.visibility ?? "public")}
                    size={18}
                    color={COLORS.zinc700}
                  />
                  <Text style={s.menuItemText}>공개 범위</Text>
                </TouchableOpacity>
              )}
            <View style={s.menuDivider} />
            {}
            <TouchableOpacity
              style={s.menuItem}
              onPress={() => {
                const id = menuCloneId!;
                handleDelete(id);
              }}
            >
              <Feather name="trash-2" size={18} color={COLORS.error} />
              <Text style={[s.menuItemText, { color: COLORS.error }]}>{t("dashboard.menuDelete")}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {}
      <Modal visible={!!toggleModal} transparent animationType="fade">
        <Pressable style={s.modalOverlay} onPress={() => setToggleModal(null)}>
          <Pressable style={s.modalBox} onPress={(e) => e.stopPropagation()}>
            <Text style={s.modalTitle}>
              {toggleModal?.currentState ? "페르소나 비활성화" : "페르소나 활성화"}
            </Text>
            <Text style={s.modalDesc}>
              {toggleModal?.currentState
                ? "페르소나를 비활성화하시겠습니까? 비활성화 시 다른 사용자에게 노출되지 않습니다."
                : "페르소나를 활성화하시겠습니까? 활성화 시 다른 사용자에게 노출됩니다."}
            </Text>
            <View style={s.modalBtns}>
              <Button
                title="취소"
                variant="ghost"
                onPress={() => setToggleModal(null)}
                style={s.modalBtnHalf}
              />
              <Button
                title="확인"
                variant="primary"
                onPress={confirmToggle}
                style={s.modalBtnHalf}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {}
      <Modal visible={!!visibilityModal} transparent animationType="fade">
        <Pressable style={s.modalOverlay} onPress={() => setVisibilityModal(null)}>
          <Pressable style={s.modalBox} onPress={(e) => e.stopPropagation()}>
            <Text style={s.modalTitle}>공개 범위</Text>
            <Text style={s.modalDesc}>이 페르소나를 누구에게 보일까요?</Text>
            <View style={s.visibilityOptions}>
              {(["public", "followers", "selected", "private"] as Visibility[]).map((v) => {
                const selected = visibilityModal?.currentVisibility === v;
                return (
                  <TouchableOpacity
                    key={v}
                    style={[s.visibilityOption, selected && s.visibilityOptionSelected]}
                    onPress={() => confirmVisibility(v)}
                  >
                    <Feather
                      name={getVisibilityIcon(v)}
                      size={16}
                      color={selected ? COLORS.white : COLORS.zinc700}
                    />
                    <Text
                      style={[
                        s.visibilityOptionText,
                        selected && { color: COLORS.white },
                      ]}
                    >
                      {getVisibilityLabel(v)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Button
              title="취소"
              variant="ghost"
              onPress={() => setVisibilityModal(null)}
              style={{ marginTop: 12, width: "100%" }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {}
      <FriendPickerModal
        visible={friendPickerCloneId != null}
        onClose={() => setFriendPickerCloneId(null)}
        onConfirm={async (userIds) => {
          const cloneId = friendPickerCloneId;
          setFriendPickerCloneId(null);
          if (!cloneId) return;
          setCloneStates((prev) => ({
            ...prev,
            [cloneId]: { ...prev[cloneId], visibility: "selected" },
          }));
          if (accessToken) {
            try {
              const { patchClone } = await import("../../api/clones");
              await patchClone(accessToken, cloneId, {
                visibility: "selected",
                allowed_viewers: userIds,
              });
            } catch (err) {
              console.warn("[Dashboard] selected visibility PATCH failed:", err);
            }
          }
        }}
      />

      {}
      <Modal visible={!!deleteModal} transparent animationType="fade">
        <Pressable style={s.modalOverlay} onPress={() => setDeleteModal(null)}>
          <Pressable style={s.modalBox} onPress={(e) => e.stopPropagation()}>
            <Text style={s.modalTitle}>{t("dashboard.deleteTitle")}</Text>
            <Text style={s.modalDesc}>
              {deleteModal &&
              myClones.find((c) => c.id === deleteModal)?.cloneType === "memlow"
                ? t("dashboard.deleteDescMemlow")
                : t("dashboard.deleteDescDefault")}
            </Text>
            <View style={s.modalBtns}>
              <Button
                title="취소"
                variant="ghost"
                onPress={() => setDeleteModal(null)}
                style={s.modalBtnHalf}
              />
              <Button
                title="삭제"
                variant="danger"
                onPress={confirmDelete}
                style={s.modalBtnHalf}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {}
      <Modal visible={!!deleteResultMessage} transparent animationType="fade">
        <Pressable style={s.modalOverlay} onPress={() => setDeleteResultMessage(null)}>
          <Pressable style={s.modalBox} onPress={(e) => e.stopPropagation()}>
            <Text style={s.modalTitle}>알림</Text>
            <Text style={s.modalDesc}>{deleteResultMessage}</Text>
            <Button
              title="확인"
              variant="primary"
              onPress={() => setDeleteResultMessage(null)}
              style={{ width: "100%" }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {

}

      {
}
      <Modal visible={chargeModalVisible} transparent animationType="fade">
        <Pressable
          style={s.chargeOverlay}
          onPress={() => setChargeModalVisible(false)}
        >
          <Pressable style={s.chargeBox} onPress={(e) => e.stopPropagation()}>
            <View style={s.chargeIconWrap}>
              <Feather name="zap" size={28} color={COLORS.violet600} />
            </View>
            <Text style={s.chargeTitle}>암호화폐 충전 안내</Text>
            <Text style={s.chargeDesc}>
              금액을 충전하고 싶다면{"\n"}xrun 앱에서 암호화폐를 얻어보세요
            </Text>
            <Text style={s.chargeHint}>※ 같은 아이디로 로그인 하셔야 합니다</Text>
            <View style={s.chargeBtns}>
              <TouchableOpacity
                style={s.chargeCancelBtn}
                onPress={() => setChargeModalVisible(false)}
              >
                <Text style={s.chargeCancelText}>닫기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.chargeGoBtn}
                onPress={() => {
                  setChargeModalVisible(false);
                  openXrunStore();
                }}
              >
                <Feather name="external-link" size={14} color={COLORS.white} />
                <Text style={s.chargeGoText}>바로가기</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {}
      <Modal visible={!!statsModal} transparent animationType="slide">
        <Pressable style={s.modalOverlay} onPress={() => setStatsModal(null)}>
          <View
            style={[s.statsSheet, { paddingBottom: 32 + Math.max(insets.bottom, 0) }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={s.sheetHandle} />
            <Text style={s.statsSheetTitle}>
              {statsModal?.type === "likes" && "좋아요"}
              {statsModal?.type === "interactions" && "상호작용"}
              {statsModal?.type === "comments" && "댓글"}
              {statsModal?.type === "followers" && "구독자"}
            </Text>
            <Text style={s.statsSheetSub}>
              {statsModal?.cloneName}
            </Text>

            <ScrollView style={s.statsScrollArea} showsVerticalScrollIndicator={false}>
              {}
              {statsModal?.type === "comments" && (
                <>
                  {commentsLoading ? (
                    <ActivityIndicator color={COLORS.zinc500} style={{ paddingVertical: 24 }} />
                  ) : !commentsList || commentsList.length === 0 ? (
                    <View style={{ paddingVertical: 24, alignItems: "center" }}>
                      <Text style={{ color: COLORS.zinc500, fontSize: 13 }}>아직 댓글이 없어요</Text>
                    </View>
                  ) : (
                    commentsList.map((cm) => (
                      <View key={cm.id} style={s.commentRow}>
                        <View style={s.commentTop}>
                          {cm.user.avatarUrl ? (
                            <Image source={{ uri: cm.user.avatarUrl }} style={s.commentAvatar} />
                          ) : (
                            <View style={[s.commentAvatar, { backgroundColor: COLORS.zinc200 }]} />
                          )}
                          <Text style={s.commentName}>{cm.user.name ?? cm.user.email}</Text>
                          <Text style={s.commentTime}>{formatRelativeShort(cm.createdAt)}</Text>
                          <TouchableOpacity
                            onPress={() => {
                              setStatsModal(null);
                              setDeleteResultMessage("신고가 접수됐어요");
                            }}
                            style={{ marginLeft: "auto", paddingHorizontal: 6, paddingVertical: 4 }}
                          >
                            <Feather name="flag" size={14} color={COLORS.error} />
                          </TouchableOpacity>
                        </View>
                        <Text style={s.commentText}>{cm.content}</Text>
                      </View>
                    ))
                  )}
                </>
              )}

              {}
              {statsModal?.type === "likes" && (
                <>
                  {likesLoading ? (
                    <ActivityIndicator color={COLORS.zinc500} style={{ paddingVertical: 24 }} />
                  ) : !likesList || likesList.length === 0 ? (
                    <View style={{ paddingVertical: 24, alignItems: "center" }}>
                      <Text style={{ color: COLORS.zinc500, fontSize: 13 }}>아직 좋아요가 없어요</Text>
                    </View>
                  ) : (
                    likesList.map((u) => (
                      <View key={u.likeId} style={s.accountRow}>
                        {u.avatarUrl ? (
                          <Image source={{ uri: u.avatarUrl }} style={s.accountAvatar} />
                        ) : (
                          <View style={[s.accountAvatar, { backgroundColor: COLORS.zinc200 }]} />
                        )}
                        <View style={s.accountInfo}>
                          <Text style={s.accountName}>{u.name ?? u.email}</Text>
                          <Text style={s.accountSub}>{u.email}</Text>
                        </View>
                      </View>
                    ))
                  )}
                </>
              )}

              {}
              {statsModal?.type === "followers" && (
                <>
                  {followersLoading ? (
                    <ActivityIndicator color={COLORS.zinc500} style={{ paddingVertical: 24 }} />
                  ) : !followersList || followersList.length === 0 ? (
                    <View style={{ paddingVertical: 24, alignItems: "center" }}>
                      <Text style={{ color: COLORS.zinc500, fontSize: 13 }}>아직 구독자가 없어요</Text>
                    </View>
                  ) : (
                    followersList.map((u) => (
                      <View key={u.followId} style={s.accountRow}>
                        {u.avatarUrl ? (
                          <Image source={{ uri: u.avatarUrl }} style={s.accountAvatar} />
                        ) : (
                          <View style={[s.accountAvatar, { backgroundColor: COLORS.zinc200 }]} />
                        )}
                        <View style={s.accountInfo}>
                          <Text style={s.accountName}>{u.name ?? u.email}</Text>
                          <Text style={s.accountSub}>{u.email}</Text>
                        </View>
                      </View>
                    ))
                  )}
                </>
              )}

              {}
              {statsModal?.type === "interactions" && (
                <View style={{ paddingVertical: 24, alignItems: "center" }}>
                  <Feather name="message-circle" size={28} color={COLORS.zinc300} />
                  <Text style={{ color: COLORS.zinc500, fontSize: 13, marginTop: 8 }}>
                    상호작용 상세 목록은 준비 중이에요
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </SafeView>
  );
}

const MOCK_ACCOUNTS = [
  { id: "u1", name: "김민수", avatar: "https://i.pravatar.cc/100?img=1", detail: "@minsu_k" },
  { id: "u2", name: "이서연", avatar: "https://i.pravatar.cc/100?img=5", detail: "@seoyeon_lee" },
  { id: "u3", name: "박지훈", avatar: "https://i.pravatar.cc/100?img=3", detail: "@jihun.park" },
  { id: "u4", name: "최유진", avatar: "https://i.pravatar.cc/100?img=9", detail: "@yujin_choi" },
  { id: "u5", name: "정하은", avatar: "https://i.pravatar.cc/100?img=10", detail: "@haeun_j" },
];

const MOCK_INTERACTIONS = [
  { id: "i1", name: "김민수", avatar: "https://i.pravatar.cc/100?img=1", detail: "마지막 대화: 2시간 전" },
  { id: "i2", name: "이서연", avatar: "https://i.pravatar.cc/100?img=5", detail: "마지막 대화: 어제" },
  { id: "i3", name: "박지훈", avatar: "https://i.pravatar.cc/100?img=3", detail: "마지막 대화: 3일 전" },
  { id: "i4", name: "최유진", avatar: "https://i.pravatar.cc/100?img=9", detail: "마지막 대화: 1주 전" },
];

const MOCK_COMMENTS = [
  { id: "c1", name: "김민수", avatar: "https://i.pravatar.cc/100?img=1", text: "정말 도움이 많이 됐어요! 감사합니다.", time: "2시간 전" },
  { id: "c2", name: "이서연", avatar: "https://i.pravatar.cc/100?img=5", text: "이 페르소나 대화 퀄리티가 진짜 좋네요", time: "5시간 전" },
  { id: "c3", name: "박지훈", avatar: "https://i.pravatar.cc/100?img=3", text: "위로가 되는 말씀 감사해요 ㅠㅠ", time: "어제" },
  { id: "c4", name: "최유진", avatar: "https://i.pravatar.cc/100?img=9", text: "매일 대화하고 있어요 추천합니다!", time: "2일 전" },
  { id: "c5", name: "정하은", avatar: "https://i.pravatar.cc/100?img=10", text: "목소리도 자연스럽고 너무 좋아요", time: "3일 전" },
];

const s = StyleSheet.create({
  dashEmpty: {
    paddingVertical: 48,
    paddingHorizontal: 32,
    alignItems: "center",
    gap: 8,
  },
  dashEmptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.zinc100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  dashEmptyTitle: { fontSize: 16, fontWeight: "700", color: COLORS.zinc800 },
  dashEmptyDesc: { fontSize: 13, color: COLORS.zinc500, textAlign: "center", lineHeight: 18 },
  dashEmptyBtn: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.zinc900,
  },
  dashEmptyBtnText: { fontSize: 14, fontWeight: "700", color: COLORS.white },

  listContent: {
    paddingHorizontal: SIZES.medium,
    paddingBottom: 24,
  },

  profileSection: {
    paddingTop: 28,
    paddingBottom: 14,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  profileLeft: { flexDirection: "row", alignItems: "center" },
  profileAvatarWrap: { position: "relative" },
  profileAvatar: { width: 64, height: 64, borderRadius: 32 },
  profileAvatarPlaceholder: {
    backgroundColor: COLORS.zinc100,
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarEditBtn: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.zinc900,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
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

  dashTitle: { marginTop: 16, marginBottom: 20 },
  dashTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  dashTitleText: { fontSize: 20, fontWeight: "700", color: COLORS.zinc900 },
  inviteStatusBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.violet100,
    borderRadius: RADIUS.full,
  },
  inviteStatusBtnText: { fontSize: 12, fontWeight: "600", color: COLORS.violet600 },
  dashSubText: { fontSize: 13, color: COLORS.zinc500, marginTop: 4 },

  coinRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.zinc100,
  },
  coinIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  coinSymbol: { fontSize: 16, fontWeight: "600", color: COLORS.zinc900 },
  coinNetwork: { fontSize: 12, color: COLORS.zinc500, marginTop: 2 },
  coinAmountWrap: { alignItems: "flex-end", marginRight: 8 },
  coinAmountText: { fontSize: 16, fontWeight: "700", color: COLORS.zinc900 },
  coinUnit: { fontSize: 15, fontWeight: "600", color: COLORS.zinc700 },
  coinChargeBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },

  chargeOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  chargeBox: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  chargeIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.violet100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  chargeTitle: { fontSize: 18, fontWeight: "700", color: COLORS.zinc900, marginBottom: 8 },
  chargeDesc: {
    fontSize: 14,
    color: COLORS.zinc600,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 16,
  },
  chargeHint: { fontSize: 12, color: COLORS.zinc500, marginBottom: 20 },
  chargeBtns: { flexDirection: "row", gap: 8, width: "100%" },
  chargeCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.zinc300,
    alignItems: "center",
  },
  chargeCancelText: { fontSize: 14, fontWeight: "600", color: COLORS.zinc700 },
  chargeGoBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.violet600,
  },
  chargeGoText: { fontSize: 14, fontWeight: "700", color: COLORS.white },

  statsOverview: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statsCard: {
    flex: 1,
    backgroundColor: COLORS.zinc50,
    borderRadius: 24,
    padding: 20,
  },
  statsCardDark: {
    backgroundColor: COLORS.zinc900,
  },
  statsCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  statsCardLabel: { fontSize: 11, color: COLORS.zinc500 },
  statsCardValue: { fontSize: 28, fontWeight: "700", color: COLORS.zinc900 },
  statsCardDelta: { fontSize: 11, color: COLORS.success, fontWeight: "500", marginTop: 4 },
  activityCount: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  activityActive: { fontSize: 44, fontWeight: "700", color: COLORS.white },
  activityTotal: { fontSize: 28, color: COLORS.zinc400 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    paddingTop: 10,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    marginBottom: 16,
  },

  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  activeToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  activeText: { fontSize: 12, fontWeight: "500", color: COLORS.zinc600 },
  cardTopRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  visibilityBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  visibilityText: { fontSize: 13, color: COLORS.zinc500 },
  moreBtn: { padding: 4 },

  menuBox: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 8,
    width: "100%",
    maxWidth: 320,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.zinc900,
    textAlign: "center",
    paddingVertical: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
  },
  menuItemText: { fontSize: 15, color: COLORS.zinc700 },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.zinc200,
    marginHorizontal: 16,
    marginVertical: 4,
  },

  cloneHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 12,
  },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
  },
  activeDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  cloneInfo: { flex: 1 },
  cloneName: { fontSize: 16, fontWeight: "700", color: COLORS.zinc900 },
  cloneCategory: { fontSize: 12, color: COLORS.zinc500, marginTop: 2 },

  description: {
    fontSize: 14,
    color: COLORS.zinc600,
    lineHeight: 20,
    marginBottom: 14,
  },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 14,
  },
  stat: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { fontSize: 13, color: COLORS.zinc500 },

  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.zinc100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 10,
  },
  pendingText: { fontSize: 11, color: COLORS.zinc600 },
  pendingCta: { fontSize: 11, color: COLORS.violet600, marginLeft: 4, textDecorationLine: 'underline' },

  coownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.violet100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 10,
  },
  coownerText: { fontSize: 11, color: COLORS.violet600, fontWeight: '500' },

  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: COLORS.zinc100,
    borderRadius: RADIUS.full,
  },
  tagText: { fontSize: 12, color: COLORS.zinc600 },

  actionsRow: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1,
    height: 40,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.zinc100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionText: { fontSize: 12, fontWeight: "500", color: COLORS.zinc700 },

  loadMore: {
    height: 48,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  loadMoreText: { fontSize: 14, fontWeight: "500", color: COLORS.zinc900 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.zinc900,
    textAlign: "center",
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    color: COLORS.zinc600,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  modalBtns: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalBtnHalf: { flex: 1 },

  visibilityOptions: { gap: 8, width: "100%" },
  visibilityOption: {
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.zinc100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  visibilityOptionSelected: {
    backgroundColor: COLORS.zinc900,
  },
  visibilityOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.zinc700,
  },

  statsSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,

    maxHeight: "70%",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.zinc300,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  statsSheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.zinc900,
    marginBottom: 4,
  },
  statsSheetSub: {
    fontSize: 13,
    color: COLORS.zinc500,
    marginBottom: 16,
  },
  statsScrollArea: {
    flex: 1,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  accountAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.zinc200,
  },
  accountInfo: { flex: 1 },
  accountName: { fontSize: 15, fontWeight: "600", color: COLORS.zinc900 },
  accountSub: { fontSize: 13, color: COLORS.zinc500, marginTop: 2 },

  commentRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  commentTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.zinc200,
  },
  commentName: { fontSize: 14, fontWeight: "600", color: COLORS.zinc900 },
  commentTime: { fontSize: 12, color: COLORS.zinc400 },
  commentText: {
    fontSize: 14,
    color: COLORS.zinc700,
    lineHeight: 20,
    paddingLeft: 36,
  },

  inviteSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 8,
    width: "100%",
    height: "70%",
  },
  inviteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  inviteTitle: { fontSize: 18, fontWeight: "700", color: COLORS.zinc900 },
  inviteSearchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.zinc100,
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    height: 44,
    marginBottom: 16,
  },
  inviteSearchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.zinc900,
  },
  inviteList: { flex: 1 },
  inviteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  inviteAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.zinc200,
  },
  inviteInfo: { flex: 1 },
  inviteName: { fontSize: 15, fontWeight: "600", color: COLORS.zinc900 },
  inviteUsername: { fontSize: 13, color: COLORS.zinc500, marginTop: 2 },
  inviteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.zinc900,
  },
  inviteBtnSent: {
    backgroundColor: COLORS.zinc100,
  },
  inviteBtnText: { fontSize: 13, fontWeight: "600", color: COLORS.white },
  inviteBtnTextSent: { color: COLORS.success },
});
