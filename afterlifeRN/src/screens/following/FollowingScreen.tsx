import { showAlert } from "../../stores/dialogStore";
import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ScrollView,
  Modal,
  Pressable,
  TextInput,
  Dimensions,
  Animated,
  Alert,
  ActivityIndicator,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SafeView from "../../components/ui/SafeView";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/common/PageHeader";
import NotificationBell from "../../components/common/NotificationBell";
import { useTranslation } from "react-i18next";
import { COLORS, SIZES, RADIUS } from "../../components/constants";
import type { RootStackParamList, MainTabParamList } from "../../navigation/types";
import { useAuthStore } from "../../stores/authStore";
import { useFollowStore } from "../../stores/followStore";
import { seedSource } from "../../api/source";
import {
  listFeedComments,
  postFeedComment,
  postCloneComment,
  deleteFeedComment,
  listMyFollowedClones,
  likeFeed,
  unlikeFeed,
  likeClone,
  unlikeClone,
  listCloneIntimacyEvents,
  getCloneDetail,
  type FeedComment,
  type FollowedClone,
  type IntimacyEventsResponse,
} from "../../api/clones";
import { formatRelativeKo } from "../../lib/relativeTime";
import { useFocusEffect } from "@react-navigation/native";
import type { DomainClone, DomainFeed } from "../../types/domain";
import HashtagText from "../../components/common/HashtagText";
import SwipeDownSheet from "../../components/ui/SwipeDownSheet";

type RootNav = NativeStackNavigationProp<RootStackParamList>;
const { width: SCREEN_W } = Dimensions.get("window");
const DEFAULT_USER_ID = 1;

type FollowedPersona = {
  id: number;
  name: string;
  avatar: string;
  interests: string[];
  creatorAccount: string;
  intimacy: number; 
  interactions: number; 

  isOwn?: boolean;
};

const deriveInteractionsFromStats = (stats?: {
  messages: number;
  gifts: number;
  likes?: number;
  comments?: number;
}): number => {
  const m = stats?.messages ?? 0;
  const g = stats?.gifts ?? 0;
  const l = stats?.likes ?? 0;
  const c = stats?.comments ?? 0;
  return m + g + l + c;
};

type MockComment = { id: string; author: string; avatar: string; content: string; time: string };
const MOCK_COMMENT_AUTHORS: ReadonlyArray<{ author: string; avatar: string; content: string; time: string }> = [
  { author: "@investor_kim", avatar: "https://i.pravatar.cc/100?img=1", content: "정말 유익한 분석입니다! 감사합니다.", time: "5분 전" },
  { author: "@market_lover", avatar: "https://i.pravatar.cc/100?img=5", content: "장기 투자 관점으로 접근하겠습니다.", time: "12분 전" },
  { author: "@finance_pro", avatar: "https://i.pravatar.cc/100?img=3", content: "좋은 인사이트네요", time: "20분 전" },
  { author: "@healing_soul", avatar: "https://i.pravatar.cc/100?img=9", content: "위로가 됩니다. 감사해요", time: "3분 전" },
  { author: "@mindful_life", avatar: "https://i.pravatar.cc/100?img=10", content: "오늘도 힘내세요!", time: "15분 전" },
];
const mockCommentList = (feedId: number): MockComment[] => {
  const count = (feedId * 7) % 4; 
  return MOCK_COMMENT_AUTHORS.slice(0, count).map((c, i) => ({ id: `c-${feedId}-${i}`, ...c }));
};

const toPersona = (clone: DomainClone, ownerHandle?: string): FollowedPersona => ({
  id: clone.id,
  name: clone.displayName,
  avatar: clone.imageUrl ?? "",
  interests: clone.interests,
  creatorAccount: ownerHandle ? `@${ownerHandle}` : "",
  intimacy: 0,
  interactions: 0,
});

const formatCount = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

export default function FollowingScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const rootNav = useNavigation<RootNav>();
  const authUser = useAuthStore((s) => s.user);
  const apiUser = useAuthStore((s) => s.apiUser);
  const follows = useFollowStore((s) => s.follows);
  const toggleFollow = useFollowStore((s) => s.toggleFollow);
  const isFollowing = useFollowStore((s) => s.isFollowing);

  const uid = authUser?.id ?? DEFAULT_USER_ID;
  const accessToken = useAuthStore((s) => s.accessToken);

  const openCloneFeed = async (cloneId: number, feedId?: number) => {
    try {
      const det = await getCloneDetail(cloneId, accessToken ?? undefined);
      const c = det.clone;
      rootNav.navigate("CloneFeed", {
        openComments: true,
        feed: {
          id: feedId && feedId > 0 ? feedId : -c.id,
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
      console.warn("[Following] openCloneFeed failed:", err);
    }
  };

  const [apiFollowed, setApiFollowed] = useState<FollowedClone[] | null>(null);
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const userId = apiUser?.id;
      if (!accessToken || !userId) {
        setApiFollowed(null);
        return;
      }
      console.log(`[Following] fetch start userId=${userId}`);
      listMyFollowedClones(accessToken, userId)
        .then((r) => {
          if (!cancelled) {
            console.log(
              `[Following] followedClones ← ${r.items.length} items`,
              r.items.map((it) => ({
                id: it.id,
                name: it.name,
                isOwn: it.isOwn, 
                "stats.likes": it.stats?.likes,
                "stats.comments": it.stats?.comments,
                "latestFeed.feedId": it.latestFeed?.feedId,
                "latestFeed.likedByMe": it.latestFeed?.likedByMe,

                "my.chat": it.myInteractions?.chat,
                "my.call": it.myInteractions?.call,
                "my.learn": it.myInteractions?.learn,
                "my.feed": it.myInteractions?.feed,
                "my.total": it.myInteractions?.total,
                "my.intimacy": it.myInteractions?.intimacy,
              })),
            );
            setApiFollowed(r.items);
          }
        })
        .catch((err) => {
          console.warn("[Following] listMyFollowedClones failed:", err);
        });
      return () => {
        cancelled = true;
      };
    }, [accessToken, apiUser?.id]),
  );

  const followedPersonas = useMemo<FollowedPersona[]>(() => {
    if (apiFollowed != null) {
      return apiFollowed.map((c) => {

        const my = c.myInteractions;
        const rawInteractions = my ? my.total : deriveInteractionsFromStats(c.stats);
        const rawIntimacy = my ? my.intimacy : Math.min(100, Math.floor(rawInteractions / 50));
        const interactions = c.isOwn ? 0 : rawInteractions;
        const intimacy = c.isOwn ? 0 : rawIntimacy;
        return {
          id: c.id,
          name: c.name,
          avatar: c.avatarUrl ?? "",
          interests: c.interests ?? [],
          creatorAccount: `@${c.username}`,
          intimacy,
          interactions,
          isOwn: c.isOwn,
        };
      });
    }

    if (accessToken) return [];
    const followingCloneIds = follows
      .filter((f) => f.followerUserId === uid)
      .map((f) => f.followingCloneId);
    return followingCloneIds
      .map((cid) => seedSource.clones().find((c) => c.id === cid))
      .filter((c): c is DomainClone => Boolean(c))
      .map((clone) => {
        const owner = seedSource.users().find((u) => u.id === clone.ownerId);
        return toPersona(clone, owner?.handle);
      });
  }, [apiFollowed, accessToken, follows, uid]);

  const feeds = useMemo<DomainFeed[]>(() => {
    if (apiFollowed != null) {
      return apiFollowed.map((c) => {
        const realFeedId = c.latestFeed?.feedId ?? null;

        let desc = c.description ?? "";

        const hasHashtag = /#[a-zA-Z0-9_가-힣ᄀ-ᇿㄱ-ㆎ]+/.test(desc);
        const ints = c.interests ?? [];
        if (!hasHashtag && ints.length > 0) {
          const tags = ints.map((i: string) => `#${i}`).join(" ");
          desc = desc.trim().length > 0 ? `${desc} ${tags}` : tags;
        }
        return {
          id: realFeedId ?? -c.id, 
          cloneId: c.id,
          content: desc,
          mediaUrl: c.avatarUrl ?? undefined,
          mediaType: null,

          likesCount: c.stats.likes ?? 0,
          createdAt: c.createdAt,
        };
      });
    }
    const followingIds = new Set(followedPersonas.map((p) => p.id));
    return seedSource.feeds()
      .filter((f) => followingIds.has(f.cloneId))
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [apiFollowed, followedPersonas]);

  const cloneMetaById = useMemo(() => {
    const map = new Map<number, { likesCount: number; commentsCount: number; likedByMe: boolean }>();
    if (apiFollowed) {
      for (const c of apiFollowed) {
        map.set(c.id, {
          likesCount: c.stats.likes ?? 0,
          commentsCount: c.stats.comments ?? 0,
          likedByMe: c.latestFeed?.likedByMe ?? false,
        });
      }
    }
    return map;
  }, [apiFollowed]);

  const [selectedCategory, setSelectedCategory] = useState(t("feed.categoryAll"));

  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());

  const [countDelta, setCountDelta] = useState<Map<number, { likes: number; comments: number }>>(
    new Map(),
  );

  useEffect(() => {
    if (!apiFollowed) return;
    const next = new Set<number>();
    for (const c of apiFollowed) {
      if (c.latestFeed?.likedByMe) next.add(c.id);
    }
    setLikedPosts(next);
  }, [apiFollowed]);

  const [localFollowedIds, setLocalFollowedIds] = useState<Set<number>>(new Set());
  useEffect(() => {
    if (!apiFollowed) return;
    setLocalFollowedIds(new Set(apiFollowed.map((c) => c.id)));
  }, [apiFollowed]);
  const isFollowingPersona = (cloneId: number) => localFollowedIds.has(cloneId);
  const toggleFollowPersona = async (cloneId: number) => {

    setLocalFollowedIds((prev) => {
      const next = new Set(prev);
      next.has(cloneId) ? next.delete(cloneId) : next.add(cloneId);
      return next;
    });
    await toggleFollow(cloneId); 
  };

  const [commentPostId, setCommentPostId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [unfollowConfirmId, setUnfollowConfirmId] = useState<number | null>(null);

  const [intimacyEventsModal, setIntimacyEventsModal] = useState<{
    cloneId: number;
    cloneName: string;
  } | null>(null);

  const route = useRoute<RouteProp<MainTabParamList, "ShortsTab">>();
  const openedIntimacyRef = useRef<number | null>(null);
  useEffect(() => {
    const cid = route.params?.openIntimacyCloneId;
    if (!cid || openedIntimacyRef.current === cid) return;
    const persona = followedPersonas.find((p) => p.id === cid);
    openedIntimacyRef.current = cid;
    setIntimacyEventsModal({ cloneId: cid, cloneName: persona?.name ?? "" });
  }, [route.params?.openIntimacyCloneId, followedPersonas]);
  const [intimacyEventsData, setIntimacyEventsData] =
    useState<IntimacyEventsResponse | null>(null);
  const [intimacyEventsLoading, setIntimacyEventsLoading] = useState(false);

  const [intimacyInfoModalVisible, setIntimacyInfoModalVisible] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callSearchQuery, setCallSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!intimacyEventsModal) {
      setIntimacyEventsData(null);
      return;
    }
    if (!accessToken) return;
    let cancelled = false;
    setIntimacyEventsLoading(true);
    setIntimacyEventsData(null);
    listCloneIntimacyEvents(accessToken, intimacyEventsModal.cloneId, { limit: 100 })
      .then((res) => {
        if (cancelled) return;
        setIntimacyEventsData(res);
      })
      .catch((err) => {
        console.warn("[Following] listCloneIntimacyEvents failed:", err);
        if (!cancelled) setIntimacyEventsData(null);
      })
      .finally(() => {
        if (!cancelled) setIntimacyEventsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [intimacyEventsModal, accessToken]);

  const scrollY = useRef(0);
  const fabAnim = useRef(new Animated.Value(0)).current; 

  const onFeedScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentY = e.nativeEvent.contentOffset.y;
    const diff = currentY - scrollY.current;
    if (diff > 8 && currentY > 50) {

      Animated.timing(fabAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    } else if (diff < -8) {

      Animated.timing(fabAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start();
    }
    scrollY.current = currentY;
  }, [fabAnim]);

  const fabTranslateY = fabAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 120] });

  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 2000);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  const categories = useMemo(() => {
    const tags = new Set<string>();
    followedPersonas.forEach((p) => p.interests.forEach((i) => tags.add(i)));
    return [t("feed.categoryAll"), ...Array.from(tags)];
  }, [followedPersonas]);

  const posts = useMemo(() => {
    let filtered = feeds;
    if (selectedCategory !== t("feed.categoryAll")) {
      const ids = followedPersonas
        .filter((p) => p.interests.includes(selectedCategory))
        .map((p) => p.id);
      filtered = filtered.filter((f) => ids.includes(f.cloneId));
    }
    return filtered
      .map((feed) => {
        const persona = followedPersonas.find((p) => p.id === feed.cloneId);
        return persona ? { feed, persona } : null;
      })
      .filter((x): x is { feed: DomainFeed; persona: FollowedPersona } =>
        Boolean(x),
      );
  }, [feeds, selectedCategory, followedPersonas]);

  const filteredCallList = useMemo(() => {
    if (!callSearchQuery.trim()) return followedPersonas;
    const q = callSearchQuery.toLowerCase();
    return followedPersonas.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.creatorAccount.toLowerCase().includes(q),
    );
  }, [callSearchQuery, followedPersonas]);

  const toggleLikeForClone = async (cloneId: number, feedId: number) => {
    const wasLiked = likedPosts.has(cloneId);
    const willLike = !wasLiked;

    setLikedPosts((prev) => {
      const s = new Set(prev);
      willLike ? s.add(cloneId) : s.delete(cloneId);
      return s;
    });
    setCountDelta((prev) => {
      const next = new Map(prev);
      const cur = next.get(cloneId) ?? { likes: 0, comments: 0 };
      next.set(cloneId, { ...cur, likes: cur.likes + (willLike ? 1 : -1) });
      return next;
    });
    if (!accessToken) return;
    try {
      if (feedId > 0) {
        if (willLike) await likeFeed(accessToken, feedId);
        else await unlikeFeed(accessToken, feedId);
      } else {
        if (willLike) await likeClone(accessToken, cloneId);
        else await unlikeClone(accessToken, cloneId);
      }
    } catch (err) {
      console.warn("[Following] toggleLike failed:", err);

      setLikedPosts((prev) => {
        const s = new Set(prev);
        wasLiked ? s.add(cloneId) : s.delete(cloneId);
        return s;
      });
      setCountDelta((prev) => {
        const next = new Map(prev);
        const cur = next.get(cloneId) ?? { likes: 0, comments: 0 };
        next.set(cloneId, { ...cur, likes: cur.likes - (willLike ? 1 : -1) });
        return next;
      });
    }
  };

  const confirmUnfollow = async () => {
    if (unfollowConfirmId) {
      await toggleFollow(unfollowConfirmId);
      setUnfollowConfirmId(null);
    }
  };

  const myUserId = useAuthStore((s) => s.apiUser?.id ?? s.user?.id ?? null);
  const [apiComments, setApiComments] = useState<FeedComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  useEffect(() => {
    if (commentPostId == null) {
      setApiComments([]);
      return;
    }
    if (commentPostId < 0) {
      setApiComments([]);
      return;
    }
    let cancelled = false;
    setCommentsLoading(true);
    setApiComments([]);
    listFeedComments(commentPostId, { limit: 100 })
      .then((res) => {
        if (cancelled) return;
        setApiComments(res.items);
      })
      .catch((err) => {
        console.warn("[Following] listFeedComments failed:", err);
        if (!cancelled) setApiComments([]);
      })
      .finally(() => {
        if (!cancelled) setCommentsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [commentPostId]);

  const submittingRef = useRef(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const submitComment = async () => {
    if (commentPostId == null) return;
    if (submittingRef.current) return; 
    const content = commentText.trim();
    if (!content || !accessToken) return;
    submittingRef.current = true;
    setSubmittingComment(true);
    try {
      let realFeedId: number;
      let cloneIdForDelta: number;
      if (commentPostId < 0) {
        const cloneId = -commentPostId;
        cloneIdForDelta = cloneId;
        const res = await postCloneComment(accessToken, cloneId, content);
        realFeedId = res.comment.feedId;
        setCommentPostId(realFeedId);
      } else {
        await postFeedComment(accessToken, commentPostId, content);
        realFeedId = commentPostId;

        const matchedClone = apiFollowed?.find((c) => c.latestFeed?.feedId === commentPostId);
        cloneIdForDelta = matchedClone?.id ?? -1;
      }
      setCommentText("");
      const r = await listFeedComments(realFeedId, { limit: 100 });
      setApiComments(r.items);

      if (cloneIdForDelta > 0) {
        setCountDelta((prev) => {
          const next = new Map(prev);
          const cur = next.get(cloneIdForDelta) ?? { likes: 0, comments: 0 };
          next.set(cloneIdForDelta, { ...cur, comments: cur.comments + 1 });
          return next;
        });
      }
    } catch (err) {
      console.warn("[Following] postFeedComment failed:", err);
    } finally {
      submittingRef.current = false;
      setSubmittingComment(false);
    }
  };

  const deleteComment = (commentId: number) => {
    if (commentPostId == null || commentPostId < 0 || !accessToken) return;
    showAlert(
      t("home.commentDeleteTitle"),
      t("home.commentDeleteDesc"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteFeedComment(accessToken, commentPostId, commentId);
              setApiComments((prev) => prev.filter((c) => c.id !== commentId));

              const matchedClone = apiFollowed?.find(
                (c) => c.latestFeed?.feedId === commentPostId,
              );
              if (matchedClone) {
                setCountDelta((prev) => {
                  const next = new Map(prev);
                  const cur = next.get(matchedClone.id) ?? { likes: 0, comments: 0 };
                  next.set(matchedClone.id, { ...cur, comments: cur.comments - 1 });
                  return next;
                });
              }
            } catch (err) {
              console.warn("[Following] deleteFeedComment failed:", err);
            }
          },
        },
      ],
    );
  };

  const renderPost = ({ item }: { item: (typeof posts)[0] }) => {
    const feedImage = item.feed.mediaUrl ?? item.persona.avatar;
    return (
      <View style={s.postWrap}>
        {}
        <View style={s.imageWrap}>
          <Image source={{ uri: feedImage }} style={s.postImage} resizeMode="cover" />

          {}
          <View style={s.statsBadge}>
            <TouchableOpacity
              style={s.badgeBtn}
              onPress={() =>
                setIntimacyEventsModal({
                  cloneId: item.persona.id,
                  cloneName: item.persona.name,
                })
              }
            >
              <Feather name="thermometer" size={12} color="#fb923c" />
              <Text style={s.badgeText}>{item.persona.intimacy}</Text>
            </TouchableOpacity>
            {}
            <View style={s.badgeDivider} />
            <TouchableOpacity
              style={s.badgeBtn}
              onPress={() => openCloneFeed(item.persona.id, item.feed.id > 0 ? item.feed.id : undefined)}
            >
              <Feather name="message-circle" size={12} color="#34d399" />
              <Text style={s.badgeText}>
                {(cloneMetaById.get(item.persona.id)?.commentsCount ?? 0) +
                  (countDelta.get(item.persona.id)?.comments ?? 0)}
              </Text>
            </TouchableOpacity>
          </View>

          {}
          <View style={s.overlayContent}>
            <Text style={s.personaName}>{item.persona.name}</Text>
            {item.persona.creatorAccount ? (
              <Text style={s.creatorAccount}>{item.persona.creatorAccount}</Text>
            ) : null}
            {
}
            <HashtagText style={s.postContent} numberOfLines={3}>
              {item.feed.content}
            </HashtagText>
            <View style={s.overlayBtns}>
              <Button
                title={t("feed.actionCall")}
                variant="secondary"
                size="md"
                leftIcon={<Feather name="video" size={14} color={COLORS.zinc900} />}
                onPress={() =>
                  rootNav.navigate("Call", {
                    cloneId: item.persona.id,
                    name: item.persona.name,
                    image: item.persona.avatar,
                  })
                }
                style={s.overlayBtn}
                textColor={COLORS.zinc900}
                backgroundColor={COLORS.white}
              />
              {(() => {

                if (item.persona.isOwn) return null;
                const followed = isFollowingPersona(item.persona.id);
                return (
                  <Button
                    title={followed ? t("feed.following") : t("feed.follow")}
                    variant="ghost"
                    size="md"
                    leftIcon={
                      <Feather
                        name={followed ? "user-check" : "user-plus"}
                        size={14}
                        color={COLORS.white}
                      />
                    }
                    onPress={() => void toggleFollowPersona(item.persona.id)}
                    style={{ ...s.overlayBtn, ...s.overlayBtnGhost }}
                    textColor={COLORS.white}
                    backgroundColor={followed ? "rgba(255,255,255,0.2)" : COLORS.violet600}
                  />
                );
              })()}
            </View>
          </View>
        </View>

      </View>
    );
  };

  return (
    <SafeView backgroundColor={COLORS.white} showBottomBackground={false}>
      <PageHeader
        title="Subscribe"
        rightAction={<NotificationBell />}
      />

      {}

      {}
      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.feed.id)}
        renderItem={renderPost}
        contentContainerStyle={s.feed}
        showsVerticalScrollIndicator={false}
        onScroll={onFeedScroll}
        scrollEventThrottle={16}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <Feather name="users" size={48} color={COLORS.zinc300} />
            <Text style={s.emptyTitle}>{t("feed.followingEmpty")}</Text>
            <Text style={s.emptyDesc}>{t("feed.followingEmptyHint")}</Text>
          </View>
        }
      />

      {}
      <Animated.View style={[s.floatingCallBtn, { transform: [{ translateY: fabTranslateY }] }]}>
        <TouchableOpacity
          style={s.floatingCallBtnInner}
          activeOpacity={0.8}
          onPress={() => { setCallSearchQuery(""); setShowCallModal(true); }}
        >
          <Feather name="phone" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </Animated.View>

      {}
      <Modal visible={!!intimacyEventsModal} transparent animationType="slide">
        <Pressable style={s.bottomOverlay} onPress={() => setIntimacyEventsModal(null)}>
          <SwipeDownSheet
            onClose={() => setIntimacyEventsModal(null)}
            style={[s.eventsSheet, { paddingBottom: 32 + Math.max(insets.bottom, 0) }]}
          >
            <View style={s.eventsSheetHandle} />
            <View style={s.eventsSheetTitleRow}>
              <View style={{ width: 28 }} />
              <Text style={s.eventsSheetTitle}>{t("feed.eventsTitle")}</Text>
              {}
              <TouchableOpacity
                onPress={() => setIntimacyInfoModalVisible(true)}
                hitSlop={8}
                style={{ width: 28, alignItems: "flex-end" }}
              >
                <Feather name="help-circle" size={20} color={COLORS.zinc400} />
              </TouchableOpacity>
            </View>
            <Text style={s.eventsSheetSub}>{intimacyEventsModal?.cloneName}</Text>

            {intimacyEventsData?.summary && (
              <View style={s.eventsSummary}>
                <View style={s.eventsSummaryRow}>
                  <Feather name="thermometer" size={20} color="#fb923c" />
                  <Text style={s.eventsSummaryScore}>
                    {Math.min(100, intimacyEventsData.summary.totalScore)}°C
                  </Text>
                  <Text style={s.eventsSummaryCount}>
                    · {t("feed.summaryCount", { n: intimacyEventsData.summary.eventCount })}
                  </Text>
                </View>
                <View style={s.eventsBreakdownRow}>
                  <Text style={s.eventsBreakdownItem}>{t("feed.summaryLabelChat")} <Text style={s.eventsBreakdownVal}>{intimacyEventsData.summary.chat}°C</Text></Text>
                  <Text style={s.eventsBreakdownItem}>{t("feed.summaryLabelCall")} <Text style={s.eventsBreakdownVal}>{intimacyEventsData.summary.call}°C</Text></Text>
                  <Text style={s.eventsBreakdownItem}>{t("feed.summaryLabelLearn")} <Text style={s.eventsBreakdownVal}>{intimacyEventsData.summary.learn}°C</Text></Text>
                  <Text style={s.eventsBreakdownItem}>{t("feed.summaryLabelFeed")} <Text style={s.eventsBreakdownVal}>{intimacyEventsData.summary.feed}°C</Text></Text>
                </View>
              </View>
            )}

            <ScrollView style={s.eventsScrollArea} showsVerticalScrollIndicator={false}>
              {intimacyEventsLoading ? (
                <ActivityIndicator color={COLORS.zinc500} style={{ paddingVertical: 24 }} />
              ) : !intimacyEventsData || intimacyEventsData.items.length === 0 ? (
                <View style={{ paddingVertical: 24, alignItems: "center" }}>
                  <Text style={{ color: COLORS.zinc500, fontSize: 13 }}>{t("feed.emptyEvents")}</Text>
                </View>
              ) : (
                intimacyEventsData.items.map((ev) => {
                  const META: Record<
                    "chat" | "call" | "learn" | "feed",
                    { label: string; icon: keyof typeof Feather.glyphMap; color: string }
                  > = {
                    chat: { label: t("feed.actionLabelChat"), icon: "message-circle", color: "#60a5fa" },
                    call: { label: t("feed.actionLabelCall"), icon: "phone", color: "#34d399" },
                    learn: { label: t("feed.actionLabelLearn"), icon: "search", color: "#a78bfa" },
                    feed: { label: t("feed.actionLabelFeed"), icon: "heart", color: "#ef4444" },
                  };
                  const meta = META[ev.action];
                  return (
                    <View key={ev.id} style={s.eventRow}>
                      <View style={[s.eventIcon, { backgroundColor: meta.color + "22" }]}>
                        <Feather name={meta.icon} size={14} color={meta.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.eventLabel}>{meta.label}</Text>
                        <Text style={s.eventTime}>{formatRelativeKo(ev.createdAt)}</Text>
                      </View>
                      <Text style={s.eventScore}>+{ev.score}°C</Text>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </SwipeDownSheet>
        </Pressable>
      </Modal>

      {}
      <Modal visible={intimacyInfoModalVisible} transparent animationType="fade">
        <Pressable
          style={s.centerOverlay}
          onPress={() => setIntimacyInfoModalVisible(false)}
        >
          <Pressable style={s.infoBox} onPress={(e) => e.stopPropagation()}>
            <View style={s.infoHeader}>
              <View style={s.infoHeaderLeft}>
                <Feather name="thermometer" size={18} color="#fb923c" />
                <Text style={s.infoTitle}>{t("feed.intimacyInfoTitle")}</Text>
              </View>
              <TouchableOpacity onPress={() => setIntimacyInfoModalVisible(false)}>
                <Feather name="x" size={20} color={COLORS.zinc400} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
              <Text style={s.infoSectionTitleInline}>{t("feed.intimacyTempSectionLabel")}</Text>
              <Text style={s.infoDescInline}>{t("feed.intimacyTempShortDesc")}</Text>
              {[
                ["0-30°C", t("feed.intimacyL1")],
                ["31-60°C", t("feed.intimacyL2")],
                ["61-90°C", t("feed.intimacyL3")],
                ["91-100°C", t("feed.intimacyL4")],
              ].map(([range, desc], i) => (
                <View key={i} style={s.levelRow}>
                  <Text style={[s.levelRange, i === 3 && { color: "#f97316" }]}>{range}</Text>
                  <Text style={[s.levelDesc, i === 3 && { color: "#f97316" }]}>{desc}</Text>
                </View>
              ))}
              <Text style={s.infoSectionTitleInline}>{t("feed.intimacyHowToTitle")}</Text>
              <View style={s.activityBox}>
                <Text style={s.activityItem}>• {t("feed.intimacyHowChat")}</Text>
                <Text style={s.activityItem}>• {t("feed.intimacyHowCall")}</Text>
                <Text style={s.activityItem}>• {t("feed.intimacyHowLearn")}</Text>
                <Text style={s.activityItem}>• {t("feed.intimacyHowFeed")}</Text>
              </View>
              <Text style={s.infoFootnote}>{t("feed.intimacyFootnote")}</Text>
            </ScrollView>
            <Button
              title={t("common.ok")}
              variant="primary"
              onPress={() => setIntimacyInfoModalVisible(false)}
              style={{ marginTop: 16, width: "100%", borderRadius: RADIUS.full }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {}
      <Modal visible={!!commentPostId} transparent animationType="slide">
        <Pressable style={s.bottomOverlay} onPress={() => setCommentPostId(null)}>
          <View
            style={[s.commentSheet, { paddingBottom: 24 + Math.max(insets.bottom, 0) }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={s.sheetHandle} />
            <View style={s.commentHeaderRow}>
              <Text style={s.commentTitle}>{t("feed.commentCount", { n: apiComments.length })}</Text>
              <TouchableOpacity onPress={() => setCommentPostId(null)}>
                <Feather name="x" size={20} color={COLORS.zinc600} />
              </TouchableOpacity>
            </View>
            <ScrollView style={s.commentScroll} showsVerticalScrollIndicator={false}>
              {commentsLoading ? (
                <View style={s.emptyComment}>
                  <Feather name="loader" size={28} color={COLORS.zinc300} />
                </View>
              ) : apiComments.length > 0 ? (
                apiComments.map((c) => (
                  <View key={c.id} style={s.commentRow}>
                    {c.user.avatarUrl ? (
                      <Image source={{ uri: c.user.avatarUrl }} style={s.commentAvatar} />
                    ) : (
                      <View style={[s.commentAvatar, { backgroundColor: COLORS.zinc200 }]} />
                    )}
                    <View style={s.commentInfo}>
                      <View style={s.commentMeta}>
                        <Text style={s.commentAuthor}>{c.user.name ?? c.user.email}</Text>
                        <Text style={s.commentTime}>{formatRelativeKo(c.createdAt)}</Text>
                        {c.userId === myUserId && (
                          <TouchableOpacity onPress={() => deleteComment(c.id)} style={{ marginLeft: 8 }}>
                            <Feather name="trash-2" size={14} color={COLORS.zinc400} />
                          </TouchableOpacity>
                        )}
                      </View>
                      <Text style={s.commentContent}>{c.content}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={s.emptyComment}>
                  <Feather name="message-circle" size={40} color={COLORS.zinc300} />
                  <Text style={s.emptyText}>{t("feed.commentsEmpty")}</Text>
                  <Text style={s.emptySubText}>{t("feed.commentsEmptyHint")}</Text>
                </View>
              )}
            </ScrollView>
            <View style={s.commentInputRow}>
              <TextInput
                style={s.commentInput}
                value={commentText}
                onChangeText={setCommentText}
                placeholder={t("feed.commentPlaceholder")}
                placeholderTextColor={COLORS.placeholder}
              />
              <TouchableOpacity
                disabled={!commentText.trim() || !accessToken || submittingComment}
                onPress={submitComment}
              >
                <Feather
                  name="send"
                  size={18}
                  color={
                    commentText.trim() && accessToken && !submittingComment
                      ? COLORS.zinc900
                      : COLORS.zinc400
                  }
                />
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {}
      <Modal visible={!!unfollowConfirmId} transparent animationType="fade">
        <Pressable style={s.centerOverlay} onPress={() => setUnfollowConfirmId(null)}>
          <Pressable style={s.confirmBox} onPress={(e) => e.stopPropagation()}>
            <Text style={s.confirmTitle}>{t("feed.unfollowTitle")}</Text>
            <Text style={s.confirmDesc}>
              {t("feed.unfollowDesc")}
            </Text>
            <View style={s.confirmBtns}>
              <Button title={t("common.cancel")} variant="ghost" onPress={() => setUnfollowConfirmId(null)} style={{ flex: 1 }} />
              <Button title={t("feed.unfollowTitle")} variant="danger" onPress={confirmUnfollow} style={{ flex: 1 }} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {}
      <Modal visible={showCallModal} transparent animationType="slide">
        <Pressable style={s.bottomOverlay} onPress={() => setShowCallModal(false)}>
          <View
            style={[s.callSheet, { paddingBottom: 24 + Math.max(insets.bottom, 0) }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={s.sheetHandle} />
            <View style={s.callSheetHeader}>
              <Text style={s.callSheetTitle}>{t("feed.callSheetTitle")}</Text>
              <TouchableOpacity onPress={() => setShowCallModal(false)}>
                <Feather name="x" size={20} color={COLORS.zinc600} />
              </TouchableOpacity>
            </View>

            {}
            <View style={s.callSearchWrap}>
              <Feather name="search" size={18} color={COLORS.zinc400} />
              <TextInput
                style={s.callSearchInput}
                value={callSearchQuery}
                onChangeText={setCallSearchQuery}
                placeholder={t("feed.callSearchPlaceholder")}
                placeholderTextColor={COLORS.placeholder}
              />
              {callSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setCallSearchQuery("")}>
                  <Feather name="x-circle" size={16} color={COLORS.zinc400} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={s.callScroll} showsVerticalScrollIndicator={false}>
              {
}

              {}
              <View style={s.callSection}>
                <Text style={s.callSectionTitle}>{callSearchQuery ? t("feed.searchResults") : t("feed.followingList")}</Text>
                {filteredCallList.length > 0 ? filteredCallList.map((p) => (
                  <View key={p.id} style={s.callRow}>
                    <Image source={{ uri: p.avatar }} style={s.callAvatar} />
                    <View style={s.callInfo}>
                      <Text style={s.callName}>{p.name}</Text>
                      <Text style={s.callSub}>{p.creatorAccount}</Text>
                    </View>
                    <TouchableOpacity
                      style={s.callBtn}
                      onPress={() => { setShowCallModal(false); rootNav.navigate("Call", { cloneId: p.id, name: p.name, image: p.avatar }); }}
                    >
                      <Feather name="video" size={14} color={COLORS.white} />
                      <Text style={s.callBtnText}>{t("feed.callRowAction")}</Text>
                    </TouchableOpacity>
                  </View>
                )) : null}
              </View>
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {}
      {toastMessage && (
        <View style={s.toast}><Text style={s.toastText}>{toastMessage}</Text></View>
      )}
    </SafeView>
  );
}

const s = StyleSheet.create({

  tabWrap: { borderBottomWidth: 1, borderBottomColor: COLORS.zinc200 },
  tabRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: COLORS.zinc100 },
  tabActive: { backgroundColor: COLORS.zinc900 },
  tabText: { fontSize: 13, fontWeight: "500", color: COLORS.zinc600 },
  tabTextActive: { color: COLORS.white },

  feed: { padding: 16, gap: 16 },
  postWrap: { marginBottom: 8 },

  imageWrap: { borderRadius: 24, overflow: "hidden", backgroundColor: COLORS.zinc100 },
  postImage: { width: "100%", aspectRatio: 3 / 4 },
  overlayContent: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    padding: 24, paddingTop: 30, backgroundColor: "rgba(0,0,0,0.45)",
  },
  personaName: { fontSize: 16, fontWeight: "700", color: COLORS.white },
  creatorAccount: { fontSize: 12, color: COLORS.white, marginBottom: 8, opacity: 0.8 },
  tagRow: { flexDirection: "row", gap: 6, marginBottom: 10 },
  overlayTag: { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: RADIUS.full },
  overlayTagText: { fontSize: 11, color: COLORS.white },
  postContent: { fontSize: 14, color: "rgba(255,255,255,0.9)", lineHeight: 20, marginBottom: 16 },
  overlayBtns: { flexDirection: "row", gap: 10 },
  overlayBtn: { flex: 1, borderRadius: RADIUS.full },
  overlayBtnGhost: { borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" },

  statsBadge: {
    position: "absolute", top: 16, right: 16, flexDirection: "row", alignItems: "center",
    gap: 4, paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: "rgba(0,0,0,0.6)", borderRadius: RADIUS.full, zIndex: 10,
  },
  badgeBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  badgeText: { fontSize: 11, fontWeight: "600", color: COLORS.white },
  badgeDivider: { width: 1, height: 12, backgroundColor: "rgba(255,255,255,0.3)" },

  actionsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 4, paddingVertical: 12 },
  actionsLeft: { flexDirection: "row", gap: 16 },
  actionsRight: { alignItems: "flex-end" },
  countText: { fontSize: 12, fontWeight: "600", color: COLORS.zinc900 },
  countTextSub: { fontSize: 12, color: COLORS.zinc500, marginTop: 2 },

  floatingCallBtn: {
    position: "absolute", right: 24, bottom: 24,
    zIndex: 50,
  },
  floatingCallBtnInner: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: COLORS.zinc900, alignItems: "center", justifyContent: "center",
    elevation: 8, shadowColor: COLORS.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12,
  },

  centerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 },
  bottomOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },

  infoBox: { backgroundColor: COLORS.white, borderRadius: 20, padding: 24, maxWidth: 360, width: "100%" },
  infoHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  infoHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoTitle: { fontSize: 18, fontWeight: "600", color: COLORS.zinc900 },
  infoDesc: { fontSize: 14, color: COLORS.zinc600, lineHeight: 20, marginBottom: 16 },
  levelRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  levelRange: { width: 80, fontSize: 14, fontWeight: "500", color: COLORS.zinc700 },
  levelDesc: { fontSize: 14, color: COLORS.zinc500 },
  activityBox: { backgroundColor: "#eff6ff", borderRadius: RADIUS.lg, padding: 16 },
  activityBoxTitle: { fontSize: 12, fontWeight: "500", color: "#2563eb", marginBottom: 8 },
  activityItem: { fontSize: 14, color: "#1e3a5f", marginBottom: 4 },

  confirmBox: { backgroundColor: COLORS.white, borderRadius: 20, padding: 24, maxWidth: 360, width: "100%", alignItems: "center" },
  confirmTitle: { fontSize: 18, fontWeight: "600", color: COLORS.zinc900, marginBottom: 8 },
  confirmDesc: { fontSize: 14, color: COLORS.zinc600, textAlign: "center", lineHeight: 20, marginBottom: 20 },
  confirmBtns: { flexDirection: "row", gap: 12, width: "100%" },

  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.zinc300, alignSelf: "center", marginTop: 12, marginBottom: 12 },
  commentSheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 24, height: "70%" },
  commentHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  commentTitle: { fontSize: 16, fontWeight: "700", color: COLORS.zinc900 },
  commentScroll: { flex: 1 },
  commentRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.zinc200 },
  commentInfo: { flex: 1 },
  commentMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  commentAuthor: { fontSize: 13, fontWeight: "600", color: COLORS.zinc900 },
  commentTime: { fontSize: 12, color: COLORS.zinc400 },
  commentContent: { fontSize: 14, color: COLORS.zinc700, lineHeight: 20 },
  emptyComment: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 14, color: COLORS.zinc400, marginTop: 8 },
  emptySubText: { fontSize: 12, color: COLORS.zinc400, marginTop: 2 },
  commentInputRow: { flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: 1, borderTopColor: COLORS.zinc200, paddingTop: 12 },
  commentInput: { flex: 1, height: 40, backgroundColor: COLORS.zinc100, borderRadius: RADIUS.full, paddingHorizontal: 16, fontSize: 14, color: COLORS.zinc900 },

  callSheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 24, height: "70%" },
  callSheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  callSheetTitle: { fontSize: 18, fontWeight: "700", color: COLORS.zinc900 },
  callSearchWrap: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: COLORS.zinc100, borderRadius: RADIUS.full, paddingHorizontal: 16, height: 44, marginBottom: 16 },
  callSearchInput: { flex: 1, fontSize: 14, color: COLORS.zinc900 },
  callScroll: { flex: 1 },
  callSectionBordered: { marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.zinc200 },
  callSection: { marginBottom: 20 },
  callSectionTitle: { fontSize: 14, fontWeight: "600", color: COLORS.zinc900, marginBottom: 12 },
  callRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  callAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.zinc200 },
  callInfo: { flex: 1 },
  callName: { fontSize: 15, fontWeight: "600", color: COLORS.zinc900 },
  callSub: { fontSize: 12, color: COLORS.zinc500, marginTop: 1 },
  callMeta: { fontSize: 11, color: COLORS.zinc400, marginTop: 2 },
  callBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: COLORS.zinc900, borderRadius: RADIUS.full },
  callBtnText: { fontSize: 13, fontWeight: "600", color: COLORS.white },

  toast: { position: "absolute", bottom: 100, alignSelf: "center", paddingHorizontal: 24, paddingVertical: 12, backgroundColor: "rgba(0,0,0,0.8)", borderRadius: RADIUS.full },
  toastText: { fontSize: 14, color: COLORS.white },

  emptyWrap: { alignItems: "center", justifyContent: "center", paddingVertical: 80, paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: COLORS.zinc700 },
  emptyDesc: { fontSize: 13, color: COLORS.zinc500, textAlign: "center" },

  eventsSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    maxHeight: "80%",
  },
  eventsSheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.zinc300, alignSelf: "center", marginBottom: 12,
  },
  eventsSheetTitle: { fontSize: 17, fontWeight: "700", color: COLORS.zinc900, textAlign: "center" },
  eventsSheetSub: { fontSize: 13, color: COLORS.zinc500, textAlign: "center", marginTop: 4, marginBottom: 12 },
  eventsSummary: { paddingHorizontal: 4, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.zinc100, marginBottom: 8 },
  eventsSummaryRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  eventsSummaryScore: { fontSize: 24, fontWeight: "700", color: "#fb923c" },
  eventsSummaryCount: { fontSize: 13, color: COLORS.zinc500 },
  eventsBreakdownRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  eventsBreakdownItem: { fontSize: 12, color: COLORS.zinc500 },
  eventsBreakdownVal: { color: COLORS.zinc900, fontWeight: "600" },
  eventsScrollArea: { maxHeight: 400 },
  eventRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.zinc100 },
  eventIcon: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  eventLabel: { fontSize: 14, fontWeight: "600", color: COLORS.zinc900 },
  eventTime: { fontSize: 11, color: COLORS.zinc500, marginTop: 2 },
  eventScore: { fontSize: 14, fontWeight: "700", color: "#fb923c" },
  eventsSheetTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 },

  centerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 24 },
  infoBox: { width: "100%", maxWidth: 360, backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 20 },
  infoHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  infoHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoTitle: { fontSize: 17, fontWeight: "700", color: COLORS.zinc900 },
  infoDescInline: { fontSize: 13, color: COLORS.zinc600, lineHeight: 20, marginBottom: 10 },
  infoSectionTitleInline: { fontSize: 14, fontWeight: "700", color: COLORS.zinc900, marginTop: 12, marginBottom: 8 },
  infoFootnote: { fontSize: 11, color: COLORS.zinc500, lineHeight: 16, marginTop: 12 },
  levelRow: { flexDirection: "row", alignItems: "center", paddingVertical: 4 },
  levelRange: { width: 90, fontSize: 13, fontWeight: "600", color: COLORS.zinc700 },
  levelDesc: { fontSize: 13, color: COLORS.zinc500 },
  activityBox: { backgroundColor: COLORS.zinc50, borderRadius: 8, padding: 12, gap: 6 },
  activityItem: { fontSize: 13, color: COLORS.zinc700, lineHeight: 20 },
});
