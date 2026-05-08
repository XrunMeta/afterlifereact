import v_a3453e from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_4623af,
  v_cf9c33,
  v_700696,
  v_472849,
} from "rcmrninabrnb";
import { v_5ade23 } from "xbfwaaanosqvazmrqoah";
import { v_dec439, v_25515d } from "zvyjokvuouwvifyzks";
import { v_772971 } from "jmpfvteuuztnp";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../constants";
import type { v_19b433 } from "../../types/feed";

interface FeedCardProps {
  item: v_19b433;
  isActive: boolean;
  isLiked: boolean;
  isFollowed: boolean;
  cardHeight: number;
  onToggleLike: () => void;
  onToggleFollow: () => void;
  onCallPress: () => void;
  onCommentPress?: () => void;
  onMorePress?: () => void;
}

const FeedCard: v_a3453e.FC<FeedCardProps> = ({
  item: v_8c0b26,
  isActive: v_26dce6,
  isLiked: v_85c07b,
  isFollowed: v_a26275,
  cardHeight: v_3d6201,
  onToggleLike: v_5bca36,
  onToggleFollow: v_cbd557,
  onCallPress: v_c1d70c,
  onCommentPress: v_48b0c1,
  onMorePress: v_27b331,
}) => {
  const { t: v_8d41d7 } = v_772971();
  return (
    <View style={[v_d81136.container, { height: v_3d6201 }]}>
      {}
      <Image
        source={typeof v_8c0b26.image === "number" ? v_8c0b26.image : { uri: v_8c0b26.image }}
        style={v_d81136.bgImage}
      />
      {}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.8)"]}
        locations={[0, 0.5, 1]}
        style={v_d81136.gradient}
      />

      {}
      {v_26dce6 && (
        <View style={v_d81136.bottomContent}>
          {}
          <View style={v_d81136.profileRow}>
            <View style={v_d81136.profileInfo}>
              <Text style={v_d81136.authorName}>{v_8c0b26.author}</Text>
              <Text style={v_d81136.username}>{v_8c0b26.username}</Text>
            </View>
            <TouchableOpacity
              onPress={v_cbd557}
              style={[
                v_d81136.followButton,
                v_a26275 && v_d81136.followButtonActive,
              ]}
              activeOpacity={0.7}
            >
              <Feather
                name={v_a26275 ? "user-check" : "user-plus"}
                size={14}
                color={v_a26275 ? v_1bfbd0.white : v_1bfbd0.zinc900}
              />
              <Text
                style={[
                  v_d81136.followText,
                  v_a26275 && v_d81136.followTextActive,
                ]}
              >
                {v_a26275 ? v_8d41d7("feed.following") : v_8d41d7("feed.follow")}
              </Text>
            </TouchableOpacity>
            {}
            {v_27b331 && (
              <TouchableOpacity
                onPress={v_27b331}
                style={v_d81136.moreButton}
                activeOpacity={0.7}
                accessibilityLabel="more-options"
              >
                <Feather name="more-vertical" size={20} color={v_1bfbd0.white} />
              </TouchableOpacity>
            )}
          </View>

          {}
          <View style={v_d81136.statsRow}>
            <TouchableOpacity onPress={v_5bca36} style={v_d81136.statItem}>
              <Ionicons
                name={v_85c07b ? "heart" : "heart-outline"}
                size={16}
                color={v_85c07b ? "#ef4444" : v_1bfbd0.white}
              />
              <Text style={v_d81136.statText}>{v_8c0b26.likes}</Text>
            </TouchableOpacity>
            <View style={v_d81136.statDivider} />
            <TouchableOpacity onPress={v_48b0c1} style={v_d81136.statItem}>
              <Feather name="message-circle" size={14} color={v_1bfbd0.white} />
              <Text style={v_d81136.statText}>{v_8c0b26.comments}</Text>
            </TouchableOpacity>
          </View>

          {}
          <Text style={v_d81136.description} numberOfLines={2}>
            {v_8c0b26.description}
          </Text>

          {}
          <View style={v_d81136.tagsRow}>
            {v_8c0b26.interests.map((v_e4601c) => (
              <View key={v_e4601c} style={v_d81136.tag}>
                <Text style={v_d81136.tagText}>#{v_e4601c}</Text>
              </View>
            ))}
          </View>

          {}
          <TouchableOpacity
            onPress={v_c1d70c}
            style={v_d81136.callButton}
            activeOpacity={0.8}
          >
            <Feather name="video" size={20} color={v_1bfbd0.zinc900} />
            <Text style={v_d81136.callButtonText}>{v_8d41d7("feed.callBtn")}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const v_d81136 = v_472849.create({
  container: {
    width: "100%",
    position: "relative",
  },
  bgImage: {
    ...v_472849.absoluteFillObject,
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
    paddingHorizontal: v_9b1a04.xlarge,
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
    color: v_1bfbd0.white,
  },
  username: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: v_8b0c90.full,
    backgroundColor: v_1bfbd0.white,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  moreButton: {
    marginLeft: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  followButtonActive: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  followText: {
    fontSize: 13,
    fontWeight: "bold",
    color: v_1bfbd0.zinc900,
  },
  followTextActive: {
    color: v_1bfbd0.white,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: v_8b0c90.full,
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
    color: v_1bfbd0.white,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  description: {
    fontSize: 14,
    color: v_1bfbd0.white,
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
    borderRadius: v_8b0c90.full,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  tagText: {
    fontSize: 12,
    fontWeight: "500",
    color: v_1bfbd0.white,
  },
  callButton: {
    width: "100%",
    height: 56,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: v_8b0c90.full,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  callButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: v_1bfbd0.zinc900,
  },
});

export default v_9706a6;
