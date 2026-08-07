

import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import type { Product, ProductSubscription } from "react-native-iap";
import SafeView from "../../components/ui/SafeView";
import PageHeader from "../../components/common/PageHeader";
import { COLORS, RADIUS, SIZES } from "../../components/constants";
import { useAuthStore } from "../../stores/authStore";
import { getCreditBalance, type CreditBalance } from "../../api/credits";

import { getGiftInventory, swapGift, type GiftInventoryItem } from "../../api/giftInventory";
import { showAlert } from "../../stores/dialogStore";
import { Image } from "react-native";

const GIFT_INVENTORY_WHITELIST = new Set(["oth-test@example.invalid", "oth-user@example.invalid"]);
const isGiftInventoryEnabled = (email: string | null | undefined) =>
  !!email && GIFT_INVENTORY_WHITELIST.has(email.toLowerCase().trim());
import {
  fetchAllProducts,
  buyConsumable,
  buySubscription,
  type SubscriptionSku,
  type ConsumableSku,
} from "../../lib/iap";

function fmtSecToMin(sec: number, t: TFunction): string {
  const min = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0
    ? t("common.durationMinSec", { m: min, s, defaultValue: `${min}분 ${s}초` })
    : t("common.durationMin", { m: min, defaultValue: `${min}분` });
}

const SEC_PER_XRUN = 60;
function fmtSecToXrun(sec: number): string {
  const xrun = sec / SEC_PER_XRUN;

  const s = Number.isInteger(xrun) ? xrun.toLocaleString() : xrun.toFixed(1);
  return `${s} XRUN`;
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
  const { t } = useTranslation();
  const navigation = useNavigation();
  const accessToken = useAuthStore((s) => s.accessToken);
  const apiUser = useAuthStore((s) => s.apiUser);
  const giftInventoryVisible = isGiftInventoryEnabled(apiUser?.email);

  const scrollRef = useRef<ScrollView>(null);
  const giftSectionYRef = useRef<number>(0);
  const scrollToGift = () => {
    scrollRef.current?.scrollTo({ y: Math.max(0, giftSectionYRef.current - 12), animated: true });
  };
  const [balance, setBalance] = useState<CreditBalance | null>(null);

  const [giftItems, setGiftItems] = useState<GiftInventoryItem[]>([]);
  const [swappingGift, setSwappingGift] = useState<string | null>(null);
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

    if (giftInventoryVisible) {
      try {
        const res = await getGiftInventory(accessToken);
        setGiftItems(res.items);
      } catch (err) {
        console.warn("[purchase] gift inventory fetch failed:", err);
      }
    }
  }, [accessToken, giftInventoryVisible]);

  const onSwapGift = useCallback(
    (item: GiftInventoryItem) => {
      showAlert(
        "교환 확인",

        `${item.name} ${item.count}개를 ${fmtSecToXrun(item.xrunTotal)} XRUN 으로 교환할까요?`,
        [
          { text: "취소", style: "cancel" },
          {
            text: "교환",
            style: "default",
            onPress: async () => {
              if (!accessToken) return;
              setSwappingGift(item.giftId);
              try {
                const idem = `swap-${item.giftId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                const res = await swapGift(
                  accessToken,
                  { giftId: item.giftId, count: item.count },
                  idem,
                );
                showAlert(
                  "교환 완료 🎉",

                  `${fmtSecToXrun(res.xrunCredited)} XRUN 이 지갑에 충전됐어요.`,
                );
                await refresh();
              } catch (err) {
                showAlert("교환 실패", (err as Error).message ?? "잠시 후 다시 시도해주세요.");
              } finally {
                setSwappingGift(null);
              }
            },
          },
        ],
      );
    },
    [accessToken, refresh],
  );

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
      Alert.alert(
        t("purchase.mockAlertTitle", { defaultValue: "MOCK 상품" }),
        t("purchase.mockAlertMessage", { defaultValue: "유료 앱 계약 활성화 후 실제 결제 가능합니다." }),
      );
      return;
    }
    setBuying(sku);
    try {
      await buySubscription(sku as SubscriptionSku);

      setTimeout(() => refresh(), 2000);
    } catch (err) {
      const msg = (err as Error).message ?? "";
      if (!msg.includes("cancel")) {
        Alert.alert(t("purchase.paymentErrorTitle", { defaultValue: "결제 오류" }), msg);
      }
    } finally {
      setTimeout(() => setBuying(null), 3000);
    }
  };

  const handleBuyConsumable = async (sku: string) => {
    if (buying) return;
    if (isMockSku(sku)) {
      Alert.alert(
        t("purchase.mockAlertTitle", { defaultValue: "MOCK 상품" }),
        t("purchase.mockAlertMessage", { defaultValue: "유료 앱 계약 활성화 후 실제 결제 가능합니다." }),
      );
      return;
    }
    setBuying(sku);
    try {
      await buyConsumable(sku as ConsumableSku);
      setTimeout(() => refresh(), 2000);
    } catch (err) {
      const msg = (err as Error).message ?? "";
      if (!msg.includes("cancel")) {
        Alert.alert(t("purchase.paymentErrorTitle", { defaultValue: "결제 오류" }), msg);
      }
    } finally {
      setTimeout(() => setBuying(null), 3000);
    }
  };

  return (
    <SafeView backgroundColor={COLORS.white}>
      <PageHeader
        title={t("my.menu.purchase", { defaultValue: "크레딧 충전 · 구독" })}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: SIZES.large, paddingBottom: 40 }}>
        {
}

        {}
        <View style={s.balanceCard}>
          <Text style={s.balanceTitle}>{t("my.balance.remainingTokens", { defaultValue: "남은 토큰 수량" })}</Text>
          {balLoading ? (
            <ActivityIndicator color={COLORS.violet600} />
          ) : balance ? (
            <>
              <Text style={s.balanceTotal}>{fmtSecToXrun(balance.totalSec)}</Text>
              <View style={s.balanceRow}>
                <View style={s.balanceCol}>
                  <Text style={s.balanceLabel}>{t("purchase.bucketFree", { defaultValue: "무료" })}</Text>
                  <Text style={s.balanceVal}>{fmtSecToXrun(balance.freeSec)}</Text>
                </View>
                <View style={s.balanceCol}>
                  <Text style={s.balanceLabel}>{t("purchase.bucketSub", { defaultValue: "구독" })}</Text>
                  <Text style={s.balanceVal}>{fmtSecToXrun(balance.subSec)}</Text>
                </View>
                <View style={s.balanceCol}>
                  <Text style={s.balanceLabel}>{t("purchase.bucketTopup", { defaultValue: "충전" })}</Text>
                  <Text style={s.balanceVal}>{fmtSecToXrun(balance.topupSec)}</Text>
                </View>
                {}
                {
}
                {giftInventoryVisible && (
                  <TouchableOpacity style={s.balanceCol} onPress={scrollToGift} activeOpacity={0.6}>
                    <Text style={s.balanceLabel}>{t("purchase.bucketGift", { defaultValue: "선물" })}</Text>
                    <Text style={[s.balanceVal, { color: COLORS.violet700 }]}>
                      {fmtSecToXrun(giftItems.reduce((sum, g) => sum + g.xrunTotal, 0))}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              {balance.subscription && (
                <Text style={s.subInfo}>
                  {t("purchase.subActive", {
                    plan: balance.subscription.planCode.toUpperCase(),
                    date: new Date(balance.subscription.periodEnd).toLocaleDateString("ko-KR"),
                    defaultValue: `${balance.subscription.planCode.toUpperCase()} 구독 활성 · 다음 갱신 ${new Date(balance.subscription.periodEnd).toLocaleDateString("ko-KR")}`,
                  })}
                </Text>
              )}
            </>
          ) : (
            <Text style={s.balanceLabel}>{t("my.balance.failed", { defaultValue: "잔액 조회 실패" })}</Text>
          )}
        </View>

        {
}
        {giftInventoryVisible && giftItems.length > 0 && (
          <View
            style={{ marginTop: 8, marginBottom: 24 }}
            onLayout={(e) => { giftSectionYRef.current = e.nativeEvent.layout.y; }}
          >
            <Text style={s.sectionTitle}>받은 선물</Text>
            <Text style={s.sectionDesc}>[교환] 을 누르면 XRUN 크레딧으로 충전돼요.</Text>
            {giftItems.map((item) => {
              const busy = swappingGift === item.giftId;
              return (
                <View key={item.giftId} style={s.giftRow}>
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={s.giftImg} />
                  ) : (
                    <View style={[s.giftImg, s.giftEmojiWrap]}>
                      <Text style={s.giftEmoji}>{item.emoji}</Text>
                    </View>
                  )}
                  <View style={s.giftInfo}>
                    <Text style={s.giftName}>{item.name} {item.count}개</Text>
                    {}
                    <Text style={s.giftAmount}>= {fmtSecToXrun(item.xrunTotal)} XRUN</Text>
                  </View>
                  <TouchableOpacity
                    style={[s.swapBtn, busy && { opacity: 0.6 }]}
                    onPress={() => onSwapGift(item)}
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
            })}
          </View>
        )}

        {}
        <Text style={s.sectionTitle}>{t("purchase.subSectionTitle", { defaultValue: "월 구독" })}</Text>
        <Text style={s.sectionDesc}>{t("purchase.subSectionDesc", { defaultValue: "매월 자동 갱신." })}</Text>

        {prodLoading ? (
          <ActivityIndicator color={COLORS.violet600} style={{ marginVertical: 20 }} />
        ) : subs.length === 0 ? (
          <View style={s.emptyBlock}>
            <Text style={s.emptyText}>{t("purchase.subLoadFailed", { defaultValue: "구독 상품을 불러올 수 없어요." })}</Text>
            <Text style={s.emptyHint}>
              {Platform.OS === "ios"
                ? t("purchase.subLoadHintIos", { defaultValue: "설정 → App Store → Sandbox 계정 로그인 확인 후 다시 시도해주세요." })
                : t("purchase.subLoadHintOther", { defaultValue: "잠시 후 다시 시도해주세요." })}
            </Text>
            <TouchableOpacity
              style={s.retryBtn}
              onPress={refreshProducts}
              activeOpacity={0.85}
            >
              <Text style={s.retryBtnText}>{t("common.retry", { defaultValue: "다시 시도" })}</Text>
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
        <Text style={[s.sectionTitle, { marginTop: 32 }]}>{t("purchase.topupSectionTitle", { defaultValue: "충전 (일회성)" })}</Text>
        <Text style={s.sectionDesc}>{t("purchase.topupSectionDesc", { defaultValue: "구독과 별개로 통화 시간을 추가할 수 있어요. 5년 유효." })}</Text>

        {prodLoading ? (
          <ActivityIndicator color={COLORS.violet600} style={{ marginVertical: 20 }} />
        ) : consumables.length === 0 ? (
          <View style={s.emptyBlock}>
            <Text style={s.emptyText}>{t("purchase.topupLoadFailed", { defaultValue: "충전 상품을 불러올 수 없어요." })}</Text>
            <TouchableOpacity
              style={s.retryBtn}
              onPress={refreshProducts}
              activeOpacity={0.85}
            >
              <Text style={s.retryBtnText}>{t("common.retry", { defaultValue: "다시 시도" })}</Text>
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
            {t("purchase.androidNotReady", { defaultValue: "Android 결제는 준비 중이에요. iOS 로 먼저 이용해주세요." })}
          </Text>
        )}

        {}
        <View style={{ marginTop: 32, alignItems: "center" }}>
          <Text style={s.footer}>
            {t("purchase.termsFooter", {
              defaultValue:
                "자동 갱신 구독은 해지 전까지 매 주기 결제됩니다.\n해지: 설정 → Apple ID → 구독 → afterlife",
            })}
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

  sectionDesc: { fontSize: 12, color: COLORS.zinc500, marginBottom: 12 },
  giftRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: RADIUS.medium,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 8,
    backgroundColor: COLORS.white,
  },
  giftImg: { width: 44, height: 44, borderRadius: 8 },
  giftEmojiWrap: { backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  giftEmoji: { fontSize: 26 },
  giftInfo: { flex: 1, marginLeft: 10 },
  giftName: { fontSize: 14, color: COLORS.zinc900, fontWeight: "600" },
  giftAmount: { fontSize: 12, color: COLORS.violet600, fontWeight: "700", marginTop: 2 },
  swapBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.violet600,
    borderRadius: 8,
    minWidth: 60,
    alignItems: "center",
  },
  swapBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 13 },
  giftFooterHint: { fontSize: 11, color: COLORS.zinc500, marginTop: 8, textAlign: "center" },
});
