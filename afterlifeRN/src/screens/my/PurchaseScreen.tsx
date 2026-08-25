

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

function fmtSecToMinShort(sec: number): string {
  const min = Math.floor(sec / 60);
  const s = sec % 60;
  if (s > 0 && min < 10) return `${min}분 ${s}초`;
  return `${min}분`;
}

const MOCK_PREFIX = "__mock__";

const FREE_SKU = "__free__";

const MOCK_SUBS: ProductSubscription[] = [
  { id: "run.xrun.afterlife.sub.run", title: "RUN", description: "광고없이 이용", displayPrice: "₩13,000", price: 13000, currency: "KRW", platform: "ios", type: "subs" } as unknown as ProductSubscription,
  { id: "run.xrun.afterlife.sub.monster", title: "Monster", description: "광고없이 이용", displayPrice: "₩65,000", price: 65000, currency: "KRW", platform: "ios", type: "subs" } as unknown as ProductSubscription,
].map((p) => ({ ...p, id: `${MOCK_PREFIX}${p.id}` }) as ProductSubscription);

const FREE_SUB: ProductSubscription = {
  id: FREE_SKU,
  title: "Go (Free)",
  description: "회원가입 시 자동 부여",
  displayPrice: "무료",
  price: 0,
  currency: "KRW",
  platform: "ios",
  type: "subs",
} as unknown as ProductSubscription;
const MOCK_CONSUMABLES: Product[] = [
  { id: "run.xrun.afterlife.credit.30", title: "Recharge 30min", description: "30분 충전 · 5년 유효", displayPrice: "₩2,200", price: 2200, currency: "KRW", platform: "ios", type: "in-app" } as unknown as Product,
  { id: "run.xrun.afterlife.credit.60", title: "Recharge 60min", description: "60분 충전 · 5년 유효", displayPrice: "₩4,400", price: 4400, currency: "KRW", platform: "ios", type: "in-app" } as unknown as Product,
  { id: "run.xrun.afterlife.credit.150", title: "Recharge 150min", description: "150분 충전 · 5년 유효", displayPrice: "₩9,900", price: 9900, currency: "KRW", platform: "ios", type: "in-app" } as unknown as Product,
  { id: "run.xrun.afterlife.credit.300", title: "Recharge 300min", description: "300분 충전 · 5년 유효", displayPrice: "₩19,900", price: 19900, currency: "KRW", platform: "ios", type: "in-app" } as unknown as Product,
].map((p) => ({ ...p, id: `${MOCK_PREFIX}${p.id}` }) as Product);

const MOCK_GIFT_PACKS: Product[] = [
  { id: "run.xrun.afterlife.gift.pack.1", title: "꽃 1개", description: "선물하기 1회 사용", displayPrice: "₩3,000", price: 3000, currency: "KRW", platform: "ios", type: "in-app" } as unknown as Product,
  { id: "run.xrun.afterlife.gift.pack.5", title: "꽃 5개", description: "선물하기 5회 사용", displayPrice: "₩14,000", price: 14000, currency: "KRW", platform: "ios", type: "in-app" } as unknown as Product,
  { id: "run.xrun.afterlife.gift.pack.10", title: "꽃 10개", description: "선물하기 10회 사용", displayPrice: "₩27,000", price: 27000, currency: "KRW", platform: "ios", type: "in-app" } as unknown as Product,
].map((p) => ({ ...p, id: `${MOCK_PREFIX}${p.id}` }) as Product);
const isMockSku = (id: string): boolean => id.startsWith(MOCK_PREFIX);
const isFreeSku = (id: string): boolean => id === FREE_SKU;
const isGiftPackSku = (id: string): boolean => stripMock(id).startsWith("run.xrun.afterlife.gift.pack.");

const PLAN_BENEFITS: Record<string, { tagline: string; benefits: string[]; recommended?: boolean }> = {
  [FREE_SKU]: {
    tagline: "회원가입 시 자동 제공",
    benefits: [
      "광고 시청 후 서비스 이용",
      "서비스 중간 광고 삽입",
      "클론 1개 생성",
      "클론 삭제/생성 5회 제공",
      "월 50분 통화 제공",
    ],
  },
  "run.xrun.afterlife.sub.run": {
    tagline: "광고 없이 이용",
    benefits: [
      "클론 2개 생성",
      "클론 삭제/생성 10회 제공",
      "월 120분 통화 제공",
      "꽃 2개 제공 (선물하기용)",
    ],
    recommended: true,
  },
  "run.xrun.afterlife.sub.monster": {
    tagline: "광고 없이 이용",
    benefits: [
      "클론 무제한 생성",
      "클론 삭제/생성 무제한",
      "월 1000분 통화 제공",
      "꽃 10개 제공 (선물하기용)",
    ],
  },
};
function stripMock(id: string): string {
  return id.startsWith(MOCK_PREFIX) ? id.slice(MOCK_PREFIX.length) : id;
}

function isCurrentPlanSku(sku: string, planCode: string | null | undefined): boolean {
  if (!planCode) return sku === FREE_SKU;
  const clean = stripMock(sku);

  const afterSub = clean.split(".sub.")[1] ?? "";
  return afterSub.toLowerCase() === planCode.toLowerCase();
}
function getPlanMeta(id: string): { tagline: string; benefits: string[]; recommended?: boolean } {
  return PLAN_BENEFITS[stripMock(id)] ?? { tagline: "", benefits: [] };
}

export default function PurchaseScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const accessToken = useAuthStore((s) => s.accessToken);

  const giftInventoryVisible = true;

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

        `${item.name} ${item.count}개를 ${fmtSecToMinShort(item.xrunTotal)}으로 교환할까요?`,
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

                  `${fmtSecToMinShort(res.xrunCredited)}이 지갑에 충전됐어요.`,
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

    if (isFreeSku(sku)) return;
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
          <Text style={s.balanceTitle}>{t("my.balance.remainingTokens", { defaultValue: "남은 통화 시간" })}</Text>
          {balLoading ? (
            <ActivityIndicator color={COLORS.violet600} />
          ) : balance ? (
            <>
              <Text style={s.balanceTotal}>{fmtSecToMinShort(balance.totalSec)}</Text>
              <View style={s.balanceRow}>
                <View style={s.balanceCol}>
                  <Text style={s.balanceLabel}>{t("purchase.bucketFree", { defaultValue: "무료" })}</Text>
                  <Text style={s.balanceVal}>{fmtSecToMinShort(balance.freeSec)}</Text>
                </View>
                <View style={s.balanceCol}>
                  <Text style={s.balanceLabel}>{t("purchase.bucketSub", { defaultValue: "구독" })}</Text>
                  <Text style={s.balanceVal}>{fmtSecToMinShort(balance.subSec)}</Text>
                </View>
                <View style={s.balanceCol}>
                  <Text style={s.balanceLabel}>{t("purchase.bucketTopup", { defaultValue: "충전" })}</Text>
                  <Text style={s.balanceVal}>{fmtSecToMinShort(balance.topupSec)}</Text>
                </View>
                {
}
                {giftInventoryVisible && (
                  <TouchableOpacity style={s.balanceCol} onPress={scrollToGift} activeOpacity={0.6}>
                    <Text style={s.balanceLabel}>{t("purchase.bucketGift", { defaultValue: "선물" })}</Text>
                    <Text style={s.balanceVal}>
                      {giftItems.reduce((sum, g) => sum + g.count, 0)}개
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
            <Text style={s.sectionDesc}>[교환] 을 누르면 통화 시간으로 충전돼요.</Text>
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
                    <Text style={s.giftAmount}>= {fmtSecToMinShort(item.xrunTotal)} XRUN</Text>
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
                ? t("purchase.subLoadHintIos", { defaultValue: "설정 → App Store 계정 로그인 확인 후 다시 시도해주세요." })
                : t("purchase.subLoadHintAndroid", { defaultValue: "Play 스토어 계정 로그인 확인 후 다시 시도해주세요." })}
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

          [FREE_SUB, ...subs].map((p) => {
            const meta = getPlanMeta(p.id);
            const isBuying = buying === p.id;
            const isFree = isFreeSku(p.id);

            const isCurrent = isCurrentPlanSku(p.id, balance?.subscription?.planCode ?? null);
            return (
              <View key={p.id} style={[s.planCard, (meta.recommended || isCurrent) && s.planCardRecommended]}>
                {(isCurrent || meta.recommended) && (
                  <View style={s.badgeRow}>
                    {isCurrent && (
                      <View style={[s.recommendBadge, s.currentBadge]}>
                        <Text style={[s.recommendBadgeText, s.currentBadgeText]}>이용 중인 플랜</Text>
                      </View>
                    )}
                    {meta.recommended && !isCurrent && (
                      <View style={s.recommendBadge}>
                        <Text style={s.recommendBadgeText}>추천 요금제</Text>
                      </View>
                    )}
                  </View>
                )}
                <View style={s.planHeader}>
                  <Text style={s.planName}>{p.title || p.id}</Text>
                  {meta.tagline ? <Text style={s.planTagline}>{meta.tagline}</Text> : null}
                </View>
                <View style={s.planPriceRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.planPrice}>{p.displayPrice}</Text>
                    <Text style={s.planPricePeriod}>{isFree ? "가입 시 자동 적용" : "매월 자동 청구"}</Text>
                  </View>
                  {!isFree && (
                    <TouchableOpacity
                      style={[s.planCta, isBuying && s.planCtaDisabled]}
                      onPress={() => handleBuySubscription(p.id)}
                      disabled={buying !== null}
                      activeOpacity={0.85}
                    >
                      {isBuying ? (
                        <ActivityIndicator color={COLORS.white} size="small" />
                      ) : (
                        <Text style={s.planCtaText}>업그레이드</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
                {meta.benefits.length > 0 && (
                  <View style={s.planBenefits}>
                    {meta.benefits.map((b, i) => (
                      <View key={i} style={s.benefitRow}>
                        <Text style={s.benefitCheck}>✓</Text>
                        <Text style={s.benefitText}>{b}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}

        {
}
        <Text style={[s.sectionTitle, { marginTop: 32 }]}>꽃 구매</Text>
        <Text style={s.sectionDesc}>선물하기 전용 · 구매 후 통화 중 사용 가능.</Text>
        {MOCK_GIFT_PACKS.map((p) => (
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
        ))}

        {
}

        {}
        <View style={{ marginTop: 32, alignItems: "center" }}>
          <Text style={s.footer}>
            {Platform.OS === "ios"
              ? t("purchase.termsFooterIos", {
                  defaultValue:
                    "자동 갱신 구독은 해지 전까지 매 주기 결제됩니다.\n해지: 설정 → Apple ID → 구독 → afterlife",
                })
              : t("purchase.termsFooterAndroid", {
                  defaultValue:
                    "자동 갱신 구독은 해지 전까지 매 주기 결제됩니다.\n해지: Play 스토어 → 정기 결제 → afterlife",
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
    borderRadius: RADIUS.lg,
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
    borderRadius: RADIUS.md,
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

  planCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    padding: 20,
    marginBottom: 12,
  },
  planCardRecommended: {
    borderColor: COLORS.violet600,
    borderWidth: 2,
  },
  recommendBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: COLORS.violet100,
    borderRadius: 999,
  },
  recommendBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.violet700,
  },

  badgeRow: { flexDirection: "row", gap: 6, marginBottom: 10 },

  currentBadge: { backgroundColor: COLORS.violet600 },
  currentBadgeText: { color: COLORS.white },
  planHeader: { marginBottom: 12 },
  planName: { fontSize: 20, fontWeight: "700", color: COLORS.zinc900 },
  planTagline: { fontSize: 13, color: COLORS.zinc500, marginTop: 4 },
  planPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  planPrice: { fontSize: 22, fontWeight: "700", color: COLORS.zinc900 },
  planPricePeriod: { fontSize: 12, color: COLORS.zinc500, marginTop: 2 },
  planCta: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    backgroundColor: COLORS.violet600,
    borderRadius: 999,
    minWidth: 96,
    alignItems: "center",
    justifyContent: "center",
  },
  planCtaDisabled: { opacity: 0.6 },
  planCtaText: { color: COLORS.white, fontWeight: "700", fontSize: 14 },
  planBenefits: {
    borderTopWidth: 1,
    borderTopColor: COLORS.zinc200,
    paddingTop: 14,
    gap: 8,
  },
  benefitRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  benefitCheck: { color: COLORS.violet600, fontWeight: "700", fontSize: 14, width: 16 },
  benefitText: { flex: 1, fontSize: 13, color: COLORS.zinc700, lineHeight: 18 },

  emptyText: { fontSize: 13, color: COLORS.zinc500, textAlign: "center", marginVertical: 8 },
  emptyBlock: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    borderStyle: "dashed",
    borderRadius: RADIUS.md,
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
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 16,
  },
  mockBannerTitle: { fontSize: 13, fontWeight: "700", color: "#b45309", marginBottom: 4 },
  mockBannerDesc: { fontSize: 11, color: "#92400e", lineHeight: 16 },
  footer: { fontSize: 11, color: COLORS.zinc500, textAlign: "center", lineHeight: 18 },

  giftRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: RADIUS.md,
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
