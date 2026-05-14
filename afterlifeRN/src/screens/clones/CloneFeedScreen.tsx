

import v_a3453e, { v_c4deb2, v_e662ae, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
  v_700696,
  v_5f4661,
  v_aa7413,
  v_09d0e5,
  v_122070,
  v_79c4f2,
  v_cf9c33,
  v_0e1f26,
  v_326be8,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_c18c22 } from "svuoaeceudfxfjvvpmmmchnwljywbphjgb";
import { v_772971 } from "jmpfvteuuztnp";
import type { v_432191 } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_8ad91b } from "../../navigation/types";
import v_9706a6 from "../../components/ui/FeedCard";
import v_8e7ad4 from "../../components/ui/SwipeDownSheet";
import type { v_19b433 } from "../../types/feed";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_b4902e } from "../../stores/followStore";
import { v_37977a } from "../../stores/feedStore";
import {
  v_b14fce,
  v_0ff331,
  v_4208e7,
  v_3f8bc7,
  v_6f689a,
  v_0df337,
  type v_52af9d,
} from "../../api/clones";
import { v_bfd883 } from "../../lib/relativeTime";
import { v_1bfbd0 } from "../../components/constants";

type Props = v_432191<v_8ad91b, "CloneFeed">;

export default function v_9887a2({ route: v_c7daf6, navigation: v_c65f5d }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const { feed: v_2db2a5 } = v_c7daf6.params;
  const v_033e14 = v_e0068c();
  const v_f9771e = v_c18c22(0);

  const { height: v_28d8d8 } = v_700696.get("window");
  const v_53dd92 = v_f9771e > 0 ? v_f9771e : v_033e14.bottom;
  const v_3d6201 = v_28d8d8 - v_53dd92;

  const v_f5f393 = v_1ed7d9((v_fd5f43) => v_fd5f43.apiUser?.id ?? v_fd5f43.user?.id ?? null);
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);

  const v_1e752a = v_b4902e((v_fd5f43) => v_fd5f43.follows);
  const v_b30b81 = v_b4902e((v_fd5f43) => v_fd5f43.isFollowing);
  const v_3094d4 = v_b4902e((v_fd5f43) => v_fd5f43.toggleFollow);
  const v_632420 = v_37977a((v_fd5f43) => v_fd5f43.likedIds);
  const v_a96ced = v_37977a((v_fd5f43) => v_fd5f43.toggleLike);
  void v_1e752a; 

  let v_6856a9 = v_2db2a5.content ?? "";
  const v_167615 = /#[\p{L}\p{N}_]+/u.test(v_6856a9);
  if (v_2db2a5.interests.length > 0 && !v_167615) {
    const v_cf5673 = v_2db2a5.interests.map((v_ebec57) => `#${v_ebec57}`).join(" ");
    v_6856a9 = v_6856a9.trim().length > 0 ? `${v_6856a9} ${v_cf5673}` : v_cf5673;
  }

  const [v_58313d, v_abdcca] = v_5ab095<number>(v_2db2a5.likesCount);
  const [v_7c0a2d, v_d9b4b4] = v_5ab095<number>(v_2db2a5.commentsCount ?? 0);

  const [v_6bbace, v_a97d6f] = v_5ab095<number>(v_2db2a5.id);

  const item: v_19b433 = {
    id: v_6bbace,
    cloneId: v_2db2a5.cloneId,
    cloneOwnerId: v_2db2a5.clone.ownerId,
    cloneVisibility: v_2db2a5.clone.visibility,
    author: v_2db2a5.clone.name,
    username: `@${v_2db2a5.clone.username}`,
    authorAvatar: v_2db2a5.clone.avatarUrl ?? "",
    image: v_2db2a5.mediaUrl ?? v_2db2a5.clone.avatarUrl ?? "",
    title: v_2db2a5.clone.name,
    description: v_6856a9,
    type: v_2db2a5.clone.cloneType,
    mainCategory: "",
    interests: v_2db2a5.interests,
    likes: String(v_58313d),
    comments: v_7c0a2d,
  };

  const [v_b84498, v_e24028] = v_5ab095<boolean>(v_2db2a5.likedByMe ?? v_632420.includes(v_6bbace));
  const v_799eb5 = v_f5f393 != null && v_8c0b26.cloneOwnerId === v_f5f393;

  const v_d3af9c = async () => {
    const v_a448ad = !v_b84498;
    v_e24028(v_a448ad);
    v_a96ced(v_8c0b26.id);

    v_abdcca((v_ba2215) => Math.max(0, v_ba2215 + (v_a448ad ? 1 : -1)));
    if (!v_2ca7e0) return;
    try {
      if (v_a448ad) await v_b14fce(v_2ca7e0, v_8c0b26.cloneId);
      else await v_0ff331(v_2ca7e0, v_8c0b26.cloneId);
    } catch (v_49263d) {
      console.warn("[CloneFeed] like toggle failed:", v_49263d);

      v_e24028(!v_a448ad);
      v_abdcca((v_ba2215) => Math.max(0, v_ba2215 + (v_a448ad ? -1 : 1)));
    }
  };

  const v_f8043e = () => {
    v_c65f5d.navigate("Call", {
      cloneId: v_8c0b26.cloneId,
      name: v_8c0b26.author,
      image: v_8c0b26.image,
    });
  };

  const v_22cd2d = async () => {
    try {
      await v_5f4661.share({
        message: `${v_8c0b26.author} 페르소나와 만나보세요!\nhttps://afterlife.app/clone/${v_8c0b26.cloneId}`,
        title: v_8c0b26.author,
      });
    } catch (v_49263d) {
      console.warn("[CloneFeed] share failed:", v_49263d);
    }
  };

  const [v_1126f9, v_0c9768] = v_5ab095(false);
  const [v_ecfc0f, v_04f2fc] = v_5ab095<v_52af9d[]>([]);
  const [v_465030, v_856daf] = v_5ab095(false);
  const [v_48e7fe, v_856f84] = v_5ab095("");
  const v_4c2809 = v_e662ae(false);
  const [v_b0af20, v_52390e] = v_5ab095(false);

  const [v_7e4acc, v_de86c2] = v_5ab095(0);
  v_c4deb2(() => {
    const v_53f5d7 = v_0e1f26.addListener(
      v_326be8.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (v_9e86fd) => v_de86c2(v_9e86fd.endCoordinates.height),
    );
    const v_52528b = v_0e1f26.addListener(
      v_326be8.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => v_de86c2(0),
    );
    return () => {
      v_53f5d7.remove();
      v_52528b.remove();
    };
  }, []);

  v_c4deb2(() => {
    if (!v_1126f9) {
      v_04f2fc([]);
      return;
    }
    if (v_6bbace < 0) {
      v_04f2fc([]);
      return;
    }
    let v_2008a4 = false;
    v_856daf(true);
    v_04f2fc([]);
    v_4208e7(v_6bbace, { limit: 100 })
      .then((v_8f00b9) => {
        if (v_2008a4) return;
        v_04f2fc(v_8f00b9.items);
      })
      .catch((v_49263d) => {
        console.warn("[CloneFeed] listFeedComments failed:", v_49263d);
        if (!v_2008a4) v_04f2fc([]);
      })
      .finally(() => {
        if (!v_2008a4) v_856daf(false);
      });
    return () => {
      v_2008a4 = true;
    };
  }, [v_1126f9, v_6bbace]);

  const v_8e4668 = async () => {
    if (v_4c2809.current) return;
    const v_b43b74 = v_48e7fe.trim();
    if (!v_b43b74 || !v_2ca7e0) return;
    v_4c2809.current = true;
    v_52390e(true);
    try {
      let v_bb71b6;
      if (v_6bbace < 0) {

        const v_8f00b9 = await v_6f689a(v_2ca7e0, v_2db2a5.cloneId, v_b43b74);
        v_bb71b6 = v_8f00b9.comment.feedId;
        v_a97d6f(v_bb71b6);
      } else {
        await v_3f8bc7(v_2ca7e0, v_6bbace, v_b43b74);
        v_bb71b6 = v_6bbace;
      }
      v_856f84("");
      const v_cb35cb = await v_4208e7(v_bb71b6, { limit: 100 });
      v_04f2fc(v_cb35cb.items);
      v_d9b4b4(v_cb35cb.items.length);
    } catch (v_49263d) {
      console.warn("[CloneFeed] postFeedComment failed:", v_49263d);
    } finally {
      v_4c2809.current = false;
      v_52390e(false);
    }
  };

  const v_b72645 = (v_d91518) => {
    if (v_6bbace < 0 || !v_2ca7e0) return;
    void (async () => {
      try {
        await v_0df337(v_2ca7e0, v_6bbace, v_d91518);
        v_04f2fc((v_ba2215) => {
          const v_a448ad = v_ba2215.filter((v_3f4e2e) => v_3f4e2e.id !== v_d91518);
          v_d9b4b4(v_a448ad.length);
          return v_a448ad;
        });
      } catch (v_49263d) {
        console.warn("[CloneFeed] deleteFeedComment failed:", v_49263d);
      }
    })();
  };

  return (
    <View style={v_d81136.root}>
      <FeedCard
        item={v_8c0b26}
        isActive
        isLiked={v_b84498}
        isFollowed={v_b30b81(v_8c0b26.cloneId)}
        isOwn={v_799eb5}
        cardHeight={v_3d6201}
        onToggleLike={v_d3af9c}
        onToggleFollow={() => void v_3094d4(v_8c0b26.cloneId)}
        onCallPress={v_f8043e}
        onCommentPress={() => v_0c9768(true)}
        onSharePress={v_22cd2d}
      />

      {}
      <TouchableOpacity
        onPress={() => v_c65f5d.goBack()}
        style={[v_d81136.backBtn, { top: v_033e14.top + 8 }]}
        hitSlop={12}
      >
        <Feather name="arrow-left" size={26} color={v_1bfbd0.white} />
      </TouchableOpacity>

      {}
      <Modal visible={v_1126f9} transparent animationType="slide">
        <Pressable
          style={v_d81136.commentOverlay}
          onPress={() => {
            v_0e1f26.dismiss();
            v_0c9768(false);
          }}
        >
          <SwipeDownSheet
            onClose={() => {
              v_0e1f26.dismiss();
              v_0c9768(false);
            }}
            style={[
              v_d81136.commentSheet,
              {
                paddingBottom: 24 + Math.max(v_033e14.bottom, 0),
                height: Math.max(v_28d8d8 * 0.7 - v_7e4acc, 200),
                transform: [{ translateY: -v_7e4acc }],
              },
            ]}
          >
            <View style={v_d81136.sheetHandle} />
            <View style={v_d81136.commentHeaderRow}>
              <Text style={v_d81136.commentTitle}>
                {v_8d41d7("feed.commentCount", { n: v_ecfc0f.length })}
              </Text>
              <TouchableOpacity onPress={() => v_0c9768(false)}>
                <Feather name="x" size={20} color={v_1bfbd0.white} />
              </TouchableOpacity>
            </View>
            <ScrollView style={v_d81136.commentScroll} showsVerticalScrollIndicator={false}>
              {v_465030 ? (
                <View style={v_d81136.emptyComment}>
                  <Feather name="loader" size={28} color="rgba(255,255,255,0.5)" />
                </View>
              ) : v_ecfc0f.length > 0 ? (
                v_ecfc0f.map((v_3f4e2e) => (
                  <View key={v_3f4e2e.id} style={v_d81136.commentRow}>
                    {v_3f4e2e.user.avatarUrl ? (
                      <Image source={{ uri: v_3f4e2e.user.avatarUrl }} style={v_d81136.commentAvatar} />
                    ) : (
                      <View
                        style={[
                          v_d81136.commentAvatar,
                          { backgroundColor: "rgba(255,255,255,0.15)" },
                        ]}
                      />
                    )}
                    <View style={v_d81136.commentInfo}>
                      <View style={v_d81136.commentMeta}>
                        <Text style={v_d81136.commentAuthor}>
                          {v_3f4e2e.user.name ?? v_3f4e2e.user.email}
                        </Text>
                        <Text style={v_d81136.commentTime}>{v_bfd883(v_3f4e2e.createdAt)}</Text>
                        {v_3f4e2e.userId === v_f5f393 && (
                          <TouchableOpacity
                            onPress={() => v_b72645(v_3f4e2e.id)}
                            style={{ marginLeft: 8 }}
                          >
                            <Feather name="trash-2" size={14} color="rgba(255,255,255,0.6)" />
                          </TouchableOpacity>
                        )}
                      </View>
                      <Text style={v_d81136.commentContent}>{v_3f4e2e.content}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={v_d81136.emptyComment}>
                  <Feather name="message-circle" size={40} color="rgba(255,255,255,0.3)" />
                  <Text style={v_d81136.emptyText}>{v_8d41d7("feed.commentsEmpty")}</Text>
                </View>
              )}
            </ScrollView>
            <View style={v_d81136.commentInputRow}>
              <TextInput
                style={v_d81136.commentInput}
                value={v_48e7fe}
                onChangeText={v_856f84}
                placeholder={v_8d41d7("feed.commentPlaceholder")}
                placeholderTextColor="rgba(255,255,255,0.4)"
              />
              <TouchableOpacity
                disabled={!v_48e7fe.trim() || !v_2ca7e0 || v_b0af20}
                onPress={v_8e4668}
              >
                <Feather
                  name="send"
                  size={18}
                  color={
                    v_48e7fe.trim() && v_2ca7e0 && !v_b0af20
                      ? v_1bfbd0.white
                      : "rgba(255,255,255,0.3)"
                  }
                />
              </TouchableOpacity>
            </View>
          </SwipeDownSheet>
        </Pressable>
      </Modal>
    </View>
  );
}

const v_d81136 = v_472849.create({
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
    backgroundColor: "rgba(24,24,27,0.95)",
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
    backgroundColor: "rgba(255,255,255,0.3)",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 12,
  },
  commentHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  commentTitle: { fontSize: 16, fontWeight: "700", color: v_1bfbd0.white },
  commentScroll: { flex: 1, marginTop: 12 },
  commentRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16 },
  commentInfo: { flex: 1 },
  commentMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  commentAuthor: { fontSize: 13, fontWeight: "600", color: v_1bfbd0.white },
  commentTime: { fontSize: 11, color: "rgba(255,255,255,0.5)" },
  commentContent: { fontSize: 14, color: "rgba(255,255,255,0.9)", lineHeight: 19 },
  emptyComment: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 8 },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: 12,
  },
  commentInput: {
    flex: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 14,
    color: v_1bfbd0.white,
  },
});
