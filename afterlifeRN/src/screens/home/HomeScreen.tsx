import { showAlert } from "../../stores/dialogStore";
import HashtagText from "../../components/common/HashtagText";
import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
  ViewToken,
  Platform,
  Modal,
  Pressable,
  ScrollView,
  Image,
  TextInput,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { Alert, Share } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAndroidNavigationBarHeight } from "react-native-navigation-bar-height";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, CommonActions } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useFaceBiometricRetroPrompt } from "../../face/useFaceBiometricRetroPrompt";
import FeedCard from "../../components/ui/FeedCard";
import IntimacyEventsSheet from "../../components/clone/IntimacyEventsSheet";

import GiftReceiptsSheet from "../../components/clone/GiftReceiptsSheet";
import SwipeDownSheet from "../../components/ui/SwipeDownSheet";
import ReportReasonModal from "../../components/common/ReportReasonModal";

import VisibilityPickerModal from "../clones/components/VisibilityPickerModal";
import FriendPickerModal from "../clones/components/FriendPickerModal";
import type { Visibility } from "../../types/clone";

import { useFeedStore, apiFeedCountsCache, apiCloneCache } from "../../stores/feedStore";
import { useFollowStore } from "../../stores/followStore";

import { useUserFollowStore } from "../../stores/userFollowStore";
import { useAuthStore } from "../../stores/authStore";
import { toFeedItem } from "../../mocks/feedAdapter";
import {
  listFeedComments,
  postFeedComment,
  postCloneComment,
  deleteFeedComment,
  blockClone,
  listFeedCommentReplies,
  likeFeedComment,
  unlikeFeedComment,
  getCloneDetail,
  type FeedComment,
} from "../../api/clones";
import { formatRelativeKo } from "../../lib/relativeTime";
import { assertCanCall } from "../../lib/callGuard";
import { useReportAcceptedGate } from "../../hooks/useReportAcceptedGate";
import { COLORS, RADIUS } from "../../components/constants";
import type { FeedItem } from "../../types/feed";
import type { RootStackParamList } from "../../navigation/types";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const TAB_BAR_HEIGHT = 56;

export default function HomeScreen() {
  const { t } = useTranslation();

  useReportAcceptedGate();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const navBarHeight = useAndroidNavigationBarHeight(0);
  const flatListRef = useRef<FlatList>(null);

  const [descScrolling, setDescScrolling] = useState(false);

  const descScrollUnlockRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bottomInset = Platform.OS === "ios"
    ? insets.bottom
    : Math.max(navBarHeight, insets.bottom);
  const feedHeight = SCREEN_HEIGHT - TAB_BAR_HEIGHT - bottomInset;

  const likedIds = useFeedStore((s) => s.likedIds);
  const selectedInterests = useFeedStore((s) => s.selectedInterests);
  const toggleLike = useFeedStore((s) => s.toggleLike);
  const setSelectedInterests = useFeedStore((s) => s.setSelectedInterests);
  const getFilteredFeeds = useFeedStore((s) => s.getFilteredFeeds);
  const loadDiscover = useFeedStore((s) => s.loadDiscover);
  const apiFeeds = useFeedStore((s) => s.apiFeeds);
  const apiLoading = useFeedStore((s) => s.apiLoading);
  const follows = useFollowStore((s) => s.follows);
  const isFollowing = useFollowStore((s) => s.isFollowing);
  const toggleFollow = useFollowStore((s) => s.toggleFollow);

  const isUserFollowing = useUserFollowStore((s) => s.isFollowing);
  const toggleUserFollow = useUserFollowStore((s) => s.toggleFollow);

  const [firstLoadDone, setFirstLoadDone] = useState(false);

  useEffect(() => {
    if (apiFeeds == null) {
      void loadDiscover().finally(() => setFirstLoadDone(true));
    } else {
      setFirstLoadDone(true);
    }
  }, [apiFeeds, loadDiscover]);

  useFocusEffect(
    useCallback(() => {
      void loadDiscover().finally(() => setFirstLoadDone(true));
    }, [loadDiscover]),
  );

  const [currentIndex, setCurrentIndex] = useState(0);

  const [commentFeedId, setCommentFeedId] = useState<number | null>(null);

  const [commentSheetShowDetail, setCommentSheetShowDetail] = useState(false);

  const [detailCloneStats, setDetailCloneStats] = useState<{ followers: number; createdAt: string; ownerId: number } | null>(null);
  useEffect(() => {
    if (commentFeedId == null) { setDetailCloneStats(null); return; }
    const item = useFeedStore.getState().apiFeeds?.find((f) => f.id === commentFeedId);
    const cloneId = item?.cloneId ?? (commentFeedId < 0 ? -commentFeedId : undefined);
    if (!cloneId) return;
    let cancelled = false;
    getCloneDetail(cloneId, useAuthStore.getState().accessToken ?? undefined)
      .then((res) => {
        if (cancelled) return;
        setDetailCloneStats({
          followers: res.clone.stats?.followers ?? 0,
          createdAt: res.clone.createdAt,
          ownerId: res.clone.ownerId,
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [commentFeedId]);
  const [commentText, setCommentText] = useState("");

  const [intimacyModal, setIntimacyModal] = useState<{ cloneId: number; cloneName: string } | null>(null);

  const [giftModal, setGiftModal] = useState<{ cloneId: number; cloneName: string } | null>(null);

  const [moreTarget, setMoreTarget] = useState<{
    cloneId: number;
    ownerId?: number;
    author: string;
    isOwn: boolean;
    visibility?: string;
  } | null>(null);

  const [visibilityPicker, setVisibilityPicker] = useState<{
    cloneId: number;
    currentVisibility: Visibility;
  } | null>(null);

  const [friendPickerCloneId, setFriendPickerCloneId] = useState<number | null>(null);

  const [reportTarget, setReportTarget] = useState<{
    cloneId: number;
    author: string;
  } | null>(null);

  const [reportCommentTarget, setReportCommentTarget] = useState<{
    commentId: number;
    author: string;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  useEffect(() => {
    if (toastMessage) {
      const id = setTimeout(() => setToastMessage(null), 2000);
      return () => clearTimeout(id);
    }
  }, [toastMessage]);

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => setKeyboardHeight(e.endCoordinates.height),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardHeight(0),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
  const keyboardVisible = keyboardHeight > 0;

  const filteredFeeds: FeedItem[] = getFilteredFeeds().map(toFeedItem);

  const bumpCommentsCount = useCallback((feedId: number, n: number) => {
    apiFeedCountsCache.set(feedId, { commentsCount: n });
    const cur = useFeedStore.getState().apiFeeds;
    if (cur) {
      useFeedStore.setState({
        apiFeeds: cur.map((f) => (f.id === feedId ? { ...f, commentsCount: n } : f)),
      });
    }
  }, []);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  void setSelectedInterests;

  const [comments, setComments] = useState<FeedComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const accessToken = useAuthStore((s) => s.accessToken);

  useFaceBiometricRetroPrompt(accessToken);
  const myUserId = useAuthStore((s) => s.apiUser?.id ?? s.user?.id ?? null);

  const [replyingTo, setReplyingTo] = useState<{ commentId: number; userName: string } | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Record<number, FeedComment[]>>({});

  useEffect(() => {
    if (commentFeedId == null) {
      setComments([]);

      setExpandedReplies({});
      setReplyingTo(null);
      return;
    }
    if (commentFeedId < 0) {

      setComments([]);
      setExpandedReplies({});
      return;
    }
    let cancelled = false;
    setCommentsLoading(true);
    setComments([]);
    setExpandedReplies({});
    listFeedComments(commentFeedId, { limit: 100, accessToken })
      .then((res) => {
        if (cancelled) return;
        setComments(res.items);
      })
      .catch((err) => {
        console.warn("[Home] listFeedComments failed:", err);
        if (!cancelled) setComments([]);
      })
      .finally(() => {
        if (!cancelled) setCommentsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [commentFeedId]);

  const submittingRef = useRef(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const submitComment = async () => {
    if (commentFeedId == null) return;
    if (submittingRef.current) return; 
    const content = commentText.trim();
    if (!content || !accessToken) return;

    Keyboard.dismiss();
    submittingRef.current = true;
    setSubmittingComment(true);
    try {
      let realFeedId: number;
      const oldId = commentFeedId;
      if (commentFeedId < 0) {

        const cloneId = -commentFeedId;
        const res = await postCloneComment(accessToken, cloneId, content);
        realFeedId = res.comment.feedId;
        setCommentFeedId(realFeedId);

        const cur = useFeedStore.getState().apiFeeds;
        if (cur) {
          useFeedStore.setState({
            apiFeeds: cur.map((f) => (f.id === oldId ? { ...f, id: realFeedId } : f)),
          });
        }
        apiFeedCountsCache.delete(oldId);
      } else {
        await postFeedComment(accessToken, commentFeedId, content, {
          parentCommentId: replyingTo?.commentId,
        });
        realFeedId = commentFeedId;
      }
      setCommentText("");

      if (replyingTo) {
        try {
          const rep = await listFeedCommentReplies(realFeedId, replyingTo.commentId, { limit: 100, accessToken });
          setExpandedReplies((prev) => ({ ...prev, [replyingTo.commentId]: rep.items }));
          setComments((prev) =>
            prev.map((c) =>
              c.id === replyingTo.commentId
                ? { ...c, repliesCount: rep.items.length }
                : c,
            ),
          );
        } catch (err) {
          console.warn("[Home] refresh replies failed:", err);
        }
        setReplyingTo(null);

        const cur = useFeedStore.getState().apiFeeds;
        const target = cur?.find((f) => f.id === realFeedId);
        bumpCommentsCount(realFeedId, (target?.commentsCount ?? 0) + 1);
      } else {
        const r = await listFeedComments(realFeedId, { limit: 100, accessToken });
        setComments(r.items);
        bumpCommentsCount(realFeedId, r.items.length);
      }
    } catch (err) {
      console.warn("[Home] postFeedComment failed:", err);
    } finally {
      submittingRef.current = false;
      setSubmittingComment(false);
    }
  };

  const deleteComment = (commentId: number) => {
    if (commentFeedId == null || commentFeedId < 0 || !accessToken) return;
    showAlert(
      t("home.commentDeleteTitle", { defaultValue: "댓글 삭제" }),
      t("home.commentDeleteDesc", { defaultValue: "이 댓글을 삭제하시겠습니까?" }),
      [
        { text: t("common.cancel", { defaultValue: "취소" }), style: "cancel" },
        {
          text: t("common.delete", { defaultValue: "삭제" }),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteFeedComment(accessToken, commentFeedId, commentId);
              setComments((prev) => {
                const next = prev.filter((c) => c.id !== commentId);
                bumpCommentsCount(commentFeedId, next.length);
                return next;
              });
            } catch (err) {
              console.warn("[Home] deleteFeedComment failed:", err);
            }
          },
        },
      ],
    );
  };

  const openCommentActionSheet = (c: FeedComment) => {
    let cloneId: number | undefined;
    let cloneOwnerId: number | undefined;
    if (detailCloneStats?.ownerId != null) cloneOwnerId = detailCloneStats.ownerId;
    const apiFeeds = useFeedStore.getState().apiFeeds;
    const raw = apiFeeds?.find((f) => f.id === commentFeedId);
    if (raw) {
      cloneId = raw.cloneId;
      if (cloneOwnerId == null) cloneOwnerId = raw.clone?.ownerId ?? undefined;
    } else if (commentFeedId != null && commentFeedId < 0) {
      cloneId = -commentFeedId;
    }
    if (cloneOwnerId == null && cloneId != null) {
      const cached = apiCloneCache.get(cloneId);
      if (cached?.ownerId != null && cached.ownerId > 0) cloneOwnerId = cached.ownerId;
    }
    const isOwner = myUserId != null && cloneOwnerId != null && cloneOwnerId === myUserId;
    const isMine = myUserId != null && c.userId === myUserId;
    const canDelete = isMine || isOwner;
    const isOthers = !isMine;
    const authorName = c.user.name ?? c.user.email ?? "";
    const buttons: Array<{ text: string; onPress?: () => void; style?: "default" | "cancel" | "destructive" }> = [];
    if (canDelete) buttons.push({ text: "삭제", style: "destructive", onPress: () => deleteComment(c.id) });
    if (isOthers) buttons.push({ text: "차단하기", onPress: () => {
      showAlert("차단", `${authorName} 님을 차단하시겠습니까?\n(해당 클론과의 상호작용 차단)`, [
        { text: "취소", style: "cancel" },
        { text: "차단", style: "destructive", onPress: async () => {
          if (!cloneId || !accessToken) return;
          try { await blockClone(accessToken, cloneId); setToastMessage("차단됐어요"); }
          catch (err) { console.warn("[block] failed:", err); setToastMessage("차단 실패"); }
        }},
      ]);
    }});
    if (isOthers) buttons.push({ text: "신고하기", onPress: () => setReportCommentTarget({ commentId: c.id, author: authorName }) });
    if (buttons.length === 0) return;
    buttons.push({ text: "취소", style: "cancel" });
    showAlert(`댓글 (${authorName})`, undefined, buttons);
  };

  const toggleCommentLike = (comment: FeedComment, parentCommentId?: number) => {
    if (!accessToken) return;
    const fid = comment.feedId ?? (commentFeedId != null && commentFeedId > 0 ? commentFeedId : 0);
    if (!fid) return;
    const wasLiked = !!comment.likedByMe;
    const curCount = comment.likesCount ?? 0;
    const nextLiked = !wasLiked;
    const nextCount = Math.max(0, curCount + (nextLiked ? 1 : -1));
    const apply = (c: FeedComment): FeedComment =>
      c.id === comment.id ? { ...c, likedByMe: nextLiked, likesCount: nextCount } : c;
    if (parentCommentId) {
      setExpandedReplies((p) => {
        const list = p[parentCommentId];
        if (!list) return p;
        return { ...p, [parentCommentId]: list.map(apply) };
      });
    } else {
      setComments((prev) => prev.map(apply));
    }
    void (async () => {
      try {
        if (nextLiked) await likeFeedComment(accessToken, fid, comment.id);
        else await unlikeFeedComment(accessToken, fid, comment.id);
      } catch (err) {
        console.warn("[Home] toggleCommentLike failed:", err);
        const rollback = (c: FeedComment): FeedComment =>
          c.id === comment.id ? { ...c, likedByMe: wasLiked, likesCount: curCount } : c;
        if (parentCommentId) {
          setExpandedReplies((p) => {
            const list = p[parentCommentId];
            if (!list) return p;
            return { ...p, [parentCommentId]: list.map(rollback) };
          });
        } else {
          setComments((prev) => prev.map(rollback));
        }
      }
    })();
  };

  const renderItem = useCallback(
    ({ item, index }: { item: FeedItem; index: number }) => {

      const isOwn = myUserId != null && item.cloneOwnerId === myUserId;
      return (
        <FeedCard
          item={item}
          isActive={index === currentIndex}
          isLiked={likedIds.includes(item.id)}
          isFollowed={isFollowing(item.cloneId)}
          isOwn={isOwn}
          cardHeight={feedHeight}
          onToggleLike={() => toggleLike(item.id)}
          onToggleFollow={() => void toggleFollow(item.cloneId)}
          onCallPress={() => {

            const t0 = Date.now();
            console.log(`[Call][flow] +${t0} onCallPress cloneId=${item.cloneId} name=${item.author} (optimistic)`);
            if (typeof item.image === "string" && item.image) {
              const pfStart = Date.now();
              console.log(`[Call][flow] +${pfStart} Image.prefetch start url=${item.image}`);
              Image.prefetch(item.image)
                .then(() => console.log(`[Call][flow] +${Date.now()} Image.prefetch done (Δ${Date.now() - pfStart}ms)`))
                .catch((err) => console.warn(`[Call][flow] Image.prefetch failed:`, err));
            }
            console.log(`[Call][flow] +${Date.now()} navigation.navigate("Call") (Δ${Date.now() - t0}ms since click)`);
            rootNav.navigate("Call", { cloneId: item.cloneId, name: item.author, image: item.image });

            void assertCanCall(accessToken, () => {
              rootNav.dispatch(
                CommonActions.navigate({ name: "MyTab", params: { screen: "Purchase" } }),
              );
            }).then((ok) => {
              console.log(`[Call][flow] +${Date.now()} assertCanCall(bg) → ok=${ok} (Δ${Date.now() - t0}ms)`);
              if (!ok) {

                if (rootNav.canGoBack()) rootNav.goBack();
              }
            });
          }}
          onCommentPress={() => { setCommentSheetShowDetail(false); setCommentFeedId(item.id); }}

          onIntimacyPress={() => setIntimacyModal({ cloneId: item.cloneId, cloneName: item.author })}
          onMorePress={() =>
            setMoreTarget({
              cloneId: item.cloneId,
              ownerId: item.cloneOwnerId,
              author: item.author,
              isOwn,
              visibility: item.cloneVisibility,
            })
          }
          onSharePress={async () => {
            try {

              const nameParam = encodeURIComponent(item.author);
              const url = `https://www.xrun.run/clone?id=${item.cloneId}&name=${nameParam}`;
              await Share.share({
                message: t("home.shareMessage", {
                  name: item.author,
                  url,
                  defaultValue: `${item.author} 클론과 만나보세요!\n${url}`,
                }),
                title: item.author,
              });
            } catch (err) {
              console.warn("[Home] share failed:", err);
            }
          }}

          onOwnerPress={() => {
            if (item.cloneOwnerId != null) {
              rootNav.navigate("UserProfile", { userId: item.cloneOwnerId });
            }
          }}
          onOwnerFollowPress={() => {
            if (item.cloneOwnerId != null) void toggleUserFollow(item.cloneOwnerId);
          }}
          isOwnerFollowed={item.cloneOwnerId != null ? isUserFollowing(item.cloneOwnerId) : false}

          onGiftPress={() => setGiftModal({ cloneId: item.cloneId, cloneName: item.author })}

          onDescriptionPress={() => { setCommentSheetShowDetail(true); setCommentFeedId(item.id); }}
        />
      );
    },
    [
      currentIndex,
      likedIds,
      follows,
      feedHeight,
      toggleLike,
      toggleFollow,
      isFollowing,
      myUserId,
      isUserFollowing,
      toggleUserFollow,
    ]
  );

  const showLoading = !firstLoadDone || (filteredFeeds.length === 0 && apiLoading);
  const showEmpty = !showLoading && filteredFeeds.length === 0;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      {

}
      {showLoading ? (
        <View style={[styles.emptyWrap, { height: feedHeight }]}>
          <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />
        </View>
      ) : showEmpty ? (
        <View style={[styles.emptyWrap, { height: feedHeight }]}>
          <View style={styles.emptyIconWrap}>
            <Feather name="users" size={36} color="rgba(255,255,255,0.7)" />
          </View>
          <Text style={styles.emptyTitle}>
            {t("home.emptyTitle", { defaultValue: "아직 만나볼 클론이 없어요" })}
          </Text>
          <Text style={styles.emptyDesc}>
            {t("home.emptyDesc", {
              defaultValue:
                "첫 클론의 주인공이 되어보시는 건 어때요?\n나만의 클론을 만들어 시작해 보세요",
            })}
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            activeOpacity={0.85}
            onPress={() =>

              rootNav.dispatch(
                CommonActions.navigate({
                  name: "CreateTab",
                  params: { screen: "Step3" },
                }),
              )
            }
          >
            <Feather name="plus" size={18} color={COLORS.zinc950} />
            <Text style={styles.emptyBtnText}>
              {t("home.createClone", { defaultValue: "클론 만들기" })}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={filteredFeeds}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          pagingEnabled

          scrollEnabled={!descScrolling}
          showsVerticalScrollIndicator={false}
          snapToInterval={feedHeight}
          decelerationRate="fast"
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={(_, index) => ({
            length: feedHeight,
            offset: feedHeight * index,
            index,
          })}
        />
      )}

      {}

      {
}
      <Modal visible={!!commentFeedId} transparent animationType="slide">
        {
}
        <Pressable style={styles.commentOverlay} onPress={(e) => {
          if (e.target !== e.currentTarget) return;
          if (commentSheetShowDetail && keyboardVisible) {
            Keyboard.dismiss();
          } else {
            Keyboard.dismiss(); setCommentFeedId(null); setCommentSheetShowDetail(false);
          }
        }}>
          <SwipeDownSheet
            onClose={() => { Keyboard.dismiss(); setCommentFeedId(null); setCommentSheetShowDetail(false); }}
            keyboardOffset={keyboardHeight}
            style={[
              styles.commentSheet,

              {
                paddingBottom: 24 + Math.max(insets.bottom, 0),
                height: Math.max(SCREEN_HEIGHT * 0.7 - keyboardHeight, 200),
              },
            ]}
          >
            <View style={styles.sheetHandle} />
            {

}
            {(() => {
              if (!commentSheetShowDetail) return null;
              if (keyboardVisible) return null;
              const detailItem = filteredFeeds.find((f) => f.id === commentFeedId);
              if (!detailItem) return null;
              return (
                <View style={styles.detailHeader}>
                  <View style={styles.detailProfileRow}>
                    {detailItem.authorAvatar ? (
                      <Image
                        source={
                          typeof detailItem.authorAvatar === "number"
                            ? detailItem.authorAvatar
                            : { uri: detailItem.authorAvatar as string }
                        }
                        style={styles.detailAvatar}
                      />
                    ) : (
                      <View style={[styles.detailAvatar, { backgroundColor: COLORS.zinc100 }]} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailAuthor} numberOfLines={1}>{detailItem.author}</Text>
                      {}
                      <Text style={styles.detailUsername} numberOfLines={1}>@{(detailItem.username ?? "").replace(/^@+/, "")}</Text>
                    </View>
                    {}
                    <TouchableOpacity
                      onPress={() => { Keyboard.dismiss(); setCommentFeedId(null); setCommentSheetShowDetail(false); }}
                      hitSlop={8}
                    >
                      <Feather name="x" size={22} color={COLORS.zinc600} />
                    </TouchableOpacity>
                  </View>
                  {detailItem.description ? (

                    <HashtagText
                      style={styles.detailDescription}
                      tagStyle={{ color: COLORS.violet600, fontWeight: "600" }}
                    >
                      {detailItem.description}
                    </HashtagText>
                  ) : null}
                  {
}
                  <View style={styles.detailStatsRow}>
                    <View style={styles.detailStatCard}>
                      {}
                      <Text style={styles.detailStatValue}>{detailCloneStats?.followers ?? 0}</Text>
                      <Text style={styles.detailStatLabel}>{t("feed.followers", { defaultValue: "구독자" })}</Text>
                    </View>
                    <View style={styles.detailStatCard}>
                      <Text style={styles.detailStatValue}>{detailItem.likes || "0"}</Text>
                      <Text style={styles.detailStatLabel}>{t("feed.likes", { defaultValue: "좋아요" })}</Text>
                    </View>
                    <View style={styles.detailStatCard}>
                      {}
                      <Text style={styles.detailStatValue}>{(() => {
                        const src = detailCloneStats?.createdAt ?? detailItem.createdAt;
                        if (!src) return "-";
                        const d = new Date(src);
                        if (isNaN(d.getTime())) return "-";
                        const y = d.getFullYear();
                        const m = String(d.getMonth() + 1).padStart(2, "0");
                        const day = String(d.getDate()).padStart(2, "0");
                        return `${y}.${m}.${day}`;
                      })()}</Text>
                      <Text style={styles.detailStatLabel}>{t("feed.createdAt", { defaultValue: "생성일" })}</Text>
                    </View>
                  </View>
                </View>
              );
            })()}
            {
}
            {!commentSheetShowDetail ? (
              <View style={styles.commentHeaderRow}>
                <Text style={styles.commentTitle}>{t("feed.commentCount", { n: comments.length })}</Text>
              </View>
            ) : null}
            {
}
            <ScrollView
              style={[styles.commentScroll, { minHeight: 0 }]}
              contentContainerStyle={comments.length === 0 ? { flexGrow: 1, justifyContent: "center", minHeight: 180 } : { flexGrow: 1 }}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="always"
              scrollEventThrottle={16}
              alwaysBounceVertical={true}
              overScrollMode="always"
            >
              {commentsLoading ? (
                <View style={styles.emptyComment}>
                  <Feather name="loader" size={28} color={COLORS.zinc400} />
                </View>
              ) : comments.length > 0 ? (
                comments.map((c) => {
                  const replies = expandedReplies[c.id];
                  const showReplies = replies !== undefined;

                  const _isCloneOwnerForComments = myUserId != null && detailCloneStats?.ownerId != null && detailCloneStats.ownerId === myUserId;
                  return (

                  <View key={c.id} style={styles.commentBlock}>
                  <TouchableOpacity
                    activeOpacity={1}
                    style={styles.commentRow}
                    onLongPress={_isCloneOwnerForComments ? () => openCommentActionSheet(c) : undefined}
                    delayLongPress={400}
                  >
                    {c.user.avatarUrl ? (
                      <Image source={{ uri: c.user.avatarUrl }} style={styles.commentAvatar} />
                    ) : (
                      <View style={[styles.commentAvatar, { backgroundColor: COLORS.zinc100 }]} />
                    )}
                    <View style={styles.commentInfo}>
                      <View style={styles.commentMeta}>
                        <Text style={styles.commentAuthor}>{c.user.name ?? c.user.email}</Text>
                        <Text style={styles.commentTime}>{formatRelativeKo(c.createdAt)}</Text>
                        {}
                        {!_isCloneOwnerForComments && (c.userId === myUserId ? (
                          <TouchableOpacity onPress={() => deleteComment(c.id)} style={{ marginLeft: 8 }} hitSlop={8}>
                            <Feather name="trash-2" size={14} color={COLORS.zinc400} />
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            onPress={() =>
                              setReportCommentTarget({
                                commentId: c.id,
                                author: c.user.name ?? c.user.email ?? "",
                              })
                            }
                            style={{ marginLeft: 8 }}
                            hitSlop={8}
                          >
                            <Feather name="flag" size={14} color={COLORS.zinc400} />
                          </TouchableOpacity>
                        ))}
                      </View>
                      <Text style={styles.commentContent}>{c.content}</Text>
                      {}
                      <View style={styles.replyActions}>
                        <TouchableOpacity
                          onPress={() =>
                            setReplyingTo({
                              commentId: c.id,
                              userName: c.user.name ?? c.user.email ?? "",
                            })
                          }
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          activeOpacity={0.6}
                        >
                          <Text style={styles.replyActionText}>
                            {t("home.replyAction", { defaultValue: "답글 달기" })}
                          </Text>
                        </TouchableOpacity>
                        {(c.repliesCount ?? 0) > 0 && (
                          <TouchableOpacity
                            onPress={async () => {
                              if (commentFeedId == null || commentFeedId < 0) return;
                              if (showReplies) {

                                setExpandedReplies((p) => {
                                  const n = { ...p };
                                  delete n[c.id];
                                  return n;
                                });
                              } else {
                                try {
                                  const r = await listFeedCommentReplies(commentFeedId, c.id, { limit: 100, accessToken });
                                  setExpandedReplies((p) => ({ ...p, [c.id]: r.items }));
                                } catch (err) {
                                  console.warn("[Home] listReplies failed:", err);
                                }
                              }
                            }}
                          >
                            <Text style={styles.replyToggleText}>
                              {showReplies
                                ? t("home.repliesHide", { defaultValue: "── 답글 숨기기" })
                                : t("home.repliesMore", {
                                    n: c.repliesCount,
                                    defaultValue: `── 답글 ${c.repliesCount}개 더 보기`,
                                  })}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                    {

}
                    <TouchableOpacity
                      style={styles.commentHeart}
                      onPress={() => toggleCommentLike(c)}
                      hitSlop={8}
                      delayPressIn={150}
                    >
                      <Ionicons
                        name="heart"
                        size={18}
                        color={c.likedByMe ? "#ef4444" : COLORS.zinc400}
                      />
                      <Text
                        style={[
                          styles.commentHeartCount,
                          c.likedByMe ? { color: "#ef4444" } : null,
                        ]}
                      >
                        {c.likesCount ?? 0}
                      </Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                  {

}
                  {showReplies && replies && replies.map((rc) => (
                    <View key={rc.id} style={styles.replyRow}>
                      <View style={styles.replyIndent} />
                      {rc.user.avatarUrl ? (
                        <Image source={{ uri: rc.user.avatarUrl }} style={styles.replyAvatar} />
                      ) : (
                        <View style={[styles.replyAvatar, { backgroundColor: COLORS.zinc100 }]} />
                      )}
                      <View style={{ flex: 1 }}>
                        <View style={styles.commentMeta}>
                          <Text style={styles.commentAuthor}>{rc.user.name ?? rc.user.email}</Text>
                          <Text style={styles.commentTime}>{formatRelativeKo(rc.createdAt)}</Text>
                        </View>
                        <Text style={styles.commentContent}>{rc.content}</Text>
                      </View>
                      {
}
                      <TouchableOpacity
                        style={styles.commentHeart}
                        onPress={() => toggleCommentLike(rc, c.id)}
                        hitSlop={8}
                        delayPressIn={150}
                      >
                        <Ionicons
                          name="heart"
                          size={16}
                          color={rc.likedByMe ? "#ef4444" : COLORS.zinc400}
                        />
                        <Text
                          style={[
                            styles.commentHeartCount,
                            rc.likedByMe ? { color: "#ef4444" } : null,
                          ]}
                        >
                          {rc.likesCount ?? 0}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  </View>
                );
                })
              ) : (

                <View style={styles.emptyComment}>
                  <Feather name="message-circle" size={40} color={COLORS.zinc300} />
                  <Text style={styles.emptyText}>{t("feed.commentsEmpty")}</Text>
                </View>
              )}
            </ScrollView>
            {}
            {}
            {replyingTo && (
              <View style={styles.replyingBanner}>
                <Text style={styles.replyingText}>
                  {t("home.replyTo", {
                    user: replyingTo.userName,
                    defaultValue: `@${replyingTo.userName} 에게 답글`,
                  })}
                </Text>
                <TouchableOpacity onPress={() => setReplyingTo(null)}>
                  <Feather name="x" size={14} color={COLORS.zinc500} />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.commentInputRow}>
              <TextInput
                style={[styles.commentInput, submittingComment && { opacity: 0.6 }]}
                value={commentText}
                onChangeText={setCommentText}
                editable={!submittingComment}
                placeholder={
                  submittingComment
                    ? t("home.commentSending", { defaultValue: "전송 중..." })
                    : replyingTo
                    ? t("home.replyPlaceholder", { defaultValue: "답글 입력..." })
                    : t("feed.commentPlaceholder")
                }
                placeholderTextColor={COLORS.zinc400}
              />
              <TouchableOpacity
                disabled={!commentText.trim() || !accessToken || submittingComment}
                onPress={submitComment}
              >
                {}
                {submittingComment ? (
                  <ActivityIndicator size="small" color={COLORS.violet600} />
                ) : (
                  <Feather
                    name="send"
                    size={18}
                    color={
                      commentText.trim() && accessToken
                        ? COLORS.violet600
                        : COLORS.zinc400
                    }
                  />
                )}
              </TouchableOpacity>
            </View>
          </SwipeDownSheet>
        </Pressable>
      </Modal>

      {}

      {
}
      <Modal visible={!!moreTarget} transparent animationType="fade">
        <Pressable style={styles.moreOverlay} onPress={() => setMoreTarget(null)}>
          <SwipeDownSheet
            onClose={() => setMoreTarget(null)}
            style={[styles.moreSheet, { paddingBottom: 24 + Math.max(insets.bottom, 0) }]}
          >
            <View style={styles.moreSheetHandle} />
            <Text style={styles.moreTitle}>{moreTarget?.author}</Text>

            {moreTarget?.isOwn ? (

              <>
                <TouchableOpacity
                  style={styles.moreItem}
                  onPress={() => {
                    const target = moreTarget;
                    setMoreTarget(null);
                    if (!target) return;

                    rootNav.dispatch(
                      CommonActions.navigate({
                        name: "Main",
                        params: {
                          screen: "ClonesTab",
                          params: {
                            screen: "CloneEdit",
                            params: { cloneId: target.cloneId },
                          },
                        },
                      }),
                    );
                  }}
                >
                  <Feather name="edit-3" size={20} color={COLORS.zinc900} />
                  <Text style={styles.moreItemText}>
                    {t("home.more.edit", { defaultValue: "수정하기" })}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.moreItem}
                  onPress={() => {
                    const target = moreTarget;
                    setMoreTarget(null);
                    if (!target) return;

                    const current = (target.visibility as Visibility | undefined) ?? "public";
                    setVisibilityPicker({ cloneId: target.cloneId, currentVisibility: current });
                  }}
                >
                  <Feather name="eye" size={20} color={COLORS.zinc900} />
                  <Text style={styles.moreItemText}>
                    {t("home.more.editVisibility", { defaultValue: "공개 범위 수정" })}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.moreItem, { borderBottomWidth: 0 }]}
                  onPress={async () => {
                    const target = moreTarget;
                    setMoreTarget(null);
                    if (!target || !accessToken) return;

                    showAlert(
                      t("home.deleteTitle", { defaultValue: "클론 삭제" }),
                      t("home.deleteDesc", {
                        name: target.author,
                        defaultValue: `'${target.author}' 클론을 삭제할까요?\n복구 불가합니다.`,
                      }),
                      [
                        { text: t("common.cancel", { defaultValue: "취소" }), style: "cancel" },
                        {
                          text: t("common.delete", { defaultValue: "삭제" }),
                          style: "destructive",
                          onPress: async () => {
                            try {
                              const { deleteClone } = await import("../../api/clones");
                              await deleteClone(accessToken, target.cloneId);
                              setToastMessage(
                                t("home.toasts.cloneDeleted", {
                                  defaultValue: "클론이 삭제됐어요",
                                }),
                              );
                              const cur = useFeedStore.getState().apiFeeds;
                              if (cur) {
                                useFeedStore.setState({
                                  apiFeeds: cur.filter((it) => it.cloneId !== target.cloneId),
                                });
                              }
                              void loadDiscover();
                            } catch (err) {
                              console.warn("[Delete clone] failed:", err);
                              setToastMessage(
                                t("home.toasts.deleteFailed", {
                                  defaultValue: "삭제에 실패했어요",
                                }),
                              );
                            }
                          },
                        },
                      ],
                    );
                  }}
                >
                  <Feather name="trash-2" size={20} color="#ef4444" />
                  <Text style={[styles.moreItemText, { color: "#ef4444" }]}>
                    {t("home.more.delete", { defaultValue: "삭제" })}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (

              <>
                <TouchableOpacity
                  style={styles.moreItem}
                  onPress={() => {
                    const target = moreTarget;
                    setMoreTarget(null);
                    if (!target) return;

                    setReportTarget({ cloneId: target.cloneId, author: target.author });
                  }}
                >
                  <Feather name="flag" size={20} color="#ef4444" />
                  <Text style={[styles.moreItemText, { color: "#ef4444" }]}>
                    {t("home.more.report", { defaultValue: "신고하기" })}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.moreItem, { borderBottomWidth: 0 }]}
                  onPress={async () => {
                    const target = moreTarget;
                    setMoreTarget(null);
                    if (!target || !accessToken) return;
                    try {
                      await blockClone(accessToken, target.cloneId);
                      setToastMessage(
                        t("home.toasts.cloneBlocked", {
                          defaultValue: "이 클론이 차단됐어요",
                        }),
                      );
                      const cur = useFeedStore.getState().apiFeeds;
                      if (cur) {
                        useFeedStore.setState({
                          apiFeeds: cur.filter((it) => it.cloneId !== target.cloneId),
                        });
                      }
                      await useFollowStore.getState().unfollowLocalForBlock(target.cloneId);
                      void loadDiscover();
                    } catch (err) {
                      console.warn(`[BLOCK] FAILED cloneId=${target.cloneId}`, err);
                      setToastMessage(
                        t("home.toasts.blockFailed", {
                          defaultValue: "차단에 실패했어요",
                        }),
                      );
                    }
                  }}
                >
                  <Feather name="slash" size={20} color={COLORS.zinc900} />
                  <Text style={styles.moreItemText}>
                    {t("home.more.block", { defaultValue: "차단하기" })}
                  </Text>
                </TouchableOpacity>
              </>
            )}
            {}
          </SwipeDownSheet>
        </Pressable>
      </Modal>

      {}

      {}
      <ReportReasonModal
        visible={!!reportCommentTarget}
        targetName={reportCommentTarget?.author}
        onCancel={() => setReportCommentTarget(null)}
        onConfirm={async (reason) => {
          const target = reportCommentTarget;
          setReportCommentTarget(null);
          if (!target || !accessToken || commentFeedId == null) return;
          try {
            const { reportFeedComment } = await import("../../api/clones");
            await reportFeedComment(
              accessToken,
              commentFeedId,
              target.commentId,
              reason || undefined,
            );
            setToastMessage(
              t("home.toasts.commentReported", {
                defaultValue: "댓글이 신고됐어요",
              }),
            );
          } catch (err) {
            console.warn(`[REPORT-COMMENT] FAILED commentId=${target.commentId}`, err);
            setToastMessage(
              t("home.toasts.reportFailed", {
                defaultValue: "신고에 실패했어요",
              }),
            );
          }
        }}
      />

      {}
      <ReportReasonModal
        visible={!!reportTarget}
        targetName={reportTarget?.author}
        onCancel={() => setReportTarget(null)}
        onConfirm={async (reason) => {
          const target = reportTarget;
          setReportTarget(null);
          if (!target || !accessToken) return;

          try {
            const { reportClone } = await import("../../api/clones");
            await reportClone(accessToken, target.cloneId, reason || undefined);
            setToastMessage(
              t("home.toasts.reportSuccessBlocked", {
                defaultValue: "신고가 접수됐어요. 이 클론은 차단됐어요",
              }),
            );
            const cur = useFeedStore.getState().apiFeeds;
            if (cur) {
              useFeedStore.setState({
                apiFeeds: cur.filter((it) => it.cloneId !== target.cloneId),
              });
            }
            await useFollowStore.getState().unfollowLocalForBlock(target.cloneId);
            void loadDiscover();
          } catch (err) {
            console.warn(`[REPORT] FAILED cloneId=${target.cloneId}`, err);
            setToastMessage(
              t("home.toasts.reportFailed", {
                defaultValue: "신고에 실패했어요",
              }),
            );
          }
        }}
      />

      {toastMessage && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {}
      <VisibilityPickerModal
        visible={!!visibilityPicker}
        currentVisibility={visibilityPicker?.currentVisibility ?? null}
        onClose={() => setVisibilityPicker(null)}
        onSelect={async (v) => {
          const target = visibilityPicker;
          setVisibilityPicker(null);
          if (!target) return;
          if (v === "selected") {
            setFriendPickerCloneId(target.cloneId);
            return;
          }

          const store = useFeedStore.getState();
          if (store.apiFeeds) {
            useFeedStore.setState({
              apiFeeds: store.apiFeeds.map((f) =>
                f.clone.id === target.cloneId
                  ? { ...f, clone: { ...f.clone, visibility: v } }
                  : f,
              ),
            });
          }
          if (!accessToken) return;
          try {
            const { patchClone } = await import("../../api/clones");
            await patchClone(accessToken, target.cloneId, {
              visibility: v,
              allowed_viewers: [],
            });
            setToastMessage(
              t("home.toasts.visibilityUpdated", { defaultValue: "공개 범위가 변경됐어요" }),
            );
          } catch (err) {
            console.warn("[Home] update visibility failed:", err);
            setToastMessage(
              t("home.toasts.visibilityFailed", { defaultValue: "공개 범위 변경에 실패했어요" }),
            );
          }
        }}
      />

      {}
      <FriendPickerModal
        visible={friendPickerCloneId != null}
        onClose={() => setFriendPickerCloneId(null)}
        onConfirm={async (userIds) => {
          const cloneId = friendPickerCloneId;
          setFriendPickerCloneId(null);
          if (!cloneId) return;
          const store = useFeedStore.getState();
          if (store.apiFeeds) {
            useFeedStore.setState({
              apiFeeds: store.apiFeeds.map((f) =>
                f.clone.id === cloneId
                  ? { ...f, clone: { ...f.clone, visibility: "selected" } }
                  : f,
              ),
            });
          }
          if (!accessToken) return;
          try {
            const { patchClone } = await import("../../api/clones");
            await patchClone(accessToken, cloneId, {
              visibility: "selected",
              allowed_viewers: userIds,
            });
            setToastMessage(
              t("home.toasts.visibilityUpdated", { defaultValue: "공개 범위가 변경됐어요" }),
            );
          } catch (err) {
            console.warn("[Home] selected visibility PATCH failed:", err);
          }
        }}
      />

      {}
      <IntimacyEventsSheet
        visible={!!intimacyModal}
        cloneId={intimacyModal?.cloneId ?? null}
        cloneName={intimacyModal?.cloneName ?? ""}
        onClose={() => setIntimacyModal(null)}
      />
      {}
      <GiftReceiptsSheet
        visible={!!giftModal}
        cloneId={giftModal?.cloneId ?? null}
        cloneName={giftModal?.cloneName ?? ""}
        onClose={() => setGiftModal(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.zinc950,
  },
  topOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    zIndex: 40,
  },
  tagsRow: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  topTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: RADIUS.full,
  },
  topTagText: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.white,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },

  commentOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  commentSheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 24, height: "70%" },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.zinc300, alignSelf: "center", marginTop: 12, marginBottom: 12 },
  commentHeaderRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: 12 },

  commentHeaderRowBottom: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingTop: 8, paddingBottom: 4 },

  detailHeader: { paddingBottom: 16, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.zinc100 },

  detailProfileRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingBottom: 12, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.zinc100 },
  detailAvatar: { width: 40, height: 40, borderRadius: 20 },
  detailAuthor: { fontSize: 15, fontWeight: "700", color: COLORS.zinc900 },
  detailUsername: { fontSize: 12, color: COLORS.zinc500, marginTop: 2 },
  detailDescription: { fontSize: 14, color: COLORS.zinc700, lineHeight: 20, marginBottom: 14 },
  detailStatsRow: { flexDirection: "row", gap: 8 },
  detailStatCard: { flex: 1, backgroundColor: COLORS.zinc50, borderRadius: 12, paddingVertical: 10, alignItems: "center" },
  detailStatValue: { fontSize: 16, fontWeight: "700", color: COLORS.zinc900 },
  detailStatLabel: { fontSize: 11, color: COLORS.zinc500, marginTop: 2 },
  commentTitle: { fontSize: 16, fontWeight: "700", color: COLORS.zinc900 },
  commentScroll: { flex: 1 },

  commentBlock: { marginBottom: 16 },

  commentRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },

  replyIndent: { width: 42 },
  commentHeart: { alignItems: "center", paddingHorizontal: 4, paddingTop: 2, minWidth: 28 },
  commentHeartCount: { fontSize: 11, color: COLORS.zinc500, marginTop: 2 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.zinc100 },
  commentInfo: { flex: 1 },
  commentMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  commentAuthor: { fontSize: 13, fontWeight: "600", color: COLORS.zinc900 },
  commentTime: { fontSize: 12, color: COLORS.zinc500 },
  commentContent: { fontSize: 14, color: COLORS.zinc800, lineHeight: 20 },
  emptyComment: { alignItems: "center", paddingVertical: 40 },
  emptyCommentGray: { fontSize: 14, color: COLORS.zinc400 },
  emptyText: { fontSize: 14, color: COLORS.zinc400, marginTop: 8 },
  commentInputRow: { flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: 1, borderTopColor: COLORS.zinc100, paddingTop: 12 },
  commentInput: { flex: 1, height: 40, backgroundColor: COLORS.zinc50 ?? COLORS.zinc100, borderRadius: 20, paddingHorizontal: 16, fontSize: 14, color: COLORS.zinc900 },

  replyActions: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 6 },
  replyActionText: { fontSize: 12, fontWeight: "600", color: COLORS.zinc500 },
  replyToggleText: { fontSize: 12, fontWeight: "600", color: COLORS.zinc500 },
  replyRow: { flexDirection: "row", gap: 8, marginTop: 10, alignItems: "flex-start" },
  replyAvatar: { width: 24, height: 24, borderRadius: 12 },
  replyingBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6, paddingHorizontal: 4, backgroundColor: COLORS.zinc50 ?? COLORS.zinc100, borderRadius: 8, marginTop: 6 },
  replyingText: { fontSize: 12, color: COLORS.zinc600 },

  moreOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  moreSheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 0, paddingHorizontal: 16 },
  moreSheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.zinc300, alignSelf: "center", marginVertical: 12 },
  moreTitle: { fontSize: 13, color: COLORS.zinc500, textAlign: "center", paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.zinc100 },
  moreItem: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.zinc100 },
  moreItemText: { fontSize: 15, fontWeight: "500", color: COLORS.zinc900 },
  toast: { position: "absolute", bottom: 80, alignSelf: "center", paddingHorizontal: 20, paddingVertical: 10, backgroundColor: "rgba(0,0,0,0.85)", borderRadius: RADIUS.full },
  toastText: { color: COLORS.white, fontSize: 14 },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 10,
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
  },
  emptyBtnText: { fontSize: 14, fontWeight: "700", color: COLORS.zinc950 },
});
