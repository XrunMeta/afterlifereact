

import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Dimensions, Share } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAndroidNavigationBarHeight } from "react-native-navigation-bar-height";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import FeedCard from "../../components/ui/FeedCard";
import type { FeedItem } from "../../types/feed";
import { useAuthStore } from "../../stores/authStore";
import { useFollowStore } from "../../stores/followStore";
import { useFeedStore } from "../../stores/feedStore";
import { likeClone, unlikeClone } from "../../api/clones";
import { COLORS } from "../../components/constants";

type Props = NativeStackScreenProps<RootStackParamList, "CloneFeed">;

const TAB_BAR_HEIGHT = 56;

export default function CloneFeedScreen({ route, navigation }: Props) {
  const { feed } = route.params;
  const insets = useSafeAreaInsets();
  const navBarHeight = useAndroidNavigationBarHeight(0);

  const { height: SCREEN_HEIGHT } = Dimensions.get("window");
  const bottomInset = navBarHeight > 0 ? navBarHeight : insets.bottom;
  const cardHeight = SCREEN_HEIGHT - bottomInset;

  const myUserId = useAuthStore((s) => s.apiUser?.id ?? s.user?.id ?? null);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isFollowing = useFollowStore((s) => s.isFollowing);
  const toggleFollow = useFollowStore((s) => s.toggleFollow);
  const likedIds = useFeedStore((s) => s.likedIds);
  const toggleLike = useFeedStore((s) => s.toggleLike);

  let description = feed.content ?? "";
  const hasHashtag = /#[\p{L}\p{N}_]+/u.test(description);
  if (feed.interests.length > 0 && !hasHashtag) {
    const tags = feed.interests.map((i) => `#${i}`).join(" ");
    description = description.trim().length > 0 ? `${description} ${tags}` : tags;
  }
  const item: FeedItem = {
    id: feed.id,
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
    likes: String(feed.likesCount),
    comments: feed.commentsCount ?? 0,
  };

  const [liked, setLiked] = useState<boolean>(feed.likedByMe ?? likedIds.includes(item.id));
  const isOwn = myUserId != null && item.cloneOwnerId === myUserId;

  const handleLike = async () => {
    const next = !liked;
    setLiked(next);
    toggleLike(item.id);
    if (!accessToken) return;
    try {
      if (next) await likeClone(accessToken, item.cloneId);
      else await unlikeClone(accessToken, item.cloneId);
    } catch (err) {
      console.warn("[CloneFeed] like toggle failed:", err);
      setLiked(!next);
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
});

void TAB_BAR_HEIGHT;
