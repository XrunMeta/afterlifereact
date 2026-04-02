import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES, RADIUS } from "../constants";
import type { FeedItem } from "../../types/feed";

interface FeedCardProps {
  item: FeedItem;
  isActive: boolean;
  isLiked: boolean;
  isFollowed: boolean;
  cardHeight: number;
  onToggleLike: () => void;
  onToggleFollow: () => void;
  onCallPress: () => void;
  onCommentPress?: () => void;
}

const FeedCard: React.FC<FeedCardProps> = ({
  item,
  isActive,
  isLiked,
  isFollowed,
  cardHeight,
  onToggleLike,
  onToggleFollow,
  onCallPress,
  onCommentPress,
}) => {
  return (
    <View style={[styles.container, { height: cardHeight }]}>
      {}
      <Image
        source={typeof item.image === "number" ? item.image : { uri: item.image }}
        style={styles.bgImage}
      />
      {}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.8)"]}
        locations={[0, 0.5, 1]}
        style={styles.gradient}
      />

      {}
      {isActive && (
        <View style={styles.bottomContent}>
          {}
          <View style={styles.profileRow}>
            <View style={styles.profileInfo}>
              <Text style={styles.authorName}>{item.author}</Text>
              <Text style={styles.username}>{item.username}</Text>
            </View>
            <TouchableOpacity
              onPress={onToggleFollow}
              style={[
                styles.followButton,
                isFollowed && styles.followButtonActive,
              ]}
              activeOpacity={0.7}
            >
              <Feather
                name={isFollowed ? "user-check" : "user-plus"}
                size={14}
                color={isFollowed ? COLORS.white : COLORS.zinc900}
              />
              <Text
                style={[
                  styles.followText,
                  isFollowed && styles.followTextActive,
                ]}
              >
                {isFollowed ? "팔로잉" : "팔로우"}
              </Text>
            </TouchableOpacity>
          </View>

          {}
          <View style={styles.statsRow}>
            <TouchableOpacity onPress={onToggleLike} style={styles.statItem}>
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={16}
                color={isLiked ? "#ef4444" : COLORS.white}
              />
              <Text style={styles.statText}>{item.likes}</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity onPress={onCommentPress} style={styles.statItem}>
              <Feather name="message-circle" size={14} color={COLORS.white} />
              <Text style={styles.statText}>{item.comments}</Text>
            </TouchableOpacity>
          </View>

          {}
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>

          {}
          <View style={styles.tagsRow}>
            {item.interests.map((interest) => (
              <View key={interest} style={styles.tag}>
                <Text style={styles.tagText}>#{interest}</Text>
              </View>
            ))}
          </View>

          {}
          <TouchableOpacity
            onPress={onCallPress}
            style={styles.callButton}
            activeOpacity={0.8}
          >
            <Feather name="video" size={20} color={COLORS.zinc900} />
            <Text style={styles.callButtonText}>통화하기</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    position: "relative",
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "60%",
  },
  bottomContent: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    paddingHorizontal: SIZES.xlarge,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  profileInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.white,
  },
  username: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  followButtonActive: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  followText: {
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.zinc900,
  },
  followTextActive: {
    color: COLORS.white,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: RADIUS.full,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.white,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  description: {
    fontSize: 14,
    color: COLORS.white,
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  tagText: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.white,
  },
  callButton: {
    width: "100%",
    height: 56,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: RADIUS.full,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  callButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.zinc900,
  },
});

export default FeedCard;
