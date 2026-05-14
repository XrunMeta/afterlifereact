

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Share,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  Image,
  Keyboard,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAndroidNavigationBarHeight } from "react-native-navigation-bar-height";
import { useTranslation } from "react-i18next";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import FeedCard from "../../components/ui/FeedCard";
import type { FeedItem } from "../../types/feed";
import { useAuthStore } from "../../stores/authStore";
import { useFollowStore } from "../../stores/followStore";
import { useFeedStore } from "../../stores/feedStore";
import {
  likeClone,
  unlikeClone,
  listFeedComments,
  postFeedComment,
  postCloneComment,
  deleteFeedComment,
  type FeedComment,
} from "../../api/clones";
import { formatRelativeKo } from "../../lib/relativeTime";
import { COLORS } from "../../components/constants";

type Props = NativeStackScreenProps<RootStackParamList, "CloneFeed">;

export default function CloneFeedScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { feed } = route.params;
  const insets = useSafeAreaInsets();
  const navBarHeight = useAndroidNavigationBarHeight(0);

  const { height: SCREEN_HEIGHT } = Dimensions.get("window");
  const bottomInset = navBarHeight > 0 ? navBarHeight : insets.bottom;
  const cardHeight = SCREEN_HEIGHT - bottomInset;

  const myUserId = useAuthStore((s) => s.apiUser?.id ?? s.user?.id ?? null);
  const accessToken = useAuthStore((s) => s.accessToken);

  const follows = useFollowStore((s) => s.follows);
  const isFollowing = useFollowStore((s) => s.isFollowing);
  const toggleFollow = useFollowStore((s) => s.toggleFollow);
  const likedIds = useFeedStore((s) => s.likedIds);
  const toggleLike = useFeedStore((s) => s.toggleLike);
  void follows; 

  let description = feed.content ?? "";
  const hasHashtag = /#[\p{L}\p{N}_]+/u.test(description);
  if (feed.interests.length > 0 && !hasHashtag) {
    const tags = feed.interests.map((i) => `#${i}`).join(" ");
    description = description.trim().length > 0 ? `${description} ${tags}` : tags;
  }

  const [likesCount, setLikesCount] = useState<number>(feed.likesCount);
  const [commentsCount, setCommentsCount] = useState<number>(feed.commentsCount ?? 0);

  const [realFeedId, setRealFeedId] = useState<number>(feed.id);

  const item: FeedItem = {
    id: realFeedId,
    cloneId: feed.cloneId,
    cloneOwnerId: feed.clone.ownerId,
    cloneVisibility: feed.clone.visibility,
    author: feed.clone.name,
    username: `@${feed.clone.username}`,
    authorAvatar: feed.clone.avatarUrl ?? "",
    image: feed.mediaUrl ?? feed.clone.avatarUrl ?? "",
    title: feed.clone.name,
    description,
    type: feed.clone.cloneType,
    mainCategory: "",
    interests: feed.interests,
    likes: String(likesCount),
    comments: commentsCount,
  };

  const [liked, setLiked] = useState<boolean>(feed.likedByMe ?? likedIds.includes(realFeedId));
  const isOwn = myUserId != null && item.cloneOwnerId === myUserId;

  const handleLike = async () => {
    const next = !liked;
    setLiked(next);
    toggleLike(item.id);

    setLikesCount((prev) => Math.max(0, prev + (next ? 1 : -1)));
    if (!accessToken) return;
    try {
      if (next) await likeClone(accessToken, item.cloneId);
      else await unlikeClone(accessToken, item.cloneId);
    } catch (err) {
      console.warn("[CloneFeed] like toggle failed:", err);

      setLiked(!next);
      setLikesCount((prev) => Math.max(0, prev + (next ? -1 : 1)));
    }
  };

  const handleCall = () => {
    navigation.navigate("Call", {
      cloneId: item.cloneId,
      name: item.author,
      image: item.image,
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${item.author} 페르소나와 만나보세요!\nhttps://afterlife.app/clone/${item.cloneId}`,
        title: item.author,
      });
    } catch (err) {
      console.warn("[CloneFeed] share failed:", err);
    }
  };

  const [commentOpen, setCommentOpen] = useState(false);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const submittingRef = useRef(false);
  const [submittingComment, setSubmittingComment] = useState(false);

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

  useEffect(() => {
    if (!commentOpen) {
      setComments([]);
      return;
    }
    if (realFeedId < 0) {
      setComments([]);
      return;
    }
    let cancelled = false;
    setCommentsLoading(true);
    setComments([]);
    listFeedComments(realFeedId, { limit: 100 })
      .then((res) => {
        if (cancelled) return;
        setComments(res.items);
      })
      .catch((err) => {
        console.warn("[CloneFeed] listFeedComments failed:", err);
        if (!cancelled) setComments([]);
      })
      .finally(() => {
        if (!cancelled) setCommentsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [commentOpen, realFeedId]);

  const submitComment = async () => {
    if (submittingRef.current) return;
    const content = commentText.trim();
    if (!content || !accessToken) return;
    submittingRef.current = true;
    setSubmittingComment(true);
    try {
      let targetFeedId: number;
      if (realFeedId < 0) {

        const res = await postCloneComment(accessToken, feed.cloneId, content);
        targetFeedId = res.comment.feedId;
        setRealFeedId(targetFeedId);
      } else {
        await postFeedComment(accessToken, realFeedId, content);
        targetFeedId = realFeedId;
      }
      setCommentText("");
      const r = await listFeedComments(targetFeedId, { limit: 100 });
      setComments(r.items);
      setCommentsCount(r.items.length);
    } catch (err) {
      console.warn("[CloneFeed] postFeedComment failed:", err);
    } finally {
      submittingRef.current = false;
      setSubmittingComment(false);
    }
  };

  const deleteComment = (commentId: number) => {
    if (realFeedId < 0 || !accessToken) return;
    void (async () => {
      try {
        await deleteFeedComment(accessToken, realFeedId, commentId);
        setComments((prev) => {
          const next = prev.filter((c) => c.id !== commentId);
          setCommentsCount(next.length);
          return next;
        });
      } catch (err) {
        console.warn("[CloneFeed] deleteFeedComment failed:", err);
      }
    })();
  };

  return (
    <View style={styles.root}>
      <FeedCard
        item={item}
        isActive
        isLiked={liked}
        isFollowed={isFollowing(item.cloneId)}
        isOwn={isOwn}
        cardHeight={cardHeight}
        onToggleLike={handleLike}
        onToggleFollow={() => void toggleFollow(item.cloneId)}
        onCallPress={handleCall}
        onCommentPress={() => setCommentOpen(true)}
        onSharePress={handleShare}
      />

      {}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={[styles.backBtn, { top: insets.top + 8 }]}
        hitSlop={12}
      >
        <Feather name="arrow-left" size={26} color={COLORS.white} />
      </TouchableOpacity>

      {}
      <Modal visible={commentOpen} transparent animationType="slide">
        <Pressable
          style={styles.commentOverlay}
          onPress={() => {
            Keyboard.dismiss();
            setCommentOpen(false);
          }}
        >
          <View
            style={[
              styles.commentSheet,
              {
                paddingBottom: 24 + Math.max(insets.bottom, 0),
                height: Math.max(SCREEN_HEIGHT * 0.7 - keyboardHeight, 200),
                transform: [{ translateY: -keyboardHeight }],
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.commentHeaderRow}>
              <Text style={styles.commentTitle}>
                {t("feed.commentCount", { n: comments.length })}
              </Text>
              <TouchableOpacity onPress={() => setCommentOpen(false)}>
                <Feather name="x" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.commentScroll} showsVerticalScrollIndicator={false}>
              {commentsLoading ? (
                <View style={styles.emptyComment}>
                  <Feather name="loader" size={28} color="rgba(255,255,255,0.5)" />
                </View>
              ) : comments.length > 0 ? (
                comments.map((c) => (
                  <View key={c.id} style={styles.commentRow}>
                    {c.user.avatarUrl ? (
                      <Image source={{ uri: c.user.avatarUrl }} style={styles.commentAvatar} />
                    ) : (
                      <View
                        style={[
                          styles.commentAvatar,
                          { backgroundColor: "rgba(255,255,255,0.15)" },
                        ]}
                      />
                    )}
                    <View style={styles.commentInfo}>
                      <View style={styles.commentMeta}>
                        <Text style={styles.commentAuthor}>
                          {c.user.name ?? c.user.email}
                        </Text>
                        <Text style={styles.commentTime}>{formatRelativeKo(c.createdAt)}</Text>
                        {c.userId === myUserId && (
                          <TouchableOpacity
                            onPress={() => deleteComment(c.id)}
                            style={{ marginLeft: 8 }}
                          >
                            <Feather name="trash-2" size={14} color="rgba(255,255,255,0.6)" />
                          </TouchableOpacity>
                        )}
                      </View>
                      <Text style={styles.commentContent}>{c.content}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyComment}>
                  <Feather name="message-circle" size={40} color="rgba(255,255,255,0.3)" />
                  <Text style={styles.emptyText}>{t("feed.commentsEmpty")}</Text>
                </View>
              )}
            </ScrollView>
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                value={commentText}
                onChangeText={setCommentText}
                placeholder={t("feed.commentPlaceholder")}
                placeholderTextColor="rgba(255,255,255,0.4)"
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
                      ? COLORS.white
                      : "rgba(255,255,255,0.3)"
                  }
                />
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  backBtn: {
    position: "absolute",
    left: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    zIndex: 10,
  },

  commentOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  commentSheet: {
    backgroundColor: "rgba(24,24,27,0.95)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 24,
    height: "70%",
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 12,
  },
  commentHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  commentTitle: { fontSize: 16, fontWeight: "700", color: COLORS.white },
  commentScroll: { flex: 1, marginTop: 12 },
  commentRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16 },
  commentInfo: { flex: 1 },
  commentMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  commentAuthor: { fontSize: 13, fontWeight: "600", color: COLORS.white },
  commentTime: { fontSize: 11, color: "rgba(255,255,255,0.5)" },
  commentContent: { fontSize: 14, color: "rgba(255,255,255,0.9)", lineHeight: 19 },
  emptyComment: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 8 },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: 12,
  },
  commentInput: {
    flex: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 14,
    color: COLORS.white,
  },
});
