import React, { useState, useRef, useCallback } from "react";
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
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAndroidNavigationBarHeight } from "react-native-navigation-bar-height";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import FeedCard from "../../components/ui/FeedCard";
import FilterModal from "../../components/ui/FilterModal";
import { useFeedStore } from "../../stores/feedStore";
import { COLORS, RADIUS } from "../../components/constants";
import type { FeedItem } from "../../types/feed";
import type { RootStackParamList } from "../../navigation/types";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const TAB_BAR_HEIGHT = 56;

export default function HomeScreen() {
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const navBarHeight = useAndroidNavigationBarHeight(0);
  const flatListRef = useRef<FlatList>(null);

  const bottomInset = Platform.OS === "ios"
    ? insets.bottom
    : Math.max(navBarHeight, insets.bottom);
  const feedHeight = SCREEN_HEIGHT - TAB_BAR_HEIGHT - bottomInset;

  const feeds = useFeedStore((s) => s.feeds);
  const likedIds = useFeedStore((s) => s.likedIds);
  const followedIds = useFeedStore((s) => s.followedIds);
  const selectedInterests = useFeedStore((s) => s.selectedInterests);
  const toggleLike = useFeedStore((s) => s.toggleLike);
  const toggleFollow = useFeedStore((s) => s.toggleFollow);
  const setSelectedInterests = useFeedStore((s) => s.setSelectedInterests);
  const getFilteredFeeds = useFeedStore((s) => s.getFilteredFeeds);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFilter, setShowFilter] = useState(false);
  const [localInterests, setLocalInterests] = useState<string[]>(selectedInterests);
  const [commentFeedId, setCommentFeedId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  const filteredFeeds = getFilteredFeeds();

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

  const mockComments: Record<string, Array<{ id: string; author: string; avatar: string; content: string; time: string }>> = {
    "feed-1": [
      { id: "c1", author: "마음이", avatar: "https://i.pravatar.cc/100?img=1", content: "할아버지 목소리가 그리웠어요", time: "5분 전" },
      { id: "c2", author: "별빛", avatar: "https://i.pravatar.cc/100?img=2", content: "오늘도 힘이 되는 말씀 감사합니다", time: "12분 전" },
      { id: "c3", author: "하늘", avatar: "https://i.pravatar.cc/100?img=3", content: "따뜻한 조언 감사해요", time: "30분 전" },
    ],
    "feed-2": [
      { id: "c4", author: "소망", avatar: "https://i.pravatar.cc/100?img=9", content: "할머니 덕분에 오늘도 웃었어요", time: "3분 전" },
      { id: "c5", author: "봄날", avatar: "https://i.pravatar.cc/100?img=10", content: "정말 위로가 됩니다", time: "20분 전" },
    ],
    "feed-3": [
      { id: "c6", author: "선재팬", avatar: "https://i.pravatar.cc/100?img=5", content: "오늘도 좋은 하루!", time: "1분 전" },
      { id: "c7", author: "해피", avatar: "https://i.pravatar.cc/100?img=7", content: "같이 놀아요~", time: "8분 전" },
      { id: "c8", author: "루나", avatar: "https://i.pravatar.cc/100?img=8", content: "재밌어요 ㅋㅋ", time: "15분 전" },
    ],
  };
  const currentComments = commentFeedId ? mockComments[commentFeedId] || [] : [];

  const renderItem = useCallback(
    ({ item, index }: { item: FeedItem; index: number }) => (
      <FeedCard
        item={item}
        isActive={index === currentIndex}
        isLiked={likedIds.includes(item.id)}
        isFollowed={followedIds.includes(item.id)}
        cardHeight={feedHeight}
        onToggleLike={() => toggleLike(item.id)}
        onToggleFollow={() => toggleFollow(item.id)}
        onCallPress={() => rootNav.navigate("Call", { cloneId: item.cloneId, name: item.author, image: item.image })}
        onCommentPress={() => setCommentFeedId(item.id)}
      />
    ),
    [currentIndex, likedIds, followedIds, feedHeight, toggleLike, toggleFollow]
  );

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      {}
      <FlatList
        ref={flatListRef}
        data={filteredFeeds}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
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
        <Pressable style={styles.commentOverlay} onPress={() => setCommentFeedId(null)}>
          <View style={styles.commentSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <View style={styles.commentHeaderRow}>
              <Text style={styles.commentTitle}>댓글 {currentComments.length}개</Text>
              <TouchableOpacity onPress={() => setCommentFeedId(null)}>
                <Feather name="x" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.commentScroll} showsVerticalScrollIndicator={false}>
              {currentComments.length > 0 ? currentComments.map((c) => (
                <View key={c.id} style={styles.commentRow}>
                  <Image source={{ uri: c.avatar }} style={styles.commentAvatar} />
                  <View style={styles.commentInfo}>
                    <View style={styles.commentMeta}>
                      <Text style={styles.commentAuthor}>{c.author}</Text>
                      <Text style={styles.commentTime}>{c.time}</Text>
                    </View>
                    <Text style={styles.commentContent}>{c.content}</Text>
                  </View>
                </View>
              )) : (
                <View style={styles.emptyComment}>
                  <Feather name="message-circle" size={40} color="rgba(255,255,255,0.3)" />
                  <Text style={styles.emptyText}>아직 댓글이 없습니다</Text>
                </View>
              )}
            </ScrollView>
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                value={commentText}
                onChangeText={setCommentText}
                placeholder="댓글 달기..."
                placeholderTextColor="rgba(255,255,255,0.4)"
              />
              <TouchableOpacity disabled={!commentText.trim()} onPress={() => setCommentText("")}>
                <Feather name="send" size={18} color={commentText.trim() ? COLORS.white : "rgba(255,255,255,0.3)"} />
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
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
});
