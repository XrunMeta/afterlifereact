import v_a3453e from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_4623af,
  v_cf9c33,
  v_700696,
  v_122070,
  v_472849,
} from "rcmrninabrnb";
import { v_5ade23 } from "xbfwaaanosqvazmrqoah";
import { v_dec439, v_25515d } from "zvyjokvuouwvifyzks";
import { v_772971 } from "jmpfvteuuztnp";
import { v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import type { v_5b8240 } from "ykfzqfftuciufdadykzsyvzknqnwb";
import type { v_97a9a8 } from "../../navigation/types";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../constants";
import type { v_19b433 } from "../../types/feed";
import v_5778ce from "../common/HashtagText";
import v_8fba67 from "./ExpertBadge";

const v_2c17d6 = /#[a-zA-Z0-9_가-힣ᄀ-ᇿㄱ-ㆎ]+/g;

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

  onIntimacyPress?: () => void;

  onOwnerPress?: () => void;

  onOwnerFollowPress?: () => void;

  isOwnerFollowed?: boolean;

  onGiftPress?: () => void;

  onDescriptionScrollStart?: () => void;

  onDescriptionScrollEnd?: () => void;

  onDescriptionPress?: () => void;
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
  onIntimacyPress: v_b85128,
  onOwnerPress: v_b85e42,
  onOwnerFollowPress: v_a32130,
  isOwnerFollowed: v_1d1155 = false,
  onGiftPress: v_8506d0,
  onDescriptionScrollStart: v_c29799,
  onDescriptionScrollEnd: v_bb9bff,
  onDescriptionPress: v_9c79dc,
}) => {
  const { t: v_8d41d7 } = v_772971();
  const v_3c9f12 = v_ada615<v_5b8240<v_97a9a8>>();

  const v_43c476 = v_a3453e.useMemo<string[]>(() => {
    const v_38d084 = v_8c0b26.description ?? "";
    if (!v_38d084) return [];
    v_2c17d6.lastIndex = 0;
    const v_110a8b = new Set<string>();
    const v_8d4337 = [];
    let v_35f85c;
    while ((v_35f85c = v_2c17d6.exec(v_38d084)) !== null) {
      const v_bd1444 = v_35f85c[0];
      if (!v_110a8b.has(v_bd1444)) {
        v_110a8b.add(v_bd1444);
        v_8d4337.push(v_bd1444);
      }
    }
    return v_8d4337;
  }, [v_8c0b26.description]);
  const v_6ee356 = (v_bd1444) => {
    const v_f23d49 = v_bd1444.replace(/^#+/, "");
    v_3c9f12.navigate("SearchTab", { initialQuery: v_f23d49 });
  };

  const v_fd0962 = v_3d6201 < 640;
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
      <LinearGradient
        colors={["rgba(0,0,0,0.55)", "rgba(0,0,0,0.2)", "transparent"]}
        locations={[0, 0.6, 1]}
        style={v_d81136.gradientTop}
      />

      {
}
      {v_26dce6 && (v_8c0b26.ownerName || v_8c0b26.ownerAvatarUrl || v_27b331) ? (
        <View style={v_d81136.ownerHeader}>
          <TouchableOpacity
            style={v_d81136.ownerInfo}
            onPress={v_b85e42}
            disabled={!v_b85e42}
            activeOpacity={0.7}
          >
            {v_8c0b26.ownerAvatarUrl ? (
              <Image source={{ uri: v_8c0b26.ownerAvatarUrl }} style={v_d81136.ownerAvatar} />
            ) : (
              <View style={[v_d81136.ownerAvatar, v_d81136.ownerAvatarPlaceholder]}>
                <Feather name="user" size={14} color={v_1bfbd0.zinc400} />
              </View>
            )}
            <Text style={v_d81136.ownerName} numberOfLines={1}>
              {v_8c0b26.ownerName ?? ""}
            </Text>
          </TouchableOpacity>
          {}
          {v_27b331 ? (
            <TouchableOpacity
              onPress={v_27b331}
              style={v_d81136.ownerMoreBtn}
              accessibilityLabel="more-options"
            >
              <Feather name="more-vertical" size={20} color={v_1bfbd0.white} />
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {
}
      {v_26dce6 && v_43c476.length > 0 ? (
        <View style={v_d81136.hashtagRowWrap} pointerEvents="box-none">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={v_d81136.hashtagRowContent}
            keyboardShouldPersistTaps="handled"
          >
            {v_43c476.map((v_bd1444) => (
              <TouchableOpacity
                key={v_bd1444}
                style={v_d81136.hashtagChip}
                activeOpacity={0.7}
                onPress={() => v_6ee356(v_bd1444)}
              >
                <Text style={v_d81136.hashtagChipText}>{v_bd1444}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {
}
      {false && typeof v_8c0b26.myIntimacy === "number" ? (
        <TouchableOpacity
          style={v_d81136.intimacyBadge}
          onPress={v_b85128}
          activeOpacity={0.7}
          disabled={!v_b85128}
          accessibilityLabel="intimacy-events"
        >
          <Feather name="thermometer" size={12} color="#fb923c" />
          <Text style={v_d81136.intimacyText}>{v_8c0b26.myIntimacy}°C</Text>
        </TouchableOpacity>
      ) : null}

      {}
      {v_26dce6 && (
        <>
          {}
          <View style={[v_d81136.rightActions, v_fd0962 && v_d81136.rightActionsShift]}>
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
            {}
            <TouchableOpacity onPress={v_8506d0} style={v_d81136.actionBtn} activeOpacity={0.7}>
              <Feather name="gift" size={28} color={v_1bfbd0.white} />
              <Text style={v_d81136.actionLabel}>{v_8c0b26.giftsReceived ?? 0}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={v_d51485} style={v_d81136.actionBtn} activeOpacity={0.7}>
              <Feather name="share-2" size={28} color={v_1bfbd0.white} />
            </TouchableOpacity>
            {}
          </View>

          <View style={v_d81136.bottomContent}>
            <View style={v_d81136.profileRow}>
              <View style={v_d81136.profileInfo}>
                <View style={v_d81136.authorRow}>
                  <Text style={v_d81136.authorName}>{v_8c0b26.author}</Text>
                  {v_8c0b26.cloneType === "expert" && <ExpertBadge size={22} />}
                  {}
                  {typeof v_8c0b26.myIntimacy === "number" ? (
                    <TouchableOpacity
                      style={v_d81136.intimacyBadgeInline}
                      onPress={v_b85128}
                      activeOpacity={0.7}
                      disabled={!v_b85128}
                      accessibilityLabel="intimacy-events"
                    >
                      <Feather name="thermometer" size={12} color="#fb923c" />
                      <Text style={v_d81136.intimacyText}>{v_8c0b26.myIntimacy}°C</Text>
                    </TouchableOpacity>
                  ) : null}
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
              <TouchableOpacity
                onPress={v_9c79dc}
                activeOpacity={0.7}
                disabled={!v_9c79dc}
              >
                <HashtagText
                  style={v_d81136.description}
                  tagStyle={{ color: "#a78bfa", fontWeight: "700" }}
                  numberOfLines={2}
                >
                  {v_8c0b26.description}
                </HashtagText>
              </TouchableOpacity>
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
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  hashtagChipText: {
    fontSize: 13,
    color: v_1bfbd0.zinc900,
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
    color: v_1bfbd0.white,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  ownerFollowBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: v_8b0c90.full,
    backgroundColor: v_1bfbd0.white,
  },
  ownerFollowBtnActive: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  ownerFollowText: {
    fontSize: 12,
    fontWeight: "700",
    color: v_1bfbd0.zinc900,
  },
  ownerFollowTextActive: {
    color: v_1bfbd0.white,
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
    borderRadius: v_8b0c90.full,
    zIndex: 10,
  },

  intimacyBadgeInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: v_8b0c90.full,
    marginLeft: 4,
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
