

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
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAndroidNavigationBarHeight } from "react-native-navigation-bar-height";
import { useTranslation } from "react-i18next";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import FeedCard from "../../components/ui/FeedCard";
import SwipeDownSheet from "../../components/ui/SwipeDownSheet";
import type { FeedItem } from "../../types/feed";
import { useAuthStore } from "../../stores/authStore";
import { useFollowStore } from "../../stores/followStore";
import { useFeedStore } from "../../stores/feedStore";
import { showAlert } from "../../stores/dialogStore";
import {
  likeClone,
  unlikeClone,
  listFeedComments,
  listCloneComments,
  postFeedComment,
  postCloneComment,
  deleteFeedComment,
  getCloneDetail,
  reportClone,
  reportFeedComment,
  blockClone,
  listFeedCommentReplies,
  likeFeedComment,
  unlikeFeedComment,
  postCloneLearnEvent,
  type FeedComment,
} from "../../api/clones";
import ReportReasonModal from "../../components/common/ReportReasonModal";
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

  const hasHashtag = /#[a-zA-Z0-9_가-힣ᄀ-ᇿㄱ-ㆎ]+/.test(description);
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
    cloneType: feed.clone.cloneType,
    mainCategory: "",
    interests: feed.interests,
    likes: String(likesCount),
    comments: commentsCount,
  };

  const [liked, setLiked] = useState<boolean>(feed.likedByMe ?? likedIds.includes(realFeedId));
  const isOwn = myUserId != null && item.cloneOwnerId === myUserId;

  useEffect(() => {
    if (!accessToken) {
      console.warn(`[CloneFeed] learn-event SKIP — no accessToken (cloneId=${feed.cloneId})`);
      return;
    }
    console.log(`[CloneFeed] POST /oth-path${feed.cloneId}/learn-event`);
    postCloneLearnEvent(accessToken, feed.cloneId)
      .then((res) =>
        console.log(`[CloneFeed] learn-event ← ok bumped=${res.bumped} scoreApplied=${(res as { scoreApplied?: number }).scoreApplied ?? 0}°C (10분 쿨다운 적용)`),
      )
      .catch((err) => console.warn("[CloneFeed] learn event failed:", err));

  }, [feed.cloneId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getCloneDetail(feed.cloneId, accessToken ?? undefined);
        if (cancelled) return;
        setLikesCount(res.clone.stats.likes ?? 0);
        setCommentsCount(res.clone.stats.comments ?? 0);
        setLiked(res.clone.likedByMe);
      } catch (err) {
        console.warn("[CloneFeed] hydrate detail failed:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [feed.cloneId, accessToken]);

  const [moreOpen, setMoreOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    cloneId: number;
    author: string;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  useEffect(() => {
    if (toastMessage) {
      const id = setTimeout(() => setToastMessage(null), 2000);
      return () => clearTimeout(id);
    }
  }, [toastMessage]);

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
        message: `${item.author} 클론과 만나보세요!\nhttps://afterlife.app/clone/${item.cloneId}`,
        title: item.author,
      });
    } catch (err) {
      console.warn("[CloneFeed] share failed:", err);
    }
  };

  const [commentOpen, setCommentOpen] = useState(route.params.openComments ?? false);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const submittingRef = useRef(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const [replyingTo, setReplyingTo] = useState<{ commentId: number; userName: string } | null>(null);

  const commentInputRef = useRef<TextInput>(null);
  useEffect(() => {
    if (replyingTo) {
      const id = setTimeout(() => commentInputRef.current?.focus(), 60);
      return () => clearTimeout(id);
    }
  }, [replyingTo]);
  const [expandedReplies, setExpandedReplies] = useState<Record<number, FeedComment[]>>({});

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

      setExpandedReplies({});
      setReplyingTo(null);
      return;
    }
    let cancelled = false;
    setCommentsLoading(true);
    setComments([]);

    setExpandedReplies({});
    const fetcher = realFeedId < 0
      ? listCloneComments(feed.cloneId, { limit: 100, accessToken })
      : listFeedComments(realFeedId, { limit: 100, accessToken });
    fetcher
      .then((res) => {
        if (cancelled) return;
        setComments(res.items);
      })
      .catch((err) => {
        console.warn("[CloneFeed] list comments failed:", err);
        if (!cancelled) setComments([]);
      })
      .finally(() => {
        if (!cancelled) setCommentsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [commentOpen, realFeedId, feed.cloneId]);

  const submitComment = async () => {
    if (submittingRef.current) return;
    const content = commentText.trim();
    if (!content || !accessToken) return;

    Keyboard.dismiss();
    submittingRef.current = true;
    setSubmittingComment(true);
    try {
      let targetFeedId: number;
      if (replyingTo) {

        const parent = comments.find((c) => c.id === replyingTo.commentId);
        const fid = parent?.feedId ?? (realFeedId > 0 ? realFeedId : 0);
        if (!fid) {
          submittingRef.current = false;
          setSubmittingComment(false);
          return;
        }
        await postFeedComment(accessToken, fid, content, {
          parentCommentId: replyingTo.commentId,
        });
        targetFeedId = fid;
      } else if (realFeedId < 0) {

        const res = await postCloneComment(accessToken, feed.cloneId, content);
        targetFeedId = res.comment.feedId;
        setRealFeedId(targetFeedId);
      } else {
        await postFeedComment(accessToken, realFeedId, content);
        targetFeedId = realFeedId;
      }
      setCommentText("");
      if (replyingTo) {
        try {
          const rep = await listFeedCommentReplies(targetFeedId, replyingTo.commentId, { limit: 100, accessToken });
          setExpandedReplies((p) => ({ ...p, [replyingTo.commentId]: rep.items }));
          setComments((prev) =>
            prev.map((c) =>
              c.id === replyingTo.commentId ? { ...c, repliesCount: rep.items.length } : c,
            ),
          );
          setCommentsCount((n) => n + 1);
        } catch (err) {
          console.warn("[CloneFeed] refresh replies failed:", err);
        }
        setReplyingTo(null);
      } else {
        const r = await listFeedComments(targetFeedId, { limit: 100, accessToken });
        setComments(r.items);
        setCommentsCount(r.items.length);
      }
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

  const reportComment = (commentId: number, commentFeedId?: number) => {
    const fid = realFeedId > 0 ? realFeedId : commentFeedId ?? 0;
    if (!fid || !accessToken) return;
    showAlert("댓글 신고", "이 댓글을 신고할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "신고",
        style: "destructive",
        onPress: async () => {
          try {
            await reportFeedComment(accessToken, fid, commentId);
            setToastMessage("댓글을 신고했어요");
          } catch (err) {
            console.warn("[CloneFeed] reportFeedComment failed:", err);
            setToastMessage("신고에 실패했어요");
          }
        },
      },
    ]);
  };

  const deleteReply = (parentId: number, replyId: number) => {
    const fid = realFeedId > 0 ? realFeedId : 0;
    if (!fid || !accessToken) return;
    void (async () => {
      try {
        await deleteFeedComment(accessToken, fid, replyId);
        setExpandedReplies((p) => {
          const list = p[parentId];
          if (!list) return p;
          return { ...p, [parentId]: list.filter((r) => r.id !== replyId) };
        });
        setComments((prev) =>
          prev.map((cc) =>
            cc.id === parentId
              ? { ...cc, repliesCount: Math.max(0, (cc.repliesCount ?? 1) - 1) }
              : cc,
          ),
        );
      } catch (err) {
        console.warn("[CloneFeed] deleteReply failed:", err);
      }
    })();
  };

  const toggleCommentLike = (
    comment: FeedComment,
    parentCommentId?: number,
  ) => {
    if (!accessToken) return;

    const fid = comment.feedId ?? (realFeedId > 0 ? realFeedId : 0);
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
        console.warn("[CloneFeed] toggleCommentLike failed:", err);

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
        onMorePress={() => setMoreOpen(true)}
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
          <SwipeDownSheet
            onClose={() => {
              Keyboard.dismiss();
              setCommentOpen(false);
            }}
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
            {}
            <View style={styles.commentHeaderRow}>
              <Text style={styles.commentTitle}>
                {t("feed.commentCount", { n: comments.length })}
              </Text>
            </View>
            <ScrollView style={styles.commentScroll} showsVerticalScrollIndicator={false}>
              {commentsLoading ? (
                <View style={styles.emptyComment}>
                  <Feather name="loader" size={28} color={COLORS.zinc400} />
                </View>
              ) : comments.length > 0 ? (
                comments.map((c) => {
                  const replies = expandedReplies[c.id];
                  const showReplies = replies !== undefined;
                  return (

                  <View key={c.id} style={styles.commentBlock}>
                  <View style={styles.commentRow}>
                    {c.user.avatarUrl ? (
                      <Image source={{ uri: c.user.avatarUrl }} style={styles.commentAvatar} />
                    ) : (
                      <View
                        style={[
                          styles.commentAvatar,
                          { backgroundColor: COLORS.zinc100 },
                        ]}
                      />
                    )}
                    <View style={styles.commentInfo}>
                      <View style={styles.commentMeta}>
                        <Text style={styles.commentAuthor}>
                          {c.user.name ?? c.user.email}
                        </Text>
                        <Text style={styles.commentTime}>{formatRelativeKo(c.createdAt)}</Text>
                        {c.userId === myUserId ? (
                          <TouchableOpacity
                            onPress={() => deleteComment(c.id)}
                            style={{ marginLeft: 8 }}
                            hitSlop={6}
                          >
                            <Feather name="trash-2" size={14} color={COLORS.zinc400} />
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            onPress={() => reportComment(c.id, c.feedId)}
                            style={{ marginLeft: 8 }}
                            hitSlop={6}
                          >
                            <Feather name="flag" size={13} color={COLORS.zinc400} />
                          </TouchableOpacity>
                        )}
                      </View>
                      <Text style={styles.commentContent}>{c.content}</Text>
                      <View style={styles.replyActions}>
                        <TouchableOpacity
                          onPress={() =>
                            setReplyingTo({
                              commentId: c.id,
                              userName: c.user.name ?? c.user.email ?? "",
                            })
                          }
                        >
                          <Text style={styles.replyActionText}>답글 달기</Text>
                        </TouchableOpacity>
                        {(c.repliesCount ?? 0) > 0 && (
                          <TouchableOpacity
                            onPress={async () => {

                              const fid = realFeedId > 0 ? realFeedId : (c.feedId ?? 0);
                              if (!fid) return;
                              if (showReplies) {
                                setExpandedReplies((p) => {
                                  const n = { ...p };
                                  delete n[c.id];
                                  return n;
                                });
                              } else {
                                try {
                                  const r = await listFeedCommentReplies(fid, c.id, { limit: 100, accessToken });
                                  setExpandedReplies((p) => ({ ...p, [c.id]: r.items }));
                                } catch (err) {
                                  console.warn("[CloneFeed] listReplies failed:", err);
                                }
                              }
                            }}
                          >
                            <Text style={styles.replyToggleText}>
                              {showReplies
                                ? "── 답글 숨기기"
                                : `── 답글 ${c.repliesCount}개 더 보기`}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                    {}
                    <TouchableOpacity
                      style={styles.commentHeart}
                      onPress={() => toggleCommentLike(c)}
                      hitSlop={8}
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
                  </View>
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
                          {rc.userId === myUserId ? (
                            <TouchableOpacity
                              onPress={() => deleteReply(c.id, rc.id)}
                              style={{ marginLeft: 8 }}
                              hitSlop={6}
                            >
                              <Feather name="trash-2" size={13} color={COLORS.zinc400} />
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              onPress={() => reportComment(rc.id, rc.feedId)}
                              style={{ marginLeft: 8 }}
                              hitSlop={6}
                            >
                              <Feather name="flag" size={12} color={COLORS.zinc400} />
                            </TouchableOpacity>
                          )}
                        </View>
                        <Text style={styles.commentContent}>{rc.content}</Text>
                      </View>
                      {}
                      <TouchableOpacity
                        style={styles.commentHeart}
                        onPress={() => toggleCommentLike(rc, c.id)}
                        hitSlop={8}
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
            {replyingTo && (
              <View style={styles.replyingBanner}>
                <Text style={styles.replyingText}>@{replyingTo.userName} 에게 답글</Text>
                <TouchableOpacity onPress={() => setReplyingTo(null)}>
                  <Feather name="x" size={14} color={COLORS.zinc500} />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.commentInputRow}>
              <TextInput
                ref={commentInputRef}
                style={styles.commentInput}
                value={commentText}
                onChangeText={setCommentText}
                placeholder={replyingTo ? "답글 입력..." : t("feed.commentPlaceholder")}
                placeholderTextColor={COLORS.zinc400}
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
                      ? COLORS.violet600
                      : COLORS.zinc400
                  }
                />
              </TouchableOpacity>
            </View>
          </SwipeDownSheet>
        </Pressable>
      </Modal>

      {}
      <Modal visible={moreOpen} transparent animationType="fade">
        <Pressable style={styles.moreOverlay} onPress={() => setMoreOpen(false)}>
          <SwipeDownSheet
            onClose={() => setMoreOpen(false)}
            style={[styles.moreSheet, { paddingBottom: 24 + Math.max(insets.bottom, 0) }]}
          >
            <View style={styles.moreSheetHandle} />
            <Text style={styles.moreTitle}>{item.author}</Text>
            {!isOwn && (
              <>
                {item.cloneOwnerId != null && (
                <TouchableOpacity
                  style={styles.moreItem}
                  onPress={() => {
                    setMoreOpen(false);
                    if (item.cloneOwnerId == null) return;
                    navigation.navigate("UserProfile", {
                      userId: item.cloneOwnerId,
                    });
                  }}
                >
                  <Feather name="user" size={20} color="#0f172a" />
                  <Text style={styles.moreItemText}>유저 정보보기</Text>
                </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.moreItem}
                  onPress={() => {
                    setMoreOpen(false);
                    setReportTarget({ cloneId: item.cloneId, author: item.author });
                  }}
                >
                  <Feather name="flag" size={20} color="#ef4444" />
                  <Text style={[styles.moreItemText, { color: "#ef4444" }]}>신고하기</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.moreItem, { borderBottomWidth: 0 }]}
                  onPress={async () => {
                    setMoreOpen(false);
                    if (!accessToken) return;
                    try {
                      await blockClone(accessToken, item.cloneId);
                      setToastMessage("이 클론이 차단됐어요");
                      navigation.goBack();
                    } catch (err) {
                      console.warn("[CloneFeed] block failed:", err);
                      setToastMessage("차단에 실패했어요");
                    }
                  }}
                >
                  <Feather name="slash" size={20} color="#0f172a" />
                  <Text style={styles.moreItemText}>차단하기</Text>
                </TouchableOpacity>
              </>
            )}
          </SwipeDownSheet>
        </Pressable>
      </Modal>

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
            await reportClone(accessToken, target.cloneId, reason || undefined);
            setToastMessage("신고가 접수됐어요. 이 클론은 차단됐어요");
            navigation.goBack();
          } catch (err) {
            console.warn("[CloneFeed] report failed:", err);
            setToastMessage("신고에 실패했어요");
          }
        }}
      />

      {toastMessage && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
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
    backgroundColor: COLORS.white,
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
    backgroundColor: COLORS.zinc300,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 12,
  },
  commentHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  commentTitle: { fontSize: 16, fontWeight: "700", color: COLORS.zinc900 },
  commentScroll: { flex: 1, marginTop: 12 },

  commentBlock: { marginBottom: 16 },

  commentRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  commentHeart: { alignItems: "center", paddingHorizontal: 4, paddingTop: 2, minWidth: 28 },
  commentHeartCount: { fontSize: 11, color: COLORS.zinc500, marginTop: 2 },

  replyIndent: { width: 42 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.zinc100 },
  commentInfo: { flex: 1 },
  commentMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  commentAuthor: { fontSize: 13, fontWeight: "600", color: COLORS.zinc900 },
  commentTime: { fontSize: 11, color: COLORS.zinc500 },
  commentContent: { fontSize: 14, color: COLORS.zinc800, lineHeight: 19 },
  emptyComment: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 13, color: COLORS.zinc400, marginTop: 8 },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.zinc100,
    paddingTop: 12,
  },
  commentInput: {
    flex: 1,
    height: 40,
    backgroundColor: COLORS.zinc50 ?? COLORS.zinc100,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 14,
    color: COLORS.zinc900,
  },
  replyActions: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 6 },
  replyActionText: { fontSize: 12, fontWeight: "600", color: COLORS.zinc500 },
  replyToggleText: { fontSize: 12, fontWeight: "600", color: COLORS.zinc500 },
  replyRow: { flexDirection: "row", gap: 8, marginTop: 10, alignItems: "flex-start" },
  replyAvatar: { width: 24, height: 24, borderRadius: 12 },
  replyingBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6, paddingHorizontal: 4, backgroundColor: COLORS.zinc50 ?? COLORS.zinc100, borderRadius: 8, marginTop: 6 },
  replyingText: { fontSize: 12, color: COLORS.zinc600 },

  moreOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  moreSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 0,
    paddingHorizontal: 16,
  },
  moreSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#cbd5e1",
    alignSelf: "center",
    marginVertical: 12,
  },
  moreTitle: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  moreItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  moreItemText: { fontSize: 15, color: "#0f172a" },
  toast: {
    position: "absolute",
    bottom: 80,
    left: 24,
    right: 24,
    backgroundColor: "rgba(0,0,0,0.85)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  toastText: { color: COLORS.white, fontSize: 13 },
});
