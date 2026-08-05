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
import v_5778ce from "../common/HashtagText";
import v_8fba67 from "./ExpertBadge";

interface FeedCardProps {
  item: v_19b433;
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
}

const FeedCard: v_a3453e.FC<FeedCardProps> = ({
  item: v_8c0b26,
  isActive: v_26dce6,
  isLiked: v_85c07b,
  isFollowed: v_a26275,
  isOwn: v_799eb5 = false,
  cardHeight: v_3d6201,
  onToggleLike: v_5bca36,
  onToggleFollow: v_cbd557,
  onCallPress: v_c1d70c,
  onCommentPress: v_48b0c1,
  onMorePress: v_27b331,
  onSharePress: v_d51485,
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

      {
}
      {typeof v_8c0b26.myIntimacy === "number" ? (
        <View style={v_d81136.intimacyBadge}>
          <Feather name="thermometer" size={12} color="#fb923c" />
          <Text style={v_d81136.intimacyText}>{v_8c0b26.myIntimacy}°C</Text>
        </View>
      ) : null}

      {}
      {v_26dce6 && (
        <>
          {
}
          <View style={v_d81136.rightActions}>
            <TouchableOpacity onPress={v_5bca36} style={v_d81136.actionBtn} activeOpacity={0.7}>
              <Ionicons
                name={v_85c07b ? "heart" : "heart-outline"}
                size={32}
                color={v_85c07b ? "#ef4444" : v_1bfbd0.white}
              />
              <Text style={v_d81136.actionLabel}>{v_8c0b26.likes}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={v_48b0c1} style={v_d81136.actionBtn} activeOpacity={0.7}>
              <Feather name="message-circle" size={30} color={v_1bfbd0.white} />
              <Text style={v_d81136.actionLabel}>{v_8c0b26.comments}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={v_d51485} style={v_d81136.actionBtn} activeOpacity={0.7}>
              <Feather name="share-2" size={28} color={v_1bfbd0.white} />
            </TouchableOpacity>
            {v_27b331 && (
              <TouchableOpacity
                onPress={v_27b331}
                style={v_d81136.actionBtn}
                activeOpacity={0.7}
                accessibilityLabel="more-options"
              >
                <Feather name="more-vertical" size={28} color={v_1bfbd0.white} />
              </TouchableOpacity>
            )}
          </View>

          <View style={v_d81136.bottomContent}>
            <View style={v_d81136.profileRow}>
              <View style={v_d81136.profileInfo}>
                <View style={v_d81136.authorRow}>
                  <Text style={v_d81136.authorName}>{v_8c0b26.author}</Text>
                  {v_8c0b26.cloneType === "expert" && <ExpertBadge size={22} />}
                </View>
                <Text style={v_d81136.username}>{v_8c0b26.username}</Text>
              </View>
              {!v_799eb5 && (
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
              )}
            </View>

            {

}
            {v_8c0b26.description ? (
              <HashtagText
                style={v_d81136.description}
                tagStyle={{ color: "#a78bfa", fontWeight: "700" }}
              >
                {v_8c0b26.description}
              </HashtagText>
            ) : null}

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
        </>
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

  rightActions: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
  },

  intimacyBadge: {
    position: "absolute",
    top: 56,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: v_8b0c90.full,
    zIndex: 10,
  },
  intimacyText: {
    fontSize: 11,
    fontWeight: "600",
    color: v_1bfbd0.white,
  },

  actionBtn: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: v_1bfbd0.white,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  description: {
    fontSize: 14,
    color: v_1bfbd0.white,
    lineHeight: 20,
    marginBottom: 12,

    paddingRight: 44,
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
