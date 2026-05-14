import { showAlert } from "../../stores/dialogStore";
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
} from "react-native";
import { Alert, Share } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAndroidNavigationBarHeight } from "react-native-navigation-bar-height";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, CommonActions } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import FeedCard from "../../components/ui/FeedCard";
import SwipeDownSheet from "../../components/ui/SwipeDownSheet";
import ReportReasonModal from "../../components/common/ReportReasonModal";

import { useFeedStore, apiFeedCountsCache } from "../../stores/feedStore";
import { useFollowStore } from "../../stores/followStore";
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
  type FeedComment,
} from "../../api/clones";
import { formatRelativeKo } from "../../lib/relativeTime";
import { COLORS, RADIUS } from "../../components/constants";
import type { FeedItem } from "../../types/feed";
import type { RootStackParamList } from "../../navigation/types";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const TAB_BAR_HEIGHT = 56;

export default function HomeScreen() {
  const { t } = useTranslation();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const navBarHeight = useAndroidNavigationBarHeight(0);
  const flatListRef = useRef<FlatList>(null);

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
  const follows = useFollowStore((s) => s.follows);
  const isFollowing = useFollowStore((s) => s.isFollowing);
  const toggleFollow = useFollowStore((s) => s.toggleFollow);

  useEffect(() => {
    if (apiFeeds == null) {
      void loadDiscover();
    }
  }, [apiFeeds, loadDiscover]);

  useFocusEffect(
    useCallback(() => {
      void loadDiscover();
    }, [loadDiscover]),
  );

  const [currentIndex, setCurrentIndex] = useState(0);

  const [commentFeedId, setCommentFeedId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");

  const [moreTarget, setMoreTarget] = useState<{
    cloneId: number;
    ownerId?: number;
    author: string;
    isOwn: boolean;
    visibility?: string;
  } | null>(null);

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
  const myUserId = useAuthStore((s) => s.apiUser?.id ?? s.user?.id ?? null);

  const [replyingTo, setReplyingTo] = useState<{ commentId: number; userName: string } | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Record<number, FeedComment[]>>({});

  useEffect(() => {
    if (commentFeedId == null) {
      setComments([]);
      return;
    }
    if (commentFeedId < 0) {

      setComments([]);
      return;
    }
    let cancelled = false;
    setCommentsLoading(true);
    setComments([]);
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
      "댓글 삭제",
      "이 댓글을 삭제하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
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
          onCallPress={() => rootNav.navigate("Call", { cloneId: item.cloneId, name: item.author, image: item.image })}
          onCommentPress={() => setCommentFeedId(item.id)}
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
              await Share.share({
                message: `${item.author} 페르소나와 만나보세요!\nhttps://afterlife.app/clone/${item.cloneId}`,
                title: item.author,
              });
            } catch (err) {
              console.warn("[Home] share failed:", err);
            }
          }}
        />
      );
    },
    [currentIndex, likedIds, follows, feedHeight, toggleLike, toggleFollow, isFollowing, myUserId]
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      {}
      {filteredFeeds.length === 0 ? (
        <View style={[styles.emptyWrap, { height: feedHeight }]}>
          <View style={styles.emptyIconWrap}>
            <Feather name="users" size={36} color="rgba(255,255,255,0.7)" />
          </View>
          <Text style={styles.emptyTitle}>아직 만나볼 페르소나가 없어요</Text>
          <Text style={styles.emptyDesc}>
            첫 페르소나의 주인공이 되어보시는 건 어때요?{"\n"}
            나만의 페르소나를 만들어 시작해 보세요
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
            <Text style={styles.emptyBtnText}>페르소나 만들기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={filteredFeeds}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          pagingEnabled
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
        <Pressable style={styles.commentOverlay} onPress={() => { Keyboard.dismiss(); setCommentFeedId(null); }}>
          <SwipeDownSheet
            onClose={() => { Keyboard.dismiss(); setCommentFeedId(null); }}
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
              <Text style={styles.commentTitle}>{t("feed.commentCount", { n: comments.length })}</Text>
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
                  <View key={c.id} style={styles.commentRow}>
                    {c.user.avatarUrl ? (
                      <Image source={{ uri: c.user.avatarUrl }} style={styles.commentAvatar} />
                    ) : (
                      <View style={[styles.commentAvatar, { backgroundColor: COLORS.zinc100 }]} />
                    )}
                    <View style={styles.commentInfo}>
                      <View style={styles.commentMeta}>
                        <Text style={styles.commentAuthor}>{c.user.name ?? c.user.email}</Text>
                        <Text style={styles.commentTime}>{formatRelativeKo(c.createdAt)}</Text>
                        {c.userId === myUserId ? (
                          <TouchableOpacity onPress={() => deleteComment(c.id)} style={{ marginLeft: 8 }}>
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
                          >
                            <Feather name="flag" size={14} color={COLORS.zinc400} />
                          </TouchableOpacity>
                        )}
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
                        >
                          <Text style={styles.replyActionText}>답글 달기</Text>
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
                                ? "── 답글 숨기기"
                                : `── 답글 ${c.repliesCount}개 더 보기`}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      {}
                      {showReplies && replies && replies.map((rc) => (
                        <View key={rc.id} style={styles.replyRow}>
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
                          {}
                          <TouchableOpacity
                            style={styles.commentHeart}
                            onPress={() => toggleCommentLike(rc, c.id)}
                            hitSlop={8}
                          >
                            <Feather
                              name="heart"
                              size={14}
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
                    {}
                    <TouchableOpacity
                      style={styles.commentHeart}
                      onPress={() => toggleCommentLike(c)}
                      hitSlop={8}
                    >
                      <Feather
                        name="heart"
                        size={16}
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
            {replyingTo && (
              <View style={styles.replyingBanner}>
                <Text style={styles.replyingText}>
                  @{replyingTo.userName} 에게 답글
                </Text>
                <TouchableOpacity onPress={() => setReplyingTo(null)}>
                  <Feather name="x" size={14} color={COLORS.zinc500} />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.commentInputRow}>
              <TextInput
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
                  <Text style={styles.moreItemText}>수정하기</Text>
                </TouchableOpacity>
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
                    setToastMessage("페르소나 편집 → 공개 범위에서 변경하세요");
                  }}
                >
                  <Feather name="eye" size={20} color={COLORS.zinc900} />
                  <Text style={styles.moreItemText}>공개 범위 수정</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.moreItem, { borderBottomWidth: 0 }]}
                  onPress={async () => {
                    const target = moreTarget;
                    setMoreTarget(null);
                    if (!target || !accessToken) return;

                    showAlert(
                      "페르소나 삭제",
                      `'${target.author}' 페르소나를 삭제할까요?\n복구 불가합니다.`,
                      [
                        { text: "취소", style: "cancel" },
                        {
                          text: "삭제",
                          style: "destructive",
                          onPress: async () => {
                            try {
                              const { deleteClone } = await import("../../api/clones");
                              await deleteClone(accessToken, target.cloneId);
                              setToastMessage("페르소나가 삭제됐어요");
                              const cur = useFeedStore.getState().apiFeeds;
                              if (cur) {
                                useFeedStore.setState({
                                  apiFeeds: cur.filter((it) => it.cloneId !== target.cloneId),
                                });
                              }
                              void loadDiscover();
                            } catch (err) {
                              console.warn("[Delete clone] failed:", err);
                              setToastMessage("삭제에 실패했어요");
                            }
                          },
                        },
                      ],
                    );
                  }}
                >
                  <Feather name="trash-2" size={20} color="#ef4444" />
                  <Text style={[styles.moreItemText, { color: "#ef4444" }]}>삭제</Text>
                </TouchableOpacity>
              </>
            ) : (

              <>
                {moreTarget?.ownerId != null && (
                  <TouchableOpacity
                    style={styles.moreItem}
                    onPress={() => {
                      const target = moreTarget;
                      setMoreTarget(null);
                      if (!target?.ownerId) return;
                      rootNav.navigate("UserProfile", { userId: target.ownerId });
                    }}
                  >
                    <Feather name="user" size={20} color={COLORS.zinc900} />
                    <Text style={styles.moreItemText}>유저 정보보기</Text>
                  </TouchableOpacity>
                )}
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
                  <Text style={[styles.moreItemText, { color: "#ef4444" }]}>신고하기</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.moreItem, { borderBottomWidth: 0 }]}
                  onPress={async () => {
                    const target = moreTarget;
                    setMoreTarget(null);
                    if (!target || !accessToken) return;
                    try {
                      await blockClone(accessToken, target.cloneId);
                      setToastMessage("이 페르소나가 차단됐어요");
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
                      setToastMessage("차단에 실패했어요");
                    }
                  }}
                >
                  <Feather name="slash" size={20} color={COLORS.zinc900} />
                  <Text style={styles.moreItemText}>차단하기</Text>
                </TouchableOpacity>
              </>
            )}
            {}
          </SwipeDownSheet>
        </Pressable>
      </Modal>

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
            setToastMessage("댓글이 신고됐어요");
          } catch (err) {
            console.warn(`[REPORT-COMMENT] FAILED commentId=${target.commentId}`, err);
            setToastMessage("신고에 실패했어요");
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
            setToastMessage("신고가 접수됐어요. 이 페르소나는 차단됐어요");
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
  commentTitle: { fontSize: 16, fontWeight: "700", color: COLORS.zinc900 },
  commentScroll: { flex: 1 },
  commentRow: { flexDirection: "row", gap: 10, marginBottom: 16, alignItems: "flex-start" },
  commentHeart: { alignItems: "center", paddingHorizontal: 4, paddingTop: 2, minWidth: 28 },
  commentHeartCount: { fontSize: 11, color: COLORS.zinc500, marginTop: 2 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.zinc100 },
  commentInfo: { flex: 1 },
  commentMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  commentAuthor: { fontSize: 13, fontWeight: "600", color: COLORS.zinc900 },
  commentTime: { fontSize: 12, color: COLORS.zinc500 },
  commentContent: { fontSize: 14, color: COLORS.zinc800, lineHeight: 20 },
  emptyComment: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 14, color: COLORS.zinc400, marginTop: 8 },
  commentInputRow: { flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: 1, borderTopColor: COLORS.zinc100, paddingTop: 12 },
  commentInput: { flex: 1, height: 40, backgroundColor: COLORS.zinc50 ?? COLORS.zinc100, borderRadius: 20, paddingHorizontal: 16, fontSize: 14, color: COLORS.zinc900 },

  replyActions: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 6 },
  replyActionText: { fontSize: 12, fontWeight: "600", color: COLORS.zinc500 },
  replyToggleText: { fontSize: 12, fontWeight: "600", color: COLORS.zinc500 },
  replyRow: { flexDirection: "row", gap: 8, marginTop: 10, marginLeft: 0 },
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
