import v_a3453e, { v_5ab095, v_e662ae, v_de06a3, v_c4deb2 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_9cabcb,
  v_700696,
  v_4623af,
  v_472849,
  v_bd73dc,
  v_326be8,
  v_aa7413,
  v_09d0e5,
  v_122070,
  v_cf9c33,
  v_79c4f2,
  v_0e1f26,
} from "rcmrninabrnb";
import { v_03e392 } from "rcmrninabrnb";
import { v_b5df25 } from "ernurodqvmtspux";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_c18c22 } from "svuoaeceudfxfjvvpmmmchnwljywbphjgb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_cf763b, v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import { v_772971 } from "jmpfvteuuztnp";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";

import v_9706a6 from "../../components/ui/FeedCard";
import v_ca88c9 from "../../components/ui/FilterModal";
import { v_37977a, v_10e36e } from "../../stores/feedStore";
import { v_b4902e } from "../../stores/followStore";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_f386b1 } from "../../mocks/feedAdapter";
import {
  v_4208e7,
  v_3f8bc7,
  v_6f689a,
  v_0df337,
  v_97c75d,
  type v_52af9d,
} from "../../api/clones";
import { v_bfd883 } from "../../lib/relativeTime";
import { v_1bfbd0, v_8b0c90 } from "../../components/constants";
import type { v_19b433 } from "../../types/feed";
import type { v_8ad91b } from "../../navigation/types";

const { height: v_28d8d8 } = v_700696.get("window");

const v_e4d4c8 = 56;

export default function v_c316d8() {
  const { t: v_8d41d7 } = v_772971();
  const v_f4c991 = v_ada615<v_390fcc<v_8ad91b>>();
  const v_033e14 = v_e0068c();
  const v_f9771e = v_c18c22(0);
  const v_ebdf9a = v_e662ae<v_9cabcb>(null);

  const v_53dd92 = v_326be8.OS === "ios"
    ? v_033e14.bottom
    : Math.max(v_f9771e, v_033e14.bottom);
  const v_1be4da = v_28d8d8 - v_e4d4c8 - v_53dd92;

  const v_632420 = v_37977a((v_fd5f43) => v_fd5f43.likedIds);
  const v_976e06 = v_37977a((v_fd5f43) => v_fd5f43.selectedInterests);
  const v_a96ced = v_37977a((v_fd5f43) => v_fd5f43.toggleLike);
  const v_770327 = v_37977a((v_fd5f43) => v_fd5f43.setSelectedInterests);
  const v_1c7dea = v_37977a((v_fd5f43) => v_fd5f43.getFilteredFeeds);
  const v_c600ef = v_37977a((v_fd5f43) => v_fd5f43.loadDiscover);
  const v_71b114 = v_37977a((v_fd5f43) => v_fd5f43.apiFeeds);
  const v_1e752a = v_b4902e((v_fd5f43) => v_fd5f43.follows);
  const v_b30b81 = v_b4902e((v_fd5f43) => v_fd5f43.isFollowing);
  const v_3094d4 = v_b4902e((v_fd5f43) => v_fd5f43.toggleFollow);

  v_c4deb2(() => {
    if (v_71b114 == null) {
      void v_c600ef();
    }
  }, [v_71b114, v_c600ef]);

  v_cf763b(
    v_de06a3(() => {
      void v_c600ef();
    }, [v_c600ef]),
  );

  const [v_2bcb8f, v_ddecc4] = v_5ab095(0);
  const [v_a4bef1, v_ea2b4b] = v_5ab095(false);
  const [v_c79424, v_4c8a46] = v_5ab095<string[]>(v_976e06);
  const [v_ed660d, v_b07dd3] = v_5ab095<number | null>(null);
  const [v_48e7fe, v_856f84] = v_5ab095("");

  const [v_12fa22, v_949e66] = v_5ab095<{ cloneId: number; author: string } | null>(null);
  const [v_8282fa, v_15c939] = v_5ab095<string | null>(null);
  v_c4deb2(() => {
    if (v_8282fa) {
      const v_389afb = setTimeout(() => v_15c939(null), 2000);
      return () => clearTimeout(v_389afb);
    }
  }, [v_8282fa]);

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
  const v_507993 = v_7e4acc > 0;

  const filteredFeeds: v_19b433[] = v_1c7dea().map(v_f386b1);

  const v_829e3a = v_de06a3((v_c09aa8, v_f4e98d) => {
    v_10e36e.set(v_c09aa8, { commentsCount: v_f4e98d });
    const v_c3bc75 = v_37977a.getState().apiFeeds;
    if (v_c3bc75) {
      v_37977a.setState({
        apiFeeds: v_c3bc75.map((v_8b5cd8) => (v_8b5cd8.id === v_c09aa8 ? { ...v_8b5cd8, commentsCount: v_f4e98d } : v_8b5cd8)),
      });
    }
  }, []);

  const v_43bc1b = v_de06a3(
    ({ viewableItems: v_e5cc27 }: { viewableItems: v_bd73dc[] }) => {
      if (v_e5cc27.length > 0 && v_e5cc27[0].index != null) {
        v_ddecc4(v_e5cc27[0].index);
      }
    },
    []
  );

  const v_10f7ba = {
    itemVisiblePercentThreshold: 50,
  };

  const v_f10970 = (v_e4601c) => {
    v_4c8a46((v_ba2215) =>
      v_ba2215.includes(v_e4601c)
        ? v_ba2215.filter((v_ebec57) => v_ebec57 !== v_e4601c)
        : [...v_ba2215, v_e4601c]
    );
  };

  const v_604177 = () => {
    v_770327(v_c79424);
    v_ddecc4(0);
    v_ebdf9a.current?.scrollToOffset({ offset: 0, animated: false });
    v_ea2b4b(false);
  };

  const v_61765c = () => {
    v_4c8a46(v_976e06);
    v_ea2b4b(true);
  };

  const [v_ecfc0f, v_04f2fc] = v_5ab095<v_52af9d[]>([]);
  const [v_465030, v_856daf] = v_5ab095(false);
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const v_f5f393 = v_1ed7d9((v_fd5f43) => v_fd5f43.apiUser?.id ?? v_fd5f43.user?.id ?? null);

  v_c4deb2(() => {
    if (v_ed660d == null) {
      v_04f2fc([]);
      return;
    }
    if (v_ed660d < 0) {

      v_04f2fc([]);
      return;
    }
    let v_2008a4 = false;
    v_856daf(true);
    v_04f2fc([]);
    v_4208e7(v_ed660d, { limit: 100 })
      .then((v_8f00b9) => {
        if (v_2008a4) return;
        v_04f2fc(v_8f00b9.items);
      })
      .catch((v_49263d) => {
        console.warn("[Home] listFeedComments failed:", v_49263d);
        if (!v_2008a4) v_04f2fc([]);
      })
      .finally(() => {
        if (!v_2008a4) v_856daf(false);
      });
    return () => {
      v_2008a4 = true;
    };
  }, [v_ed660d]);

  const v_4c2809 = v_e662ae(false);
  const [v_b0af20, v_52390e] = v_5ab095(false);
  const v_8e4668 = async () => {
    if (v_ed660d == null) return;
    if (v_4c2809.current) return; 
    const v_b43b74 = v_48e7fe.trim();
    if (!v_b43b74 || !v_2ca7e0) return;
    v_4c2809.current = true;
    v_52390e(true);
    try {
      let v_6bbace;
      const v_e05de7 = v_ed660d;
      if (v_ed660d < 0) {

        const v_6e0fd3 = -v_ed660d;
        const v_8f00b9 = await v_6f689a(v_2ca7e0, v_6e0fd3, v_b43b74);
        v_6bbace = v_8f00b9.comment.feedId;
        v_b07dd3(v_6bbace);

        const v_c3bc75 = v_37977a.getState().apiFeeds;
        if (v_c3bc75) {
          v_37977a.setState({
            apiFeeds: v_c3bc75.map((v_8b5cd8) => (v_8b5cd8.id === v_e05de7 ? { ...v_8b5cd8, id: v_6bbace } : v_8b5cd8)),
          });
        }
        v_10e36e.delete(v_e05de7);
      } else {
        await v_3f8bc7(v_2ca7e0, v_ed660d, v_b43b74);
        v_6bbace = v_ed660d;
      }
      v_856f84("");
      const v_cb35cb = await v_4208e7(v_6bbace, { limit: 100 });
      v_04f2fc(v_cb35cb.items);

      v_829e3a(v_6bbace, v_cb35cb.items.length);
    } catch (v_49263d) {
      console.warn("[Home] postFeedComment failed:", v_49263d);
    } finally {
      v_4c2809.current = false;
      v_52390e(false);
    }
  };

  const v_b72645 = (v_d91518) => {
    if (v_ed660d == null || v_ed660d < 0 || !v_2ca7e0) return;
    v_03e392.alert(
      "댓글 삭제",
      "이 댓글을 삭제하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              await v_0df337(v_2ca7e0, v_ed660d, v_d91518);
              v_04f2fc((v_ba2215) => {
                const v_a448ad = v_ba2215.filter((v_3f4e2e) => v_3f4e2e.id !== v_d91518);
                v_829e3a(v_ed660d, v_a448ad.length);
                return v_a448ad;
              });
            } catch (v_49263d) {
              console.warn("[Home] deleteFeedComment failed:", v_49263d);
            }
          },
        },
      ],
    );
  };

  const v_fcf6ec = v_de06a3(
    ({ item: v_8c0b26, index: v_a56041 }: { item: v_19b433; index: number }) => (
      <FeedCard
        item={v_8c0b26}
        isActive={v_a56041 === v_2bcb8f}
        isLiked={v_632420.includes(v_8c0b26.id)}
        isFollowed={v_b30b81(v_8c0b26.cloneId)}
        cardHeight={v_1be4da}
        onToggleLike={() => v_a96ced(v_8c0b26.id)}
        onToggleFollow={() => void v_3094d4(v_8c0b26.cloneId)}
        onCallPress={() => v_f4c991.navigate("Call", { cloneId: v_8c0b26.cloneId, name: v_8c0b26.author, image: v_8c0b26.image })}
        onCommentPress={() => v_b07dd3(v_8c0b26.id)}
        onMorePress={() => v_949e66({ cloneId: v_8c0b26.cloneId, author: v_8c0b26.author })}
      />
    ),
    [v_2bcb8f, v_632420, v_1e752a, v_1be4da, v_a96ced, v_3094d4, v_b30b81]
  );

  return (
    <View style={v_d81136.root}>
      <StatusBar style="light" />
      {}
      <FlatList
        ref={v_ebdf9a}
        data={v_ff422a}
        renderItem={v_fcf6ec}
        keyExtractor={(v_8c0b26) => String(v_8c0b26.id)}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={v_1be4da}
        decelerationRate="fast"
        onViewableItemsChanged={v_43bc1b}
        viewabilityConfig={v_10f7ba}
        getItemLayout={(v_37eab7, v_a56041) => ({
          length: v_1be4da,
          offset: v_1be4da * v_a56041,
          index: v_a56041,
        })}
      />

      {}
      <View style={[v_d81136.topOverlay, { top: v_033e14.top + 8 }]}>
        {v_976e06.length > 0 && (
          <View style={v_d81136.tagsRow}>
            {v_976e06.map((v_e4601c) => (
              <View key={v_e4601c} style={v_d81136.topTag}>
                <Text style={v_d81136.topTagText}>#{v_e4601c}</Text>
              </View>
            ))}
          </View>
        )}
        <TouchableOpacity
          onPress={v_61765c}
          style={v_d81136.filterButton}
          activeOpacity={0.7}
        >
          <Feather name="filter" size={20} color={v_1bfbd0.white} />
        </TouchableOpacity>
      </View>

      {}
      <Modal visible={!!v_ed660d} transparent animationType="slide">
        <Pressable style={v_d81136.commentOverlay} onPress={() => { v_0e1f26.dismiss(); v_b07dd3(null); }}>
          <View
            style={[
              v_d81136.commentSheet,

              {
                paddingBottom: 24 + Math.max(v_033e14.bottom, 0),
                height: Math.max(v_28d8d8 * 0.7 - v_7e4acc, 200),
                transform: [{ translateY: -v_7e4acc }],
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View style={v_d81136.sheetHandle} />
            <View style={v_d81136.commentHeaderRow}>
              <Text style={v_d81136.commentTitle}>{v_8d41d7("feed.commentCount", { n: v_ecfc0f.length })}</Text>
              <TouchableOpacity onPress={() => v_b07dd3(null)}>
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
                      <View style={[v_d81136.commentAvatar, { backgroundColor: "rgba(255,255,255,0.15)" }]} />
                    )}
                    <View style={v_d81136.commentInfo}>
                      <View style={v_d81136.commentMeta}>
                        <Text style={v_d81136.commentAuthor}>{v_3f4e2e.user.name ?? v_3f4e2e.user.email}</Text>
                        <Text style={v_d81136.commentTime}>{v_bfd883(v_3f4e2e.createdAt)}</Text>
                        {v_3f4e2e.userId === v_f5f393 && (
                          <TouchableOpacity onPress={() => v_b72645(v_3f4e2e.id)} style={{ marginLeft: 8 }}>
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
          </View>
        </Pressable>
      </Modal>

      {}
      <FilterModal
        visible={v_a4bef1}
        selectedInterests={v_c79424}
        onToggleInterest={v_f10970}
        onClearAll={() => v_4c8a46([])}
        onApply={v_604177}
        onClose={() => v_ea2b4b(false)}
      />

      {}
      <Modal visible={!!v_12fa22} transparent animationType="fade">
        <Pressable style={v_d81136.moreOverlay} onPress={() => v_949e66(null)}>
          <Pressable
            style={[v_d81136.moreSheet, { paddingBottom: 24 + Math.max(v_033e14.bottom, 0) }]}
            onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}
          >
            <View style={v_d81136.moreSheetHandle} />
            <Text style={v_d81136.moreTitle}>{v_12fa22?.author}</Text>
            <TouchableOpacity
              style={v_d81136.moreItem}
              onPress={() => {
                v_949e66(null);
                v_15c939("신고가 접수됐어요");
              }}
            >
              <Feather name="flag" size={20} color="#ef4444" />
              <Text style={[v_d81136.moreItemText, { color: "#ef4444" }]}>신고하기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={v_d81136.moreItem}
              onPress={async () => {
                const v_5f5d6d = v_12fa22;
                v_949e66(null);
                if (!v_5f5d6d || !v_2ca7e0) {
                  console.log(
                    `[BLOCK] aborted — target=${!!v_5f5d6d} accessToken=${!!v_2ca7e0}`,
                  );
                  return;
                }
                console.log(
                  `[BLOCK] start cloneId=${v_5f5d6d.cloneId} author=${v_5f5d6d.author}`,
                );
                try {
                  console.log(`[BLOCK] → POST /oth-path${v_5f5d6d.cloneId}/block`);
                  const v_9297f1 = await v_97c75d(v_2ca7e0, v_5f5d6d.cloneId);
                  console.log(`[BLOCK] ← block API ok:`, v_9297f1);
                  v_15c939("이 페르소나가 차단됐어요");

                  const v_c3bc75 = v_37977a.getState().apiFeeds;
                  const v_f0ee2c = v_c3bc75?.length ?? 0;
                  if (v_c3bc75) {
                    v_37977a.setState({
                      apiFeeds: v_c3bc75.filter((v_23805a) => v_23805a.cloneId !== v_5f5d6d.cloneId),
                    });
                  }
                  console.log(
                    `[BLOCK] apiFeeds filtered — before=${v_f0ee2c} after=${
                      v_37977a.getState().apiFeeds?.length ?? 0
                    }`,
                  );

                  await v_b4902e.getState().unfollowLocalForBlock(v_5f5d6d.cloneId);

                  console.log(`[BLOCK] → loadDiscover() refetch`);
                  void v_c600ef();
                  console.log(`[BLOCK] complete cloneId=${v_5f5d6d.cloneId}`);
                } catch (v_49263d) {
                  console.warn(`[BLOCK] FAILED cloneId=${v_5f5d6d.cloneId}`, v_49263d);
                  v_15c939("차단에 실패했어요");
                }
              }}
            >
              <Feather name="slash" size={20} color={v_1bfbd0.zinc900} />
              <Text style={v_d81136.moreItemText}>차단하기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[v_d81136.moreItem, { borderBottomWidth: 0 }]}
              onPress={() => v_949e66(null)}
            >
              <Feather name="x" size={20} color={v_1bfbd0.zinc500} />
              <Text style={[v_d81136.moreItemText, { color: v_1bfbd0.zinc500 }]}>취소</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {v_8282fa && (
        <View style={v_d81136.toast}>
          <Text style={v_d81136.toastText}>{v_8282fa}</Text>
        </View>
      )}
    </View>
  );
}

const v_d81136 = v_472849.create({
  root: {
    flex: 1,
    backgroundColor: v_1bfbd0.zinc950,
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
    borderRadius: v_8b0c90.full,
  },
  topTagText: {
    fontSize: 12,
    fontWeight: "500",
    color: v_1bfbd0.white,
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
  commentSheet: { backgroundColor: "rgba(24,24,27,0.95)", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 24, height: "70%" },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.3)", alignSelf: "center", marginTop: 12, marginBottom: 12 },
  commentHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  commentTitle: { fontSize: 16, fontWeight: "700", color: v_1bfbd0.white },
  commentScroll: { flex: 1 },
  commentRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16 },
  commentInfo: { flex: 1 },
  commentMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  commentAuthor: { fontSize: 13, fontWeight: "600", color: v_1bfbd0.white },
  commentTime: { fontSize: 12, color: "rgba(255,255,255,0.5)" },
  commentContent: { fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 20 },
  emptyComment: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 8 },
  commentInputRow: { flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)", paddingTop: 12 },
  commentInput: { flex: 1, height: 40, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 20, paddingHorizontal: 16, fontSize: 14, color: v_1bfbd0.white },

  moreOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  moreSheet: { backgroundColor: v_1bfbd0.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 0, paddingHorizontal: 16 },
  moreSheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: v_1bfbd0.zinc300, alignSelf: "center", marginVertical: 12 },
  moreTitle: { fontSize: 13, color: v_1bfbd0.zinc500, textAlign: "center", paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: v_1bfbd0.zinc100 },
  moreItem: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: v_1bfbd0.zinc100 },
  moreItemText: { fontSize: 15, fontWeight: "500", color: v_1bfbd0.zinc900 },
  toast: { position: "absolute", bottom: 80, alignSelf: "center", paddingHorizontal: 20, paddingVertical: 10, backgroundColor: "rgba(0,0,0,0.85)", borderRadius: v_8b0c90.full },
  toastText: { color: v_1bfbd0.white, fontSize: 14 },
});
