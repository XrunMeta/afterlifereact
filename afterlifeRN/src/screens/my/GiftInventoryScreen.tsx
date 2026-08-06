

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { showAlert } from "../../stores/dialogStore";
import SafeScrollView from "../../components/ui/SafeScrollView";
import PageHeader from "../../components/common/PageHeader";
import { useAuthStore } from "../../stores/authStore";
import { getGiftInventory, swapGift, type GiftInventoryItem } from "../../api/giftInventory";
import { COLORS, SIZES, RADIUS } from "../../components/constants";

export default function GiftInventoryScreen() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [items, setItems] = useState<GiftInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [swapping, setSwapping] = useState<string | null>(null); 

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await getGiftInventory(accessToken);
      setItems(res.items);
    } catch (err) {
      console.warn("[GiftInventory] load failed:", err);
      showAlert("선물함 불러오기 실패", (err as Error).message ?? "잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  const onSwap = useCallback(
    (item: GiftInventoryItem) => {
      showAlert(
        "교환 확인",
        `${item.name} ${item.count}개를 ${item.xrunTotal.toLocaleString()} XRUN 으로 교환할까요?`,
        [
          { text: "취소", style: "cancel" },
          {
            text: "교환",
            style: "default",
            onPress: async () => {
              if (!accessToken) return;
              setSwapping(item.giftId);
              try {
                const idem = `swap-${item.giftId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                const res = await swapGift(
                  accessToken,
                  { giftId: item.giftId, count: item.count },
                  idem,
                );
                showAlert(
                  "교환 완료 🎉",
                  `${res.xrunCredited.toLocaleString()} XRUN 이 지갑에 충전됐어요.`,
                );
                await load();
              } catch (err) {
                showAlert("교환 실패", (err as Error).message ?? "잠시 후 다시 시도해주세요.");
              } finally {
                setSwapping(null);
              }
            },
          },
        ],
      );
    },
    [accessToken, load],
  );

  const totalPending = useMemo(
    () => items.reduce((sum, it) => sum + it.xrunTotal, 0),
    [items],
  );

  const renderItem = ({ item }: { item: GiftInventoryItem }) => {
    const busy = swapping === item.giftId;
    return (
      <View style={s.card}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={s.img} />
        ) : (
          <View style={[s.img, s.emojiWrap]}>
            <Text style={s.emoji}>{item.emoji}</Text>
          </View>
        )}
        <View style={s.info}>
          <Text style={s.name} numberOfLines={1}>{item.name}</Text>
          <Text style={s.count}>
            {item.count}개 · 개당 {item.xrunPerItem.toLocaleString()} XRUN
          </Text>
          <Text style={s.total}>
            = {item.xrunTotal.toLocaleString()} XRUN
          </Text>
        </View>
        <TouchableOpacity
          style={[s.swapBtn, busy && s.swapBtnBusy]}
          onPress={() => onSwap(item)}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={s.swapBtnText}>교환</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeScrollView backgroundColor={COLORS.white} showBottomBackground={false}>
      <PageHeader title="선물 지갑" showBackButton />
      <View style={s.summary}>
        <Text style={s.summaryLabel}>총 교환 가능</Text>
        <Text style={s.summaryValue}>{totalPending.toLocaleString()} XRUN</Text>
        <Text style={s.summaryDesc}>받은 선물을 XRUN 크레딧으로 교환해 통화·선물에 사용하세요.</Text>
      </View>
      {loading ? (
        <View style={s.centerBox}>
          <ActivityIndicator />
        </View>
      ) : items.length === 0 ? (
        <View style={s.centerBox}>
          <Text style={s.emptyText}>받은 선물이 없어요.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.giftId}
          renderItem={renderItem}
          contentContainerStyle={s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          scrollEnabled={false}
        />
      )}
    </SafeScrollView>
  );
}

const s = StyleSheet.create({
  summary: {
    padding: SIZES.large,
    backgroundColor: "#FFF7ED",
    borderRadius: RADIUS.md,
    margin: SIZES.medium,
    alignItems: "center",
  },
  summaryLabel: { fontSize: 12, color: "#78716C", fontWeight: "600" },
  summaryValue: { fontSize: 28, color: "#F59E0B", fontWeight: "700", marginTop: 4 },
  summaryDesc: { fontSize: 11, color: "#78716C", marginTop: 8, textAlign: "center" },
  centerBox: { padding: 40, alignItems: "center" },
  emptyText: { color: "#9CA3AF", fontSize: 14 },
  listContent: { paddingHorizontal: SIZES.medium, paddingBottom: 40 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: SIZES.medium,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: SIZES.small,
    backgroundColor: COLORS.white,
  },
  img: { width: 48, height: 48, borderRadius: 8 },
  emojiWrap: { backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 28 },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 14, color: COLORS.black, fontWeight: "600" },
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
  swapBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 13 },
});
