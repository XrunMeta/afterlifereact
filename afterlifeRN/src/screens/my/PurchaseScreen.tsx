

import v_a3453e, { v_de06a3, v_c4deb2, v_e662ae, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_122070,
  v_4623af,
  v_39a996,
  v_03e392,
  v_326be8,
} from "rcmrninabrnb";
import { v_cf763b, v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import { v_772971 } from "jmpfvteuuztnp";
import type { v_75de9d } from "zqqvxke";
import type { v_678322, v_23b84c } from "bvpcozhmvsrfxgke";
import v_556baf from "../../components/ui/SafeView";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0, v_8b0c90, v_9b1a04 } from "../../components/constants";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_48981e, type v_2b70d7 } from "../../api/credits";

import { v_83b207, v_422d96, type v_ccbfb2 } from "../../api/giftInventory";
import { v_889fad } from "../../stores/dialogStore";
import { v_cf9c33 } from "rcmrninabrnb";

const v_ea0a9d = new Set(["oth-test@example.invalid", "oth-user@example.invalid"]);
const v_978825 = (v_e0c7e8) =>
  !!v_e0c7e8 && v_ea0a9d.has(v_e0c7e8.toLowerCase().trim());
import {
  v_1c6d94,
  v_e02ccf,
  v_7c6fd6,
  type v_a9d25e,
  type v_a81007,
} from "../../lib/iap";

function v_429a79(v_b6a7e0, t: v_75de9d): string {
  const v_43e24b = Math.floor(v_b6a7e0 / 60);
  const v_fd5f43 = v_b6a7e0 % 60;
  return v_fd5f43 > 0
    ? v_8d41d7("common.durationMinSec", { m: v_43e24b, s: v_fd5f43, defaultValue: `${v_43e24b}분 ${v_fd5f43}초` })
    : v_8d41d7("common.durationMin", { m: v_43e24b, defaultValue: `${v_43e24b}분` });
}

const v_176062 = 60;
function v_da6788(v_b6a7e0): string {
  const v_76be17 = v_b6a7e0 / v_176062;

  const v_fd5f43 = Number.isInteger(v_76be17) ? v_76be17.toLocaleString() : v_76be17.toFixed(1);
  return `${v_fd5f43} XRUN`;
}

const v_5348ba = "__mock__";
const MOCK_SUBS: v_23b84c[] = [
  { id: "run.xrun.afterlife.sub.light", title: "xLight 30min", description: "월 30분 통화", displayPrice: "₩2,200", price: 2200, currency: "KRW", platform: "ios", type: "subs" } as unknown as v_23b84c,
  { id: "run.xrun.afterlife.sub.basic.v3", title: "xBasic 100min", description: "월 100분 통화", displayPrice: "₩6,600", price: 6600, currency: "KRW", platform: "ios", type: "subs" } as unknown as v_23b84c,
  { id: "run.xrun.afterlife.sub.standard", title: "xStandard 300min", description: "월 300분 통화", displayPrice: "₩19,900", price: 19900, currency: "KRW", platform: "ios", type: "subs" } as unknown as v_23b84c,
  { id: "run.xrun.afterlife.sub.plus", title: "xPlus 600min", description: "월 600분 통화", displayPrice: "₩39,900", price: 39900, currency: "KRW", platform: "ios", type: "subs" } as unknown as v_23b84c,
  { id: "run.xrun.afterlife.sub.premium", title: "xPremium 1000min", description: "월 1000분 통화", displayPrice: "₩69,900", price: 69900, currency: "KRW", platform: "ios", type: "subs" } as unknown as v_23b84c,
].map((v_e2a85c) => ({ ...v_e2a85c, id: `${v_5348ba}${v_e2a85c.id}` }) as v_23b84c);
const MOCK_CONSUMABLES: v_678322[] = [
  { id: "run.xrun.afterlife.credit.30", title: "Recharge 30min", description: "30분 충전 · 5년 유효", displayPrice: "₩2,200", price: 2200, currency: "KRW", platform: "ios", type: "in-app" } as unknown as v_678322,
  { id: "run.xrun.afterlife.credit.60", title: "Recharge 60min", description: "60분 충전 · 5년 유효", displayPrice: "₩4,400", price: 4400, currency: "KRW", platform: "ios", type: "in-app" } as unknown as v_678322,
  { id: "run.xrun.afterlife.credit.150", title: "Recharge 150min", description: "150분 충전 · 5년 유효", displayPrice: "₩9,900", price: 9900, currency: "KRW", platform: "ios", type: "in-app" } as unknown as v_678322,
  { id: "run.xrun.afterlife.credit.300", title: "Recharge 300min", description: "300분 충전 · 5년 유효", displayPrice: "₩19,900", price: 19900, currency: "KRW", platform: "ios", type: "in-app" } as unknown as v_678322,
].map((v_e2a85c) => ({ ...v_e2a85c, id: `${v_5348ba}${v_e2a85c.id}` }) as v_678322);
const v_2cc272 = (v_389afb): boolean => v_389afb.startsWith(v_5348ba);

export default function v_0035e1() {
  const { t: v_8d41d7 } = v_772971();
  const v_c65f5d = v_ada615();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const v_b113dd = v_1ed7d9((v_fd5f43) => v_fd5f43.apiUser);
  const v_f66a30 = v_978825(v_b113dd?.email);

  const v_5ca6b8 = v_e662ae<v_122070>(null);
  const v_e7f875 = v_e662ae<number>(0);
  const v_1c51b0 = () => {
    v_5ca6b8.current?.scrollTo({ y: Math.max(0, v_e7f875.current - 12), animated: true });
  };
  const [v_c88e9b, v_de20d8] = v_5ab095<v_2b70d7 | null>(null);

  const [v_f04609, v_4ed559] = v_5ab095<v_ccbfb2[]>([]);
  const [v_08031a, v_83363c] = v_5ab095<string | null>(null);
  const [v_55599a, v_530cbd] = v_5ab095(true);
  const [v_ab371b, v_0cf94e] = v_5ab095<v_23b84c[]>([]);
  const [v_275767, v_cb5356] = v_5ab095<v_678322[]>([]);
  const [v_723218, v_6d964e] = v_5ab095(true);
  const [v_c63375, v_ce0cde] = v_5ab095<string | null>(null);

  const v_1a1b9b = v_de06a3(async () => {
    if (!v_2ca7e0) return;
    v_530cbd(true);
    try {
      const v_148ff6 = await v_48981e(v_2ca7e0);
      v_de20d8(v_148ff6);
    } catch (v_49263d) {
      console.warn("[purchase] balance fetch failed:", v_49263d);
    } finally {
      v_530cbd(false);
    }

    if (v_f66a30) {
      try {
        const v_8f00b9 = await v_83b207(v_2ca7e0);
        v_4ed559(v_8f00b9.items);
      } catch (v_49263d) {
        console.warn("[purchase] gift inventory fetch failed:", v_49263d);
      }
    }
  }, [v_2ca7e0, v_f66a30]);

  const v_3295c9 = v_de06a3(
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
              v_83363c(v_8c0b26.giftId);
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
                await v_1a1b9b();
              } catch (v_49263d) {
                v_889fad("교환 실패", (v_49263d as Error).message ?? "잠시 후 다시 시도해주세요.");
              } finally {
                v_83363c(null);
              }
            },
          },
        ],
      );
    },
    [v_2ca7e0, v_1a1b9b],
  );

  v_cf763b(
    v_de06a3(() => {
      void v_1a1b9b();
    }, [v_1a1b9b]),
  );

  const [v_be7a92, v_8c27a2] = v_5ab095(false);
  const v_d5d7b5 = v_de06a3(async () => {
    v_6d964e(true);
    try {
      const { subscriptions: v_60a14d, consumables: v_cfc98b } = await v_1c6d94();

      const v_8626ec = v_60a14d.length === 0 && v_cfc98b.length === 0;
      v_8c27a2(v_8626ec);
      v_0cf94e(v_8626ec ? v_246db7 : v_60a14d);
      v_cb5356(v_8626ec ? v_45e2bf : v_cfc98b);
      console.log(
        `[purchase] loaded ${v_60a14d.length} subs, ${v_cfc98b.length} consumables${v_8626ec ? " (mock 삽입)" : ""}`,
      );
    } catch (v_49263d) {
      console.warn("[purchase] product fetch failed, falling back to mocks:", v_49263d);
      v_8c27a2(true);
      v_0cf94e(v_246db7);
      v_cb5356(v_45e2bf);
    } finally {
      v_6d964e(false);
    }
  }, []);
  v_c4deb2(() => {
    void v_d5d7b5();
  }, [v_d5d7b5]);

  const v_0b9762 = async (v_399dbd) => {
    if (v_c63375) return;
    if (v_2cc272(v_399dbd)) {
      v_03e392.alert(
        v_8d41d7("purchase.mockAlertTitle", { defaultValue: "MOCK 상품" }),
        v_8d41d7("purchase.mockAlertMessage", { defaultValue: "유료 앱 계약 활성화 후 실제 결제 가능합니다." }),
      );
      return;
    }
    v_ce0cde(v_399dbd);
    try {
      await v_7c6fd6(v_399dbd as v_a9d25e);

      setTimeout(() => v_1a1b9b(), 2000);
    } catch (v_49263d) {
      const v_badeaf = (v_49263d as Error).message ?? "";
      if (!v_badeaf.includes("cancel")) {
        v_03e392.alert(v_8d41d7("purchase.paymentErrorTitle", { defaultValue: "결제 오류" }), v_badeaf);
      }
    } finally {
      setTimeout(() => v_ce0cde(null), 3000);
    }
  };

  const v_bdb045 = async (v_399dbd) => {
    if (v_c63375) return;
    if (v_2cc272(v_399dbd)) {
      v_03e392.alert(
        v_8d41d7("purchase.mockAlertTitle", { defaultValue: "MOCK 상품" }),
        v_8d41d7("purchase.mockAlertMessage", { defaultValue: "유료 앱 계약 활성화 후 실제 결제 가능합니다." }),
      );
      return;
    }
    v_ce0cde(v_399dbd);
    try {
      await v_e02ccf(v_399dbd as v_a81007);
      setTimeout(() => v_1a1b9b(), 2000);
    } catch (v_49263d) {
      const v_badeaf = (v_49263d as Error).message ?? "";
      if (!v_badeaf.includes("cancel")) {
        v_03e392.alert(v_8d41d7("purchase.paymentErrorTitle", { defaultValue: "결제 오류" }), v_badeaf);
      }
    } finally {
      setTimeout(() => v_ce0cde(null), 3000);
    }
  };

  return (
    <SafeView backgroundColor={v_1bfbd0.white}>
      <PageHeader
        title={v_8d41d7("my.menu.purchase", { defaultValue: "크레딧 충전 · 구독" })}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />

      <ScrollView ref={v_5ca6b8} contentContainerStyle={{ padding: v_9b1a04.large, paddingBottom: 40 }}>
        {
}

        {}
        <View style={v_fd5f43.balanceCard}>
          <Text style={v_fd5f43.balanceTitle}>{v_8d41d7("my.balance.remainingTokens", { defaultValue: "남은 토큰 수량" })}</Text>
          {v_55599a ? (
            <ActivityIndicator color={v_1bfbd0.violet600} />
          ) : v_c88e9b ? (
            <>
              <Text style={v_fd5f43.balanceTotal}>{v_da6788(v_c88e9b.totalSec)}</Text>
              <View style={v_fd5f43.balanceRow}>
                <View style={v_fd5f43.balanceCol}>
                  <Text style={v_fd5f43.balanceLabel}>{v_8d41d7("purchase.bucketFree", { defaultValue: "무료" })}</Text>
                  <Text style={v_fd5f43.balanceVal}>{v_da6788(v_c88e9b.freeSec)}</Text>
                </View>
                <View style={v_fd5f43.balanceCol}>
                  <Text style={v_fd5f43.balanceLabel}>{v_8d41d7("purchase.bucketSub", { defaultValue: "구독" })}</Text>
                  <Text style={v_fd5f43.balanceVal}>{v_da6788(v_c88e9b.subSec)}</Text>
                </View>
                <View style={v_fd5f43.balanceCol}>
                  <Text style={v_fd5f43.balanceLabel}>{v_8d41d7("purchase.bucketTopup", { defaultValue: "충전" })}</Text>
                  <Text style={v_fd5f43.balanceVal}>{v_da6788(v_c88e9b.topupSec)}</Text>
                </View>
                {}
                {v_f66a30 && v_f04609.length > 0 && (
                  <TouchableOpacity style={v_fd5f43.balanceCol} onPress={v_1c51b0} activeOpacity={0.6}>
                    <Text style={v_fd5f43.balanceLabel}>{v_8d41d7("purchase.bucketGift", { defaultValue: "선물" })}</Text>
                    <Text style={[v_fd5f43.balanceVal, { color: v_1bfbd0.violet700 }]}>
                      {v_da6788(v_f04609.reduce((v_dce0a8, v_206b88) => v_dce0a8 + v_206b88.xrunTotal, 0))}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              {v_c88e9b.subscription && (
                <Text style={v_fd5f43.subInfo}>
                  {v_8d41d7("purchase.subActive", {
                    plan: v_c88e9b.subscription.planCode.toUpperCase(),
                    date: new Date(v_c88e9b.subscription.periodEnd).toLocaleDateString("ko-KR"),
                    defaultValue: `${v_c88e9b.subscription.planCode.toUpperCase()} 구독 활성 · 다음 갱신 ${new Date(v_c88e9b.subscription.periodEnd).toLocaleDateString("ko-KR")}`,
                  })}
                </Text>
              )}
            </>
          ) : (
            <Text style={v_fd5f43.balanceLabel}>{v_8d41d7("my.balance.failed", { defaultValue: "잔액 조회 실패" })}</Text>
          )}
        </View>

        {
}
        {v_f66a30 && v_f04609.length > 0 && (
          <View
            style={{ marginTop: 8, marginBottom: 24 }}
            onLayout={(v_9e86fd) => { v_e7f875.current = v_9e86fd.nativeEvent.layout.y; }}
          >
            <Text style={v_fd5f43.sectionTitle}>받은 선물</Text>
            <Text style={v_fd5f43.sectionDesc}>[교환] 을 누르면 XRUN 크레딧으로 충전돼요.</Text>
            {v_f04609.map((v_8c0b26) => {
              const v_3f8465 = v_08031a === v_8c0b26.giftId;
              return (
                <View key={v_8c0b26.giftId} style={v_fd5f43.giftRow}>
                  {v_8c0b26.imageUrl ? (
                    <Image source={{ uri: v_8c0b26.imageUrl }} style={v_fd5f43.giftImg} />
                  ) : (
                    <View style={[v_fd5f43.giftImg, v_fd5f43.giftEmojiWrap]}>
                      <Text style={v_fd5f43.giftEmoji}>{v_8c0b26.emoji}</Text>
                    </View>
                  )}
                  <View style={v_fd5f43.giftInfo}>
                    <Text style={v_fd5f43.giftName}>{v_8c0b26.name} {v_8c0b26.count}개</Text>
                    <Text style={v_fd5f43.giftAmount}>= {v_8c0b26.xrunTotal.toLocaleString()} XRUN</Text>
                  </View>
                  <TouchableOpacity
                    style={[v_fd5f43.swapBtn, v_3f8465 && { opacity: 0.6 }]}
                    onPress={() => v_3295c9(v_8c0b26)}
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
            })}
          </View>
        )}

        {}
        <Text style={v_fd5f43.sectionTitle}>{v_8d41d7("purchase.subSectionTitle", { defaultValue: "월 구독" })}</Text>
        <Text style={v_fd5f43.sectionDesc}>{v_8d41d7("purchase.subSectionDesc", { defaultValue: "매월 자동 갱신." })}</Text>

        {v_723218 ? (
          <ActivityIndicator color={v_1bfbd0.violet600} style={{ marginVertical: 20 }} />
        ) : v_ab371b.length === 0 ? (
          <View style={v_fd5f43.emptyBlock}>
            <Text style={v_fd5f43.emptyText}>{v_8d41d7("purchase.subLoadFailed", { defaultValue: "구독 상품을 불러올 수 없어요." })}</Text>
            <Text style={v_fd5f43.emptyHint}>
              {v_326be8.OS === "ios"
                ? v_8d41d7("purchase.subLoadHintIos", { defaultValue: "설정 → App Store → Sandbox 계정 로그인 확인 후 다시 시도해주세요." })
                : v_8d41d7("purchase.subLoadHintOther", { defaultValue: "잠시 후 다시 시도해주세요." })}
            </Text>
            <TouchableOpacity
              style={v_fd5f43.retryBtn}
              onPress={v_d5d7b5}
              activeOpacity={0.85}
            >
              <Text style={v_fd5f43.retryBtnText}>{v_8d41d7("common.retry", { defaultValue: "다시 시도" })}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          v_ab371b.map((v_e2a85c) => (
            <TouchableOpacity
              key={v_e2a85c.id}
              style={[v_fd5f43.card, v_c63375 === v_e2a85c.id && v_fd5f43.cardDisabled]}
              onPress={() => v_0b9762(v_e2a85c.id)}
              disabled={v_c63375 !== null}
            >
              <View style={{ flex: 1 }}>
                <Text style={v_fd5f43.cardName}>{v_e2a85c.title || v_e2a85c.id}</Text>
                <Text style={v_fd5f43.cardDesc}>{v_e2a85c.description || ""}</Text>
              </View>
              <View style={v_fd5f43.cardPriceCol}>
                <Text style={v_fd5f43.cardPrice}>{v_e2a85c.displayPrice}</Text>
                {v_c63375 === v_e2a85c.id && (
                  <ActivityIndicator color={v_1bfbd0.violet600} size="small" />
                )}
              </View>
            </TouchableOpacity>
          ))
        )}

        {}
        <Text style={[v_fd5f43.sectionTitle, { marginTop: 32 }]}>{v_8d41d7("purchase.topupSectionTitle", { defaultValue: "충전 (일회성)" })}</Text>
        <Text style={v_fd5f43.sectionDesc}>{v_8d41d7("purchase.topupSectionDesc", { defaultValue: "구독과 별개로 통화 시간을 추가할 수 있어요. 5년 유효." })}</Text>

        {v_723218 ? (
          <ActivityIndicator color={v_1bfbd0.violet600} style={{ marginVertical: 20 }} />
        ) : v_275767.length === 0 ? (
          <View style={v_fd5f43.emptyBlock}>
            <Text style={v_fd5f43.emptyText}>{v_8d41d7("purchase.topupLoadFailed", { defaultValue: "충전 상품을 불러올 수 없어요." })}</Text>
            <TouchableOpacity
              style={v_fd5f43.retryBtn}
              onPress={v_d5d7b5}
              activeOpacity={0.85}
            >
              <Text style={v_fd5f43.retryBtnText}>{v_8d41d7("common.retry", { defaultValue: "다시 시도" })}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          v_275767.map((v_e2a85c) => (
            <TouchableOpacity
              key={v_e2a85c.id}
              style={[v_fd5f43.card, v_c63375 === v_e2a85c.id && v_fd5f43.cardDisabled]}
              onPress={() => v_bdb045(v_e2a85c.id)}
              disabled={v_c63375 !== null}
            >
              <View style={{ flex: 1 }}>
                <Text style={v_fd5f43.cardName}>{v_e2a85c.title || v_e2a85c.id}</Text>
                <Text style={v_fd5f43.cardDesc}>{v_e2a85c.description || ""}</Text>
              </View>
              <View style={v_fd5f43.cardPriceCol}>
                <Text style={v_fd5f43.cardPrice}>{v_e2a85c.displayPrice}</Text>
                {v_c63375 === v_e2a85c.id && (
                  <ActivityIndicator color={v_1bfbd0.violet600} size="small" />
                )}
              </View>
            </TouchableOpacity>
          ))
        )}

        {v_326be8.OS === "android" && (
          <Text style={[v_fd5f43.emptyText, { marginTop: 20 }]}>
            {v_8d41d7("purchase.androidNotReady", { defaultValue: "Android 결제는 준비 중이에요. iOS 로 먼저 이용해주세요." })}
          </Text>
        )}

        {}
        <View style={{ marginTop: 32, alignItems: "center" }}>
          <Text style={v_fd5f43.footer}>
            {v_8d41d7("purchase.termsFooter", {
              defaultValue:
                "자동 갱신 구독은 해지 전까지 매 주기 결제됩니다.\n해지: 설정 → Apple ID → 구독 → afterlife",
            })}
          </Text>
        </View>
      </ScrollView>
    </SafeView>
  );
}

const v_fd5f43 = v_472849.create({
  balanceCard: {
    backgroundColor: v_1bfbd0.violet100,
    borderRadius: v_8b0c90.large,
    padding: 20,
    marginBottom: 24,
  },
  balanceTitle: { fontSize: 13, color: v_1bfbd0.zinc600, marginBottom: 6 },
  balanceTotal: { fontSize: 28, fontWeight: "700", color: v_1bfbd0.violet700, marginBottom: 12 },
  balanceRow: { flexDirection: "row", gap: 12 },
  balanceCol: { flex: 1 },
  balanceLabel: { fontSize: 11, color: v_1bfbd0.zinc500 },
  balanceVal: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc900 },
  subInfo: { fontSize: 12, color: v_1bfbd0.zinc700, marginTop: 12 },

  sectionTitle: { fontSize: 16, fontWeight: "700", color: v_1bfbd0.zinc900, marginBottom: 4 },
  sectionDesc: { fontSize: 12, color: v_1bfbd0.zinc500, marginBottom: 12 },

  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: v_8b0c90.medium,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    marginBottom: 8,
    backgroundColor: v_1bfbd0.white,
  },
  cardDisabled: { opacity: 0.5 },
  cardName: { fontSize: 15, fontWeight: "600", color: v_1bfbd0.zinc900 },
  cardDesc: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },
  cardPriceCol: { alignItems: "flex-end", gap: 4 },
  cardPrice: { fontSize: 15, fontWeight: "700", color: v_1bfbd0.violet600 },

  emptyText: { fontSize: 13, color: v_1bfbd0.zinc500, textAlign: "center", marginVertical: 8 },
  emptyBlock: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    borderStyle: "dashed",
    borderRadius: v_8b0c90.medium,
  },
  emptyHint: { fontSize: 12, color: v_1bfbd0.zinc400, textAlign: "center", marginBottom: 12, lineHeight: 18 },
  retryBtn: {
    backgroundColor: v_1bfbd0.violet600,
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
    borderRadius: v_8b0c90.medium,
    padding: 12,
    marginBottom: 16,
  },
  mockBannerTitle: { fontSize: 13, fontWeight: "700", color: "#b45309", marginBottom: 4 },
  mockBannerDesc: { fontSize: 11, color: "#92400e", lineHeight: 16 },
  footer: { fontSize: 11, color: v_1bfbd0.zinc500, textAlign: "center", lineHeight: 18 },

  sectionDesc: { fontSize: 12, color: v_1bfbd0.zinc500, marginBottom: 12 },
  giftRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: v_8b0c90.medium,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 8,
    backgroundColor: v_1bfbd0.white,
  },
  giftImg: { width: 44, height: 44, borderRadius: 8 },
  giftEmojiWrap: { backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  giftEmoji: { fontSize: 26 },
  giftInfo: { flex: 1, marginLeft: 10 },
  giftName: { fontSize: 14, color: v_1bfbd0.zinc900, fontWeight: "600" },
  giftAmount: { fontSize: 12, color: v_1bfbd0.violet600, fontWeight: "700", marginTop: 2 },
  swapBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: v_1bfbd0.violet600,
    borderRadius: 8,
    minWidth: 60,
    alignItems: "center",
  },
  swapBtnText: { color: v_1bfbd0.white, fontWeight: "700", fontSize: 13 },
  giftFooterHint: { fontSize: 11, color: v_1bfbd0.zinc500, marginTop: 8, textAlign: "center" },
});
