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
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";
import { Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAndroidNavigationBarHeight } from "react-native-navigation-bar-height";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import FeedCard from "../../components/ui/FeedCard";
import FilterModal from "../../components/ui/FilterModal";
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
  const [showFilter, setShowFilter] = useState(false);
  const [localInterests, setLocalInterests] = useState<string[]>(selectedInterests);
  const [commentFeedId, setCommentFeedId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");

  const [moreTarget, setMoreTarget] = useState<{ cloneId: number; author: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  useEffect(() => {
    if (toastMessage) {
      const id = setTimeout(() => setToastMessage(null), 2000);
      return () => clearTimeout(id);
    }
  }, [toastMessage]);

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const filteredFeeds: FeedItem[] = getFilteredFeeds().map(toFeedItem);

  const setApiFeeds = useFeedStore((s) => s.apiFeeds); 
  void setApiFeeds;
  const [, setForceTick] = useState(0);
  const bumpCommentsCount = useCallback((feedId: number, n: number) => {
    apiFeedCountsCache.set(feedId, { commentsCount: n });
    setForceTick((x) => x + 1);
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

  const toggleLocalInterest = (interest: string) => {
    setLocalInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleApplyFilter = () => {
    setSelectedInterests(localInterests);
    setCurrentIndex(0);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    setShowFilter(false);
  };

  const handleOpenFilter = () => {
    setLocalInterests(selectedInterests);
    setShowFilter(true);
  };

  const [comments, setComments] = useState<FeedComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const accessToken = useAuthStore((s) => s.accessToken);
  const myUserId = useAuthStore((s) => s.apiUser?.id ?? s.user?.id ?? null);

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
    listFeedComments(commentFeedId, { limit: 100 })
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

  const submitComment = async () => {
    if (commentFeedId == null) return;
    const content = commentText.trim();
    if (!content || !accessToken) return;
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
        await postFeedComment(accessToken, commentFeedId, content);
        realFeedId = commentFeedId;
      }
      setCommentText("");
      const r = await listFeedComments(realFeedId, { limit: 100 });
      setComments(r.items);

      bumpCommentsCount(realFeedId, r.items.length);
    } catch (err) {
      console.warn("[Home] postFeedComment failed:", err);
    }
  };

  const deleteComment = (commentId: number) => {
    if (commentFeedId == null || commentFeedId < 0 || !accessToken) return;
    Alert.alert(
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

  const renderItem = useCallback(
    ({ item, index }: { item: FeedItem; index: number }) => (
      <FeedCard
        item={item}
        isActive={index === currentIndex}
        isLiked={likedIds.includes(item.id)}
        isFollowed={isFollowing(item.cloneId)}
        cardHeight={feedHeight}
        onToggleLike={() => toggleLike(item.id)}
        onToggleFollow={() => void toggleFollow(item.cloneId)}
        onCallPress={() => rootNav.navigate("Call", { cloneId: item.cloneId, name: item.author, image: item.image })}
        onCommentPress={() => setCommentFeedId(item.id)}
        onMorePress={() => setMoreTarget({ cloneId: item.cloneId, author: item.author })}
      />
    ),
    [currentIndex, likedIds, follows, feedHeight, toggleLike, toggleFollow, isFollowing]
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      {}
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

      {}
      <View style={[styles.topOverlay, { top: insets.top + 8 }]}>
        {selectedInterests.length > 0 && (
          <View style={styles.tagsRow}>
            {selectedInterests.map((interest) => (
              <View key={interest} style={styles.topTag}>
                <Text style={styles.topTagText}>#{interest}</Text>
              </View>
            ))}
          </View>
        )}
        <TouchableOpacity
          onPress={handleOpenFilter}
          style={styles.filterButton}
          activeOpacity={0.7}
        >
          <Feather name="filter" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {}
      <Modal visible={!!commentFeedId} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
        <Pressable style={styles.commentOverlay} onPress={() => setCommentFeedId(null)}>
          <View
            style={[
              styles.commentSheet,

              { paddingBottom: keyboardVisible ? 12 : 24 + Math.max(insets.bottom, 0) },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.commentHeaderRow}>
              <Text style={styles.commentTitle}>{t("feed.commentCount", { n: comments.length })}</Text>
              <TouchableOpacity onPress={() => setCommentFeedId(null)}>
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
                      <View style={[styles.commentAvatar, { backgroundColor: "rgba(255,255,255,0.15)" }]} />
                    )}
                    <View style={styles.commentInfo}>
                      <View style={styles.commentMeta}>
                        <Text style={styles.commentAuthor}>{c.user.name ?? c.user.email}</Text>
                        <Text style={styles.commentTime}>{formatRelativeKo(c.createdAt)}</Text>
                        {c.userId === myUserId && (
                          <TouchableOpacity onPress={() => deleteComment(c.id)} style={{ marginLeft: 8 }}>
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
              <TouchableOpacity disabled={!commentText.trim() || !accessToken} onPress={submitComment}>
                <Feather name="send" size={18} color={commentText.trim() && accessToken ? COLORS.white : "rgba(255,255,255,0.3)"} />
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {}
      <FilterModal
        visible={showFilter}
        selectedInterests={localInterests}
        onToggleInterest={toggleLocalInterest}
        onClearAll={() => setLocalInterests([])}
        onApply={handleApplyFilter}
        onClose={() => setShowFilter(false)}
      />

      {}
      <Modal visible={!!moreTarget} transparent animationType="fade">
        <Pressable style={styles.moreOverlay} onPress={() => setMoreTarget(null)}>
          <Pressable
            style={[styles.moreSheet, { paddingBottom: 24 + Math.max(insets.bottom, 0) }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.moreSheetHandle} />
            <Text style={styles.moreTitle}>{moreTarget?.author}</Text>
            <TouchableOpacity
              style={styles.moreItem}
              onPress={() => {
                setMoreTarget(null);
                setToastMessage("신고가 접수됐어요");
              }}
            >
              <Feather name="flag" size={20} color="#ef4444" />
              <Text style={[styles.moreItemText, { color: "#ef4444" }]}>신고하기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.moreItem}
              onPress={async () => {
                const target = moreTarget;
                setMoreTarget(null);
                if (!target || !accessToken) return;
                try {
                  await blockClone(accessToken, target.cloneId);
                  setToastMessage("이 페르소나가 차단됐어요");

                  void loadDiscover();
                } catch (err) {
                  console.warn("[Home] block failed:", err);
                  setToastMessage("차단에 실패했어요");
                }
              }}
            >
              <Feather name="slash" size={20} color={COLORS.zinc900} />
              <Text style={styles.moreItemText}>차단하기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.moreItem, { borderBottomWidth: 0 }]}
              onPress={() => setMoreTarget(null)}
            >
              <Feather name="x" size={20} color={COLORS.zinc500} />
              <Text style={[styles.moreItemText, { color: COLORS.zinc500 }]}>취소</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

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
  commentSheet: { backgroundColor: "rgba(24,24,27,0.95)", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 24, height: "60%" },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.3)", alignSelf: "center", marginTop: 12, marginBottom: 12 },
  commentHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  commentTitle: { fontSize: 16, fontWeight: "700", color: COLORS.white },
  commentScroll: { flex: 1 },
  commentRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16 },
  commentInfo: { flex: 1 },
  commentMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  commentAuthor: { fontSize: 13, fontWeight: "600", color: COLORS.white },
  commentTime: { fontSize: 12, color: "rgba(255,255,255,0.5)" },
  commentContent: { fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 20 },
  emptyComment: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 8 },
  commentInputRow: { flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)", paddingTop: 12 },
  commentInput: { flex: 1, height: 40, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 20, paddingHorizontal: 16, fontSize: 14, color: COLORS.white },

  moreOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  moreSheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 0, paddingHorizontal: 16 },
  moreSheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.zinc300, alignSelf: "center", marginVertical: 12 },
  moreTitle: { fontSize: 13, color: COLORS.zinc500, textAlign: "center", paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.zinc100 },
  moreItem: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.zinc100 },
  moreItemText: { fontSize: 15, fontWeight: "500", color: COLORS.zinc900 },
  toast: { position: "absolute", bottom: 80, alignSelf: "center", paddingHorizontal: 20, paddingVertical: 10, backgroundColor: "rgba(0,0,0,0.85)", borderRadius: RADIUS.full },
  toastText: { color: COLORS.white, fontSize: 14 },
});
