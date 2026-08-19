import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { MainTabParamList } from "../../navigation/types";
import { COLORS, SIZES, RADIUS } from "../constants";
import type { FeedItem } from "../../types/feed";
import HashtagText from "../common/HashtagText";
import ExpertBadge from "./ExpertBadge";

const HASHTAG_RE = /#[a-zA-Z0-9_가-힣ᄀ-ᇿㄱ-ㆎ]+/g;

interface FeedCardProps {
  item: FeedItem;
  isActive: boolean;
  isLiked: boolean;
  isFollowed: boolean;

  isOwn?: boolean;
  cardHeight: number;
  onToggleLike: () => void;
  onToggleFollow: () => void;
  onCallPress: () => void;
  onCommentPress?: () => void;
  onMorePress?: () => void;

  onSharePress?: () => void;

  onIntimacyPress?: () => void;

  onOwnerPress?: () => void;

  onOwnerFollowPress?: () => void;

  isOwnerFollowed?: boolean;

  onGiftPress?: () => void;

  onDescriptionScrollStart?: () => void;

  onDescriptionScrollEnd?: () => void;

  onDescriptionPress?: () => void;
}

const FeedCard: React.FC<FeedCardProps> = ({
  item,
  isActive,
  isLiked,
  isFollowed,
  isOwn = false,
  cardHeight,
  onToggleLike,
  onToggleFollow,
  onCallPress,
  onCommentPress,
  onMorePress,
  onSharePress,
  onIntimacyPress,
  onOwnerPress,
  onOwnerFollowPress,
  isOwnerFollowed = false,
  onGiftPress,
  onDescriptionScrollStart,
  onDescriptionScrollEnd,
  onDescriptionPress,
}) => {
  const { t } = useTranslation();
  const nav = useNavigation<BottomTabNavigationProp<MainTabParamList>>();

  const hashtags = React.useMemo<string[]>(() => {
    const src = item.description ?? "";
    if (!src) return [];
    HASHTAG_RE.lastIndex = 0;
    const seen = new Set<string>();
    const out: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = HASHTAG_RE.exec(src)) !== null) {
      const tag = m[0];
      if (!seen.has(tag)) {
        seen.add(tag);
        out.push(tag);
      }
    }
    return out;
  }, [item.description]);
  const onHashtagPress = (tag: string) => {
    const stripped = tag.replace(/^#+/, "");
    nav.navigate("SearchTab", { initialQuery: stripped });
  };

  const isSmallScreen = cardHeight < 640;
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
      {
}
      <LinearGradient
        colors={["rgba(0,0,0,0.55)", "rgba(0,0,0,0.2)", "transparent"]}
        locations={[0, 0.6, 1]}
        style={styles.gradientTop}
      />

      {
}
      {isActive && (item.ownerName || item.ownerAvatarUrl || onMorePress) ? (
        <View style={styles.ownerHeader}>
          <TouchableOpacity
            style={styles.ownerInfo}
            onPress={onOwnerPress}
            disabled={!onOwnerPress}
            activeOpacity={0.7}
          >
            {item.ownerAvatarUrl ? (
              <Image source={{ uri: item.ownerAvatarUrl }} style={styles.ownerAvatar} />
            ) : (
              <View style={[styles.ownerAvatar, styles.ownerAvatarPlaceholder]}>
                <Feather name="user" size={14} color={COLORS.zinc400} />
              </View>
            )}
            <Text style={styles.ownerName} numberOfLines={1}>
              {item.ownerName ?? ""}
            </Text>
          </TouchableOpacity>
          {}
          {onMorePress ? (
            <TouchableOpacity
              onPress={onMorePress}
              style={styles.ownerMoreBtn}
              accessibilityLabel="more-options"
            >
              <Feather name="more-vertical" size={25} color={COLORS.white} />
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {
}
      {isActive && hashtags.length > 0 ? (
        <View style={styles.hashtagRowWrap} pointerEvents="box-none">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hashtagRowContent}
            keyboardShouldPersistTaps="handled"
          >
            {hashtags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={styles.hashtagChip}
                activeOpacity={0.7}
                onPress={() => onHashtagPress(tag)}
              >
                <Text style={styles.hashtagChipText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {
}
      {false && typeof item.myIntimacy === "number" ? (
        <TouchableOpacity
          style={styles.intimacyBadge}
          onPress={onIntimacyPress}
          activeOpacity={0.7}
          disabled={!onIntimacyPress}
          accessibilityLabel="intimacy-events"
        >
          <Feather name="thermometer" size={12} color="#fb923c" />
          <Text style={styles.intimacyText}>{item.myIntimacy}°C</Text>
        </TouchableOpacity>
      ) : null}

      {}
      {isActive && (
        <>
          {}
          <View style={[styles.rightActions, isSmallScreen && styles.rightActionsShift]}>
            {}
            <TouchableOpacity onPress={onToggleLike} style={styles.actionBtn} activeOpacity={0.7}>
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={25}
                color={isLiked ? "#ef4444" : COLORS.white}
              />
              <Text style={styles.actionLabel}>{item.likes}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onCommentPress} style={styles.actionBtn} activeOpacity={0.7}>
              <Feather name="message-circle" size={25} color={COLORS.white} />
              <Text style={styles.actionLabel}>{item.comments}</Text>
            </TouchableOpacity>
            {}
            <TouchableOpacity onPress={onGiftPress} style={styles.actionBtn} activeOpacity={0.7}>
              <Feather name="gift" size={25} color={COLORS.white} />
              <Text style={styles.actionLabel}>{item.giftsReceived ?? 0}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onSharePress} style={styles.actionBtn} activeOpacity={0.7}>
              <Feather name="share-2" size={25} color={COLORS.white} />
            </TouchableOpacity>
            {}
          </View>

          <View style={styles.bottomContent}>
            <View style={styles.profileRow}>
              <View style={styles.profileInfo}>
                <View style={styles.authorRow}>
                  <Text style={styles.authorName}>{item.author}</Text>
                  {item.cloneType === "expert" && <ExpertBadge size={22} />}
                  {}
                  {typeof item.myIntimacy === "number" ? (
                    <TouchableOpacity
                      style={styles.intimacyBadgeInline}
                      onPress={onIntimacyPress}
                      activeOpacity={0.7}
                      disabled={!onIntimacyPress}
                      accessibilityLabel="intimacy-events"
                    >
                      <Feather name="thermometer" size={12} color="#fb923c" />
                      <Text style={styles.intimacyText}>{item.myIntimacy}°C</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                <Text style={styles.username}>{item.username}</Text>
              </View>
              {!isOwn && (
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
                    {isFollowed ? t("feed.following") : t("feed.follow")}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {

}
            {item.description ? (
              <TouchableOpacity
                onPress={onDescriptionPress}
                activeOpacity={0.7}
                disabled={!onDescriptionPress}
              >
                <HashtagText
                  style={styles.description}
                  tagStyle={{ color: "#a78bfa", fontWeight: "700" }}
                  numberOfLines={2}
                >
                  {item.description}
                </HashtagText>
              </TouchableOpacity>
            ) : null}

            {}
            <TouchableOpacity
              onPress={onCallPress}
              style={styles.callButton}
              activeOpacity={0.8}
            >
              <Feather name="video" size={20} color={COLORS.zinc900} />
              <Text style={styles.callButtonText}>{t("feed.callBtn")}</Text>
            </TouchableOpacity>
          </View>
        </>
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

  gradientTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "22%",
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
    overflow: "visible",
  },

  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    overflow: "visible",
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

  hashtagRowWrap: {
    position: "absolute",
    top: 56,
    left: 0,
    right: 0,
  },
  hashtagRowContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  hashtagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,

    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  hashtagChipText: {
    fontSize: 13,
    color: COLORS.white,
    fontWeight: "600",
  },

  rightActions: {
    position: "absolute",
    right: 12,
    bottom: 200,
    alignItems: "center",
    gap: 20,
  },

  rightActionsShift: {
    bottom: 260,
  },

  ownerHeader: {
    position: "absolute",
    top: 100,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 11,
  },
  ownerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
    paddingRight: 8,
  },
  ownerAvatar: {

    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  ownerAvatarPlaceholder: {
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  ownerName: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  ownerFollowBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
  },
  ownerFollowBtnActive: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  ownerFollowText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.zinc900,
  },
  ownerFollowTextActive: {
    color: COLORS.white,
  },
  ownerMoreBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  intimacyBadge: {
    position: "absolute",
    top: 100,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: RADIUS.full,
    zIndex: 10,
  },

  intimacyBadgeInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: RADIUS.full,
    marginLeft: 4,
  },
  intimacyText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.white,
  },

  actionBtn: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.white,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  description: {
    fontSize: 14,
    color: COLORS.white,
    lineHeight: 20,

    marginBottom: 12,

  },

  descriptionWrap: {
    marginBottom: 12,

    position: "relative",
  },

  descScrollbarTrack: {
    position: "absolute",
    top: 2,
    bottom: 2,
    right: 2,
    width: 3,
  },
  descScrollbarThumb: {
    position: "absolute",
    right: 0,
    width: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.9)",
  },

  descriptionScroll: {
    maxHeight: 40,
    paddingRight: 56,
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
