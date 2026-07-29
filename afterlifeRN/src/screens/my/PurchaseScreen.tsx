

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { Product, ProductSubscription } from "react-native-iap";
import SafeView from "../../components/ui/SafeView";
import PageHeader from "../../components/common/PageHeader";
import { COLORS, RADIUS, SIZES } from "../../components/constants";
import { useAuthStore } from "../../stores/authStore";
import { getCreditBalance, type CreditBalance } from "../../api/credits";
import {
  fetchAllProducts,
  buyConsumable,
  buySubscription,
  type SubscriptionSku,
  type ConsumableSku,
} from "../../lib/iap";

function fmtSecToMin(sec: number): string {
  const min = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${min}분 ${s}초` : `${min}분`;
}

const MOCK_PREFIX = "__mock__";
const MOCK_SUBS: ProductSubscription[] = [
  { id: "run.xrun.afterlife.sub.light", title: "xLight 30min", description: "월 30분 통화", displayPrice: "₩2,200", price: 2200, currency: "KRW", platform: "ios", type: "subs" } as unknown as ProductSubscription,
  { id: "run.xrun.afterlife.sub.basic.v3", title: "xBasic 100min", description: "월 100분 통화", displayPrice: "₩6,600", price: 6600, currency: "KRW", platform: "ios", type: "subs" } as unknown as ProductSubscription,
  { id: "run.xrun.afterlife.sub.standard", title: "xStandard 300min", description: "월 300분 통화", displayPrice: "₩19,900", price: 19900, currency: "KRW", platform: "ios", type: "subs" } as unknown as ProductSubscription,
  { id: "run.xrun.afterlife.sub.plus", title: "xPlus 600min", description: "월 600분 통화", displayPrice: "₩39,900", price: 39900, currency: "KRW", platform: "ios", type: "subs" } as unknown as ProductSubscription,
  { id: "run.xrun.afterlife.sub.premium", title: "xPremium 1000min", description: "월 1000분 통화", displayPrice: "₩69,900", price: 69900, currency: "KRW", platform: "ios", type: "subs" } as unknown as ProductSubscription,
].map((p) => ({ ...p, id: `${MOCK_PREFIX}${p.id}` }) as ProductSubscription);
const MOCK_CONSUMABLES: Product[] = [
  { id: "run.xrun.afterlife.credit.30", title: "Recharge 30min", description: "30분 충전 · 5년 유효", displayPrice: "₩2,200", price: 2200, currency: "KRW", platform: "ios", type: "in-app" } as unknown as Product,
  { id: "run.xrun.afterlife.credit.60", title: "Recharge 60min", description: "60분 충전 · 5년 유효", displayPrice: "₩4,400", price: 4400, currency: "KRW", platform: "ios", type: "in-app" } as unknown as Product,
  { id: "run.xrun.afterlife.credit.150", title: "Recharge 150min", description: "150분 충전 · 5년 유효", displayPrice: "₩9,900", price: 9900, currency: "KRW", platform: "ios", type: "in-app" } as unknown as Product,
  { id: "run.xrun.afterlife.credit.300", title: "Recharge 300min", description: "300분 충전 · 5년 유효", displayPrice: "₩19,900", price: 19900, currency: "KRW", platform: "ios", type: "in-app" } as unknown as Product,
].map((p) => ({ ...p, id: `${MOCK_PREFIX}${p.id}` }) as Product);
const isMockSku = (id: string): boolean => id.startsWith(MOCK_PREFIX);

export default function PurchaseScreen() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [balLoading, setBalLoading] = useState(true);
  const [subs, setSubs] = useState<ProductSubscription[]>([]);
  const [consumables, setConsumables] = useState<Product[]>([]);
  const [prodLoading, setProdLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!accessToken) return;
    setBalLoading(true);
    try {
      const b = await getCreditBalance(accessToken);
      setBalance(b);
    } catch (err) {
      console.warn("[purchase] balance fetch failed:", err);
    } finally {
      setBalLoading(false);
    }
  }, [accessToken]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const [mockMode, setMockMode] = useState(false);
  const refreshProducts = useCallback(async () => {
    setProdLoading(true);
    try {
      const { subscriptions, consumables: cons } = await fetchAllProducts();

      const useMocks = subscriptions.length === 0 && cons.length === 0;
      setMockMode(useMocks);
      setSubs(useMocks ? MOCK_SUBS : subscriptions);
      setConsumables(useMocks ? MOCK_CONSUMABLES : cons);
      console.log(
        `[purchase] loaded ${subscriptions.length} subs, ${cons.length} consumables${useMocks ? " (mock 삽입)" : ""}`,
      );
    } catch (err) {
      console.warn("[purchase] product fetch failed, falling back to mocks:", err);
      setMockMode(true);
      setSubs(MOCK_SUBS);
      setConsumables(MOCK_CONSUMABLES);
    } finally {
      setProdLoading(false);
    }
  }, []);
  useEffect(() => {
    void refreshProducts();
  }, [refreshProducts]);

  const handleBuySubscription = async (sku: string) => {
    if (buying) return;
    if (isMockSku(sku)) {
      Alert.alert("MOCK 상품", "유료 앱 계약 활성화 후 실제 결제 가능합니다.");
      return;
    }
    setBuying(sku);
    try {
      await buySubscription(sku as SubscriptionSku);

      setTimeout(() => refresh(), 2000);
    } catch (err) {
      const msg = (err as Error).message ?? "";
      if (!msg.includes("cancel")) {
        Alert.alert("결제 오류", msg);
      }
    } finally {
      setTimeout(() => setBuying(null), 3000);
    }
  };

  const handleBuyConsumable = async (sku: string) => {
    if (buying) return;
    if (isMockSku(sku)) {
      Alert.alert("MOCK 상품", "유료 앱 계약 활성화 후 실제 결제 가능합니다.");
      return;
    }
    setBuying(sku);
    try {
      await buyConsumable(sku as ConsumableSku);
      setTimeout(() => refresh(), 2000);
    } catch (err) {
      const msg = (err as Error).message ?? "";
      if (!msg.includes("cancel")) {
        Alert.alert("결제 오류", msg);
      }
    } finally {
      setTimeout(() => setBuying(null), 3000);
    }
  };

  return (
    <SafeView backgroundColor={COLORS.white}>
      <PageHeader title="크레딧 충전 · 구독" showBackButton />

      <ScrollView contentContainerStyle={{ padding: SIZES.large, paddingBottom: 40 }}>
        {}
        {mockMode && (
          <View style={s.mockBanner}>
            <Text style={s.mockBannerTitle}>⚠ MOCK 데이터 (임시)</Text>
            <Text style={s.mockBannerDesc}>
              유료 앱 계약 미체결로 실제 상품이 안 뜹니다. UI 확인용 임시 카드예요.{"\n"}
              탭해도 실제 결제 안 되고, 계약 활성화 후 자동 실상품 전환.
            </Text>
          </View>
        )}

        {}
        <View style={s.balanceCard}>
          <Text style={s.balanceTitle}>남은 통화 시간</Text>
          {balLoading ? (
            <ActivityIndicator color={COLORS.violet600} />
          ) : balance ? (
            <>
              <Text style={s.balanceTotal}>{fmtSecToMin(balance.totalSec)}</Text>
              <View style={s.balanceRow}>
                <View style={s.balanceCol}>
                  <Text style={s.balanceLabel}>무료</Text>
                  <Text style={s.balanceVal}>{fmtSecToMin(balance.freeSec)}</Text>
                </View>
                <View style={s.balanceCol}>
                  <Text style={s.balanceLabel}>구독</Text>
                  <Text style={s.balanceVal}>{fmtSecToMin(balance.subSec)}</Text>
                </View>
                <View style={s.balanceCol}>
                  <Text style={s.balanceLabel}>충전</Text>
                  <Text style={s.balanceVal}>{fmtSecToMin(balance.topupSec)}</Text>
                </View>
              </View>
              {balance.subscription && (
                <Text style={s.subInfo}>
                  {balance.subscription.planCode.toUpperCase()} 구독 활성 · 다음 갱신 {new Date(balance.subscription.periodEnd).toLocaleDateString("ko-KR")}
                </Text>
              )}
            </>
          ) : (
            <Text style={s.balanceLabel}>잔액 조회 실패</Text>
          )}
        </View>

        {}
        <Text style={s.sectionTitle}>월 구독</Text>
        <Text style={s.sectionDesc}>매월 자동 갱신. 언제든 해지 가능.</Text>

        {prodLoading ? (
          <ActivityIndicator color={COLORS.violet600} style={{ marginVertical: 20 }} />
        ) : subs.length === 0 ? (
          <View style={s.emptyBlock}>
            <Text style={s.emptyText}>구독 상품을 불러올 수 없어요.</Text>
            <Text style={s.emptyHint}>
              {Platform.OS === "ios"
                ? "설정 → App Store → Sandbox 계정 로그인 확인 후 다시 시도해주세요."
                : "잠시 후 다시 시도해주세요."}
            </Text>
            <TouchableOpacity
              style={s.retryBtn}
              onPress={refreshProducts}
              activeOpacity={0.85}
            >
              <Text style={s.retryBtnText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        ) : (
          subs.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[s.card, buying === p.id && s.cardDisabled]}
              onPress={() => handleBuySubscription(p.id)}
              disabled={buying !== null}
            >
              <View style={{ flex: 1 }}>
                <Text style={s.cardName}>{p.title || p.id}</Text>
                <Text style={s.cardDesc}>{p.description || ""}</Text>
              </View>
              <View style={s.cardPriceCol}>
                <Text style={s.cardPrice}>{p.displayPrice}</Text>
                {buying === p.id && (
                  <ActivityIndicator color={COLORS.violet600} size="small" />
                )}
              </View>
            </TouchableOpacity>
          ))
        )}

        {}
        <Text style={[s.sectionTitle, { marginTop: 32 }]}>충전 (일회성)</Text>
        <Text style={s.sectionDesc}>구독과 별개로 통화 시간을 추가할 수 있어요. 5년 유효.</Text>

        {prodLoading ? (
          <ActivityIndicator color={COLORS.violet600} style={{ marginVertical: 20 }} />
        ) : consumables.length === 0 ? (
          <View style={s.emptyBlock}>
            <Text style={s.emptyText}>충전 상품을 불러올 수 없어요.</Text>
            <TouchableOpacity
              style={s.retryBtn}
              onPress={refreshProducts}
              activeOpacity={0.85}
            >
              <Text style={s.retryBtnText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        ) : (
          consumables.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[s.card, buying === p.id && s.cardDisabled]}
              onPress={() => handleBuyConsumable(p.id)}
              disabled={buying !== null}
            >
              <View style={{ flex: 1 }}>
                <Text style={s.cardName}>{p.title || p.id}</Text>
                <Text style={s.cardDesc}>{p.description || ""}</Text>
              </View>
              <View style={s.cardPriceCol}>
                <Text style={s.cardPrice}>{p.displayPrice}</Text>
                {buying === p.id && (
                  <ActivityIndicator color={COLORS.violet600} size="small" />
                )}
              </View>
            </TouchableOpacity>
          ))
        )}

        {Platform.OS === "android" && (
          <Text style={[s.emptyText, { marginTop: 20 }]}>
            Android 결제는 준비 중이에요. iOS 로 먼저 이용해주세요.
          </Text>
        )}

        {}
        <View style={{ marginTop: 32, alignItems: "center" }}>
          <Text style={s.footer}>
            자동 갱신 구독은 해지 전까지 매 주기 결제됩니다.{"\n"}
            해지: 설정 → Apple ID → 구독 → afterlife
          </Text>
        </View>
      </ScrollView>
    </SafeView>
  );
}

const s = StyleSheet.create({
  balanceCard: {
    backgroundColor: COLORS.violet100,
    borderRadius: RADIUS.large,
    padding: 20,
    marginBottom: 24,
  },
  balanceTitle: { fontSize: 13, color: COLORS.zinc600, marginBottom: 6 },
  balanceTotal: { fontSize: 28, fontWeight: "700", color: COLORS.violet700, marginBottom: 12 },
  balanceRow: { flexDirection: "row", gap: 12 },
  balanceCol: { flex: 1 },
  balanceLabel: { fontSize: 11, color: COLORS.zinc500 },
  balanceVal: { fontSize: 14, fontWeight: "600", color: COLORS.zinc900 },
  subInfo: { fontSize: 12, color: COLORS.zinc700, marginTop: 12 },

  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.zinc900, marginBottom: 4 },
  sectionDesc: { fontSize: 12, color: COLORS.zinc500, marginBottom: 12 },

  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    marginBottom: 8,
    backgroundColor: COLORS.white,
  },
  cardDisabled: { opacity: 0.5 },
  cardName: { fontSize: 15, fontWeight: "600", color: COLORS.zinc900 },
  cardDesc: { fontSize: 12, color: COLORS.zinc500, marginTop: 2 },
  cardPriceCol: { alignItems: "flex-end", gap: 4 },
  cardPrice: { fontSize: 15, fontWeight: "700", color: COLORS.violet600 },

  emptyText: { fontSize: 13, color: COLORS.zinc500, textAlign: "center", marginVertical: 8 },
  emptyBlock: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    borderStyle: "dashed",
    borderRadius: RADIUS.medium,
  },
  emptyHint: { fontSize: 12, color: COLORS.zinc400, textAlign: "center", marginBottom: 12, lineHeight: 18 },
  retryBtn: {
    backgroundColor: COLORS.violet600,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    marginTop: 4,
  },
  retryBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },

  mockBanner: {
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#f59e0b",
    borderRadius: RADIUS.medium,
    padding: 12,
    marginBottom: 16,
  },
  mockBannerTitle: { fontSize: 13, fontWeight: "700", color: "#b45309", marginBottom: 4 },
  mockBannerDesc: { fontSize: 11, color: "#92400e", lineHeight: 16 },
  footer: { fontSize: 11, color: COLORS.zinc500, textAlign: "center", lineHeight: 18 },
});
