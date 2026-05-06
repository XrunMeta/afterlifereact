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
} from "rcmrninabrnb";
import { v_b5df25 } from "ernurodqvmtspux";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_c18c22 } from "svuoaeceudfxfjvvpmmmchnwljywbphjgb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import { v_772971 } from "jmpfvteuuztnp";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";

import v_9706a6 from "../../components/ui/FeedCard";
import v_ca88c9 from "../../components/ui/FilterModal";
import { v_37977a } from "../../stores/feedStore";
import { v_b4902e } from "../../stores/followStore";
import { v_f386b1 } from "../../mocks/feedAdapter";
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

  const [v_2bcb8f, v_ddecc4] = v_5ab095(0);
  const [v_a4bef1, v_ea2b4b] = v_5ab095(false);
  const [v_c79424, v_4c8a46] = v_5ab095<string[]>(v_976e06);
  const [v_ed660d, v_b07dd3] = v_5ab095<number | null>(null);
  const [v_48e7fe, v_856f84] = v_5ab095("");

  const filteredFeeds: v_19b433[] = v_1c7dea().map(v_f386b1);

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

  const v_5b3987 = {
    1: [
      { id: "c1", author: "마음이", avatar: "https://i.pravatar.cc/100?img=1", content: "할아버지 목소리가 그리웠어요", time: "5분 전" },
      { id: "c2", author: "별빛", avatar: "https://i.pravatar.cc/100?img=2", content: "오늘도 힘이 되는 말씀 감사합니다", time: "12분 전" },
      { id: "c3", author: "하늘", avatar: "https://i.pravatar.cc/100?img=3", content: "따뜻한 조언 감사해요", time: "30분 전" },
    ],
    2: [
      { id: "c4", author: "소망", avatar: "https://i.pravatar.cc/100?img=9", content: "할머니 덕분에 오늘도 웃었어요", time: "3분 전" },
      { id: "c5", author: "봄날", avatar: "https://i.pravatar.cc/100?img=10", content: "정말 위로가 됩니다", time: "20분 전" },
    ],
    3: [
      { id: "c6", author: "선재팬", avatar: "https://i.pravatar.cc/100?img=5", content: "오늘도 좋은 하루!", time: "1분 전" },
      { id: "c7", author: "해피", avatar: "https://i.pravatar.cc/100?img=7", content: "같이 놀아요~", time: "8분 전" },
      { id: "c8", author: "루나", avatar: "https://i.pravatar.cc/100?img=8", content: "재밌어요 ㅋㅋ", time: "15분 전" },
    ],
  };
  const v_3a63e7 = v_ed660d != null ? v_5b3987[v_ed660d] || [] : [];

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
        <Pressable style={v_d81136.commentOverlay} onPress={() => v_b07dd3(null)}>
          <View
            style={[v_d81136.commentSheet, { paddingBottom: 24 + Math.max(v_033e14.bottom, 0) }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={v_d81136.sheetHandle} />
            <View style={v_d81136.commentHeaderRow}>
              <Text style={v_d81136.commentTitle}>{v_8d41d7("feed.commentCount", { n: v_3a63e7.length })}</Text>
              <TouchableOpacity onPress={() => v_b07dd3(null)}>
                <Feather name="x" size={20} color={v_1bfbd0.white} />
              </TouchableOpacity>
            </View>
            <ScrollView style={v_d81136.commentScroll} showsVerticalScrollIndicator={false}>
              {v_3a63e7.length > 0 ? v_3a63e7.map((v_3f4e2e) => (
                <View key={v_3f4e2e.id} style={v_d81136.commentRow}>
                  <Image source={{ uri: v_3f4e2e.avatar }} style={v_d81136.commentAvatar} />
                  <View style={v_d81136.commentInfo}>
                    <View style={v_d81136.commentMeta}>
                      <Text style={v_d81136.commentAuthor}>{v_3f4e2e.author}</Text>
                      <Text style={v_d81136.commentTime}>{v_3f4e2e.time}</Text>
                    </View>
                    <Text style={v_d81136.commentContent}>{v_3f4e2e.content}</Text>
                  </View>
                </View>
              )) : (
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
              <TouchableOpacity disabled={!v_48e7fe.trim()} onPress={() => v_856f84("")}>
                <Feather name="send" size={18} color={v_48e7fe.trim() ? v_1bfbd0.white : "rgba(255,255,255,0.3)"} />
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
  commentSheet: { backgroundColor: "rgba(24,24,27,0.95)", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 24, height: "60%" },
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
});
