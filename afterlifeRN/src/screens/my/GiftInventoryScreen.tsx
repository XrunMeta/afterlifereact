

import v_a3453e, { v_de06a3, v_c4deb2, v_df9f57, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_9cabcb,
  v_4623af,
  v_cf9c33,
  v_39a996,
  v_6c4f62,
} from "rcmrninabrnb";
import { v_889fad } from "../../stores/dialogStore";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_83b207, v_422d96, type v_ccbfb2 } from "../../api/giftInventory";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../../components/constants";

export default function v_d19886() {
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const [v_4622b9, v_fa923c] = v_5ab095<v_ccbfb2[]>([]);
  const [v_683210, v_34a50a] = v_5ab095(true);
  const [v_612e9f, v_575aad] = v_5ab095(false);
  const [v_8af97b, v_d1a0d8] = v_5ab095<string | null>(null); 

  const v_f6f5de = v_de06a3(async () => {
    if (!v_2ca7e0) return;
    try {
      const v_8f00b9 = await v_83b207(v_2ca7e0);
      v_fa923c(v_8f00b9.items);
    } catch (v_49263d) {
      console.warn("[GiftInventory] load failed:", v_49263d);
      v_889fad("선물함 불러오기 실패", (v_49263d as Error).message ?? "잠시 후 다시 시도해주세요.");
    } finally {
      v_34a50a(false);
      v_575aad(false);
    }
  }, [v_2ca7e0]);

  v_c4deb2(() => {
    void v_f6f5de();
  }, [v_f6f5de]);

  const v_d5345f = v_de06a3(() => {
    v_575aad(true);
    void v_f6f5de();
  }, [v_f6f5de]);

  const v_999cc9 = v_de06a3(
    (item: v_ccbfb2) => {
      v_889fad(
        "교환 확인",
        `${v_8c0b26.name} ${v_8c0b26.count}개를 ${v_8c0b26.xrunTotal.toLocaleString()} XRUN 으로 교환할까요?`,
        [
          { text: "취소", style: "cancel" },
          {
            text: "교환",
            style: "default",
            onPress: async () => {
              if (!v_2ca7e0) return;
              v_d1a0d8(v_8c0b26.giftId);
              try {
                const v_4fab5a = `swap-${v_8c0b26.giftId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                const v_8f00b9 = await v_422d96(
                  v_2ca7e0,
                  { giftId: v_8c0b26.giftId, count: v_8c0b26.count },
                  v_4fab5a,
                );
                v_889fad(
                  "교환 완료 🎉",
                  `${v_8f00b9.xrunCredited.toLocaleString()} XRUN 이 지갑에 충전됐어요.`,
                );
                await v_f6f5de();
              } catch (v_49263d) {
                v_889fad("교환 실패", (v_49263d as Error).message ?? "잠시 후 다시 시도해주세요.");
              } finally {
                v_d1a0d8(null);
              }
            },
          },
        ],
      );
    },
    [v_2ca7e0, v_f6f5de],
  );

  const v_1faf1d = v_df9f57(
    () => v_4622b9.reduce((v_dce0a8, v_23805a) => v_dce0a8 + v_23805a.xrunTotal, 0),
    [v_4622b9],
  );

  const v_fcf6ec = ({ item: v_8c0b26 }: { item: v_ccbfb2 }) => {
    const v_3f8465 = v_8af97b === v_8c0b26.giftId;
    return (
      <View style={v_fd5f43.card}>
        {v_8c0b26.imageUrl ? (
          <Image source={{ uri: v_8c0b26.imageUrl }} style={v_fd5f43.img} />
        ) : (
          <View style={[v_fd5f43.img, v_fd5f43.emojiWrap]}>
            <Text style={v_fd5f43.emoji}>{v_8c0b26.emoji}</Text>
          </View>
        )}
        <View style={v_fd5f43.info}>
          <Text style={v_fd5f43.name} numberOfLines={1}>{v_8c0b26.name}</Text>
          <Text style={v_fd5f43.count}>
            {v_8c0b26.count}개 · 개당 {v_8c0b26.xrunPerItem.toLocaleString()} XRUN
          </Text>
          <Text style={v_fd5f43.total}>
            = {v_8c0b26.xrunTotal.toLocaleString()} XRUN
          </Text>
        </View>
        <TouchableOpacity
          style={[v_fd5f43.swapBtn, v_3f8465 && v_fd5f43.swapBtnBusy]}
          onPress={() => v_999cc9(v_8c0b26)}
          disabled={v_3f8465}
        >
          {v_3f8465 ? (
            <ActivityIndicator size="small" color={v_1bfbd0.white} />
          ) : (
            <Text style={v_fd5f43.swapBtnText}>교환</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeScrollView backgroundColor={v_1bfbd0.white} showBottomBackground={false}>
      <PageHeader title="선물 지갑" showBackButton />
      <View style={v_fd5f43.summary}>
        <Text style={v_fd5f43.summaryLabel}>총 교환 가능</Text>
        <Text style={v_fd5f43.summaryValue}>{v_1faf1d.toLocaleString()} XRUN</Text>
        <Text style={v_fd5f43.summaryDesc}>받은 선물을 XRUN 크레딧으로 교환해 통화·선물에 사용하세요.</Text>
      </View>
      {v_683210 ? (
        <View style={v_fd5f43.centerBox}>
          <ActivityIndicator />
        </View>
      ) : v_4622b9.length === 0 ? (
        <View style={v_fd5f43.centerBox}>
          <Text style={v_fd5f43.emptyText}>받은 선물이 없어요.</Text>
        </View>
      ) : (
        <FlatList
          data={v_4622b9}
          keyExtractor={(v_23805a) => v_23805a.giftId}
          renderItem={v_fcf6ec}
          contentContainerStyle={v_fd5f43.listContent}
          refreshControl={<RefreshControl refreshing={v_612e9f} onRefresh={v_d5345f} />}
          scrollEnabled={false}
        />
      )}
    </SafeScrollView>
  );
}

const v_fd5f43 = v_472849.create({
  summary: {
    padding: v_9b1a04.large,
    backgroundColor: "#FFF7ED",
    borderRadius: v_8b0c90.md,
    margin: v_9b1a04.medium,
    alignItems: "center",
  },
  summaryLabel: { fontSize: 12, color: "#78716C", fontWeight: "600" },
  summaryValue: { fontSize: 28, color: "#F59E0B", fontWeight: "700", marginTop: 4 },
  summaryDesc: { fontSize: 11, color: "#78716C", marginTop: 8, textAlign: "center" },
  centerBox: { padding: 40, alignItems: "center" },
  emptyText: { color: "#9CA3AF", fontSize: 14 },
  listContent: { paddingHorizontal: v_9b1a04.medium, paddingBottom: 40 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: v_9b1a04.medium,
    borderRadius: v_8b0c90.md,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: v_9b1a04.small,
    backgroundColor: v_1bfbd0.white,
  },
  img: { width: 48, height: 48, borderRadius: 8 },
  emojiWrap: { backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 28 },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 14, color: v_1bfbd0.black, fontWeight: "600" },
  count: { fontSize: 11, color: "#78716C", marginTop: 2 },
  total: { fontSize: 12, color: "#F59E0B", fontWeight: "700", marginTop: 4 },
  swapBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#F59E0B",
    borderRadius: 8,
    minWidth: 60,
    alignItems: "center",
  },
  swapBtnBusy: { opacity: 0.6 },
  swapBtnText: { color: v_1bfbd0.white, fontWeight: "700", fontSize: 13 },
});
