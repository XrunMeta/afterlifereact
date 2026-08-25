

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
  v_f2c756,
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

function v_2e0619(v_b6a7e0): string {
  const v_43e24b = Math.floor(v_b6a7e0 / 60);
  const v_fd5f43 = v_b6a7e0 % 60;
  if (v_fd5f43 > 0 && v_43e24b < 10) return `${v_43e24b}분 ${v_fd5f43}초`;
  return `${v_43e24b}분`;
}

const v_5348ba = "__mock__";

const v_2c427c = "__free__";

const MOCK_SUBS: v_23b84c[] = [
  { id: "run.xrun.afterlife.sub.light", title: "RUN", description: "광고없이 이용", displayPrice: "₩13,000", price: 13000, currency: "KRW", platform: "ios", type: "subs" } as unknown as v_23b84c,
  { id: "run.xrun.afterlife.sub.monste", title: "Monster", description: "광고없이 이용", displayPrice: "₩65,000", price: 65000, currency: "KRW", platform: "ios", type: "subs" } as unknown as v_23b84c,
].map((v_e2a85c) => ({ ...v_e2a85c, id: `${v_5348ba}${v_e2a85c.id}` }) as v_23b84c);

const FREE_SUB: v_23b84c = {
  id: v_2c427c,
  title: "Go (Free)",
  description: "회원가입 시 자동 부여",
  displayPrice: "무료",
  price: 0,
  currency: "KRW",
  platform: "ios",
  type: "subs",
} as unknown as v_23b84c;
const MOCK_CONSUMABLES: v_678322[] = [
  { id: "run.xrun.afterlife.credit.30", title: "Recharge 30min", description: "30분 충전 · 5년 유효", displayPrice: "₩2,200", price: 2200, currency: "KRW", platform: "ios", type: "in-app" } as unknown as v_678322,
  { id: "run.xrun.afterlife.credit.60", title: "Recharge 60min", description: "60분 충전 · 5년 유효", displayPrice: "₩4,400", price: 4400, currency: "KRW", platform: "ios", type: "in-app" } as unknown as v_678322,
  { id: "run.xrun.afterlife.credit.150", title: "Recharge 150min", description: "150분 충전 · 5년 유효", displayPrice: "₩9,900", price: 9900, currency: "KRW", platform: "ios", type: "in-app" } as unknown as v_678322,
  { id: "run.xrun.afterlife.credit.300", title: "Recharge 300min", description: "300분 충전 · 5년 유효", displayPrice: "₩19,900", price: 19900, currency: "KRW", platform: "ios", type: "in-app" } as unknown as v_678322,
].map((v_e2a85c) => ({ ...v_e2a85c, id: `${v_5348ba}${v_e2a85c.id}` }) as v_678322);

const MOCK_GIFT_PACKS: v_678322[] = [
  { id: "run.xrun.afterlife.gift.pack.1", title: "꽃 1개", description: "선물하기 1회 사용", displayPrice: "₩3,000", price: 3000, currency: "KRW", platform: "ios", type: "in-app" } as unknown as v_678322,
  { id: "run.xrun.afterlife.gift.pack.5", title: "꽃 5개", description: "선물하기 5회 사용", displayPrice: "₩14,000", price: 14000, currency: "KRW", platform: "ios", type: "in-app" } as unknown as v_678322,
  { id: "run.xrun.afterlife.gift.pack.10", title: "꽃 10개", description: "선물하기 10회 사용", displayPrice: "₩27,000", price: 27000, currency: "KRW", platform: "ios", type: "in-app" } as unknown as v_678322,
].map((v_e2a85c) => ({ ...v_e2a85c, id: `${v_5348ba}${v_e2a85c.id}` }) as v_678322);
const v_2cc272 = (v_389afb): boolean => v_389afb.startsWith(v_5348ba);
const v_4bfbf2 = (v_389afb): boolean => v_389afb === v_2c427c;
const v_03b27f = (v_389afb): boolean => v_9fe308(v_389afb).startsWith("run.xrun.afterlife.gift.pack.");

const v_0ce4cc = {
  [v_2c427c]: {
    tagline: "회원가입 시 자동 제공",
    benefits: [
      "광고 시청 후 서비스 이용",
      "서비스 중간 광고 삽입",
      "클론 1개 생성",
      "클론 삭제/생성 5회 제공",
      "월 50분 통화 제공",
    ],
  },
  "run.xrun.afterlife.sub.light": {

    tagline: "광고 없이 이용",
    benefits: [
      "클론 2개 생성",
      "클론 삭제/생성 10회 제공",
      "월 120분 통화 제공",
      "꽃 2개 제공 (선물하기용)",
    ],
    recommended: true,
  },
  "run.xrun.afterlife.sub.monste": {

    tagline: "광고 없이 이용",
    benefits: [
      "클론 무제한 생성",
      "클론 삭제/생성 무제한",
      "월 1000분 통화 제공",
      "꽃 10개 제공 (선물하기용)",
    ],
  },
};
function v_9fe308(v_389afb): string {
  return v_389afb.startsWith(v_5348ba) ? v_389afb.slice(v_5348ba.length) : v_389afb;
}

function v_5fd964(v_399dbd, v_8c9d89): boolean {
  if (!v_8c9d89) return v_399dbd === v_2c427c;
  const v_76a373 = v_9fe308(v_399dbd);

  const v_a5364f = v_76a373.split(".sub.")[1] ?? "";
  return v_a5364f.toLowerCase() === v_8c9d89.toLowerCase();
}
function v_3cb64a(v_389afb): { tagline: string; benefits: string[]; recommended?: boolean } {
  return v_0ce4cc[v_9fe308(v_389afb)] ?? { tagline: "", benefits: [] };
}

export default function v_0035e1() {
  const { t: v_8d41d7 } = v_772971();
  const v_c65f5d = v_ada615();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);

  const v_6ed1bd = v_1ed7d9((v_fd5f43) => v_fd5f43.apiUser?.email ?? null);

  const v_f66a30 = true;

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

        `${v_8c0b26.name} ${v_8c0b26.count}개를 ${v_2e0619(v_8c0b26.xrunTotal)}으로 교환할까요?`,
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

                  `${v_2e0619(v_8f00b9.xrunCredited)}이 지갑에 충전됐어요.`,
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

    if (v_4bfbf2(v_399dbd)) return;
    if (v_2cc272(v_399dbd)) {
      v_889fad(
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
        v_889fad(v_8d41d7("purchase.paymentErrorTitle", { defaultValue: "결제 오류" }), v_badeaf);
      }
    } finally {
      setTimeout(() => v_ce0cde(null), 3000);
    }
  };

  const v_bdb045 = async (v_399dbd) => {
    if (v_c63375) return;
    if (v_2cc272(v_399dbd)) {
      v_889fad(
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
        v_889fad(v_8d41d7("purchase.paymentErrorTitle", { defaultValue: "결제 오류" }), v_badeaf);
      }
    } finally {
      setTimeout(() => v_ce0cde(null), 3000);
    }
  };

  return (
    <SafeView backgroundColor={v_1bfbd0.white} bottomBackgroundColor={v_1bfbd0.white}>
      <PageHeader
        title={v_8d41d7("my.menu.purchase", { defaultValue: "크레딧 충전 · 구독" })}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />

      <ScrollView ref={v_5ca6b8} contentContainerStyle={{ padding: v_9b1a04.large, paddingBottom: 8 }}>
        {
}

        {}
        <View style={v_fd5f43.balanceCard}>
          <Text style={v_fd5f43.balanceTitle}>{v_8d41d7("my.balance.remainingTokens", { defaultValue: "남은 통화 시간" })}</Text>
          {v_55599a ? (
            <ActivityIndicator color={v_1bfbd0.violet600} />
          ) : v_c88e9b ? (
            <>
              <Text style={v_fd5f43.balanceTotal}>{v_2e0619(v_c88e9b.totalSec)}</Text>
              <View style={v_fd5f43.balanceRow}>
                <View style={v_fd5f43.balanceCol}>
                  <Text style={v_fd5f43.balanceLabel}>{v_8d41d7("purchase.bucketFree", { defaultValue: "무료" })}</Text>
                  <Text style={v_fd5f43.balanceVal}>{v_2e0619(v_c88e9b.freeSec)}</Text>
                </View>
                <View style={v_fd5f43.balanceCol}>
                  <Text style={v_fd5f43.balanceLabel}>{v_8d41d7("purchase.bucketSub", { defaultValue: "구독" })}</Text>
                  <Text style={v_fd5f43.balanceVal}>{v_2e0619(v_c88e9b.subSec)}</Text>
                </View>
                <View style={v_fd5f43.balanceCol}>
                  <Text style={v_fd5f43.balanceLabel}>{v_8d41d7("purchase.bucketTopup", { defaultValue: "충전" })}</Text>
                  <Text style={v_fd5f43.balanceVal}>{v_2e0619(v_c88e9b.topupSec)}</Text>
                </View>
                {
}
                {v_f66a30 && (
                  <TouchableOpacity style={v_fd5f43.balanceCol} onPress={v_1c51b0} activeOpacity={0.6}>
                    <Text style={v_fd5f43.balanceLabel}>{v_8d41d7("purchase.bucketGift", { defaultValue: "선물" })}</Text>
                    <Text style={v_fd5f43.balanceVal}>
                      {v_f04609.reduce((v_dce0a8, v_206b88) => v_dce0a8 + v_206b88.count, 0)}개
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
        {v_f66a30 && (
          <TouchableOpacity
            style={v_fd5f43.giftRedeemCard}
            activeOpacity={0.75}
            onPress={async () => {

              const v_e0c7e8 = encodeURIComponent(v_6ed1bd ?? "");
              const v_9466ca = `https://www.xrun.run/invite?referral=${v_e0c7e8}`;
              await v_f2c756.openURL(v_9466ca);
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={v_fd5f43.giftRedeemTitle}>받은 선물 교환하기</Text>
              <Text style={v_fd5f43.giftRedeemDesc}>
                받은 꽃을 XRUN 앱에서 광고 시청하고 통화용 꽃으로 바꿔보세요.
              </Text>
            </View>
            <Text style={v_fd5f43.giftRedeemArrow}>›</Text>
          </TouchableOpacity>
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
                ? v_8d41d7("purchase.subLoadHintIos", { defaultValue: "설정 → App Store 계정 로그인 확인 후 다시 시도해주세요." })
                : v_8d41d7("purchase.subLoadHintAndroid", { defaultValue: "Play 스토어 계정 로그인 확인 후 다시 시도해주세요." })}
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

          [v_6f8613, ...v_ab371b].map((v_e2a85c) => {
            const v_ab4c96 = v_3cb64a(v_e2a85c.id);
            const v_7e898c = v_c63375 === v_e2a85c.id;
            const v_d5ee40 = v_4bfbf2(v_e2a85c.id);

            const v_86cc3d = v_5fd964(v_e2a85c.id, v_c88e9b?.subscription?.planCode ?? null);
            return (
              <View key={v_e2a85c.id} style={[v_fd5f43.planCard, v_86cc3d && v_fd5f43.planCardRecommended]}>
                {(v_86cc3d || v_ab4c96.recommended) && (
                  <View style={v_fd5f43.badgeRow}>
                    {v_86cc3d && (
                      <View style={[v_fd5f43.recommendBadge, v_fd5f43.currentBadge]}>
                        <Text style={[v_fd5f43.recommendBadgeText, v_fd5f43.currentBadgeText]}>이용 중인 플랜</Text>
                      </View>
                    )}
                    {v_ab4c96.recommended && !v_86cc3d && (
                      <View style={v_fd5f43.recommendBadge}>
                        <Text style={v_fd5f43.recommendBadgeText}>추천 요금제</Text>
                      </View>
                    )}
                  </View>
                )}
                <View style={v_fd5f43.planHeader}>
                  <Text style={v_fd5f43.planName}>{v_e2a85c.title || v_e2a85c.id}</Text>
                  {v_ab4c96.tagline ? <Text style={v_fd5f43.planTagline}>{v_ab4c96.tagline}</Text> : null}
                </View>
                <View style={v_fd5f43.planPriceRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={v_fd5f43.planPrice}>{v_e2a85c.displayPrice}</Text>
                    <Text style={v_fd5f43.planPricePeriod}>{v_d5ee40 ? "가입 시 자동 적용" : "매월 자동 청구"}</Text>
                  </View>
                  {!v_d5ee40 && (
                    <TouchableOpacity
                      style={[v_fd5f43.planCta, v_7e898c && v_fd5f43.planCtaDisabled]}
                      onPress={() => v_0b9762(v_e2a85c.id)}
                      disabled={v_c63375 !== null}
                      activeOpacity={0.85}
                    >
                      {v_7e898c ? (
                        <ActivityIndicator color={v_1bfbd0.white} size="small" />
                      ) : (
                        <Text style={v_fd5f43.planCtaText}>업그레이드</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
                {v_ab4c96.benefits.length > 0 && (
                  <View style={v_fd5f43.planBenefits}>
                    {v_ab4c96.benefits.map((v_148ff6, v_ebec57) => (
                      <View key={v_ebec57} style={v_fd5f43.benefitRow}>
                        <Text style={v_fd5f43.benefitCheck}>✓</Text>
                        <Text style={v_fd5f43.benefitText}>{v_148ff6}</Text>
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
        <Text style={[v_fd5f43.sectionTitle, { marginTop: 32 }]}>꽃 구매</Text>
        <Text style={v_fd5f43.sectionDesc}>선물하기 전용 · 구매 후 통화 중 사용 가능.</Text>
        {v_5ff45c.map((v_e2a85c) => (
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
        ))}

        {
}

        {}
        <View style={{ marginTop: 32, alignItems: "center" }}>
          <Text style={v_fd5f43.footer}>
            {v_326be8.OS === "ios"
              ? v_8d41d7("purchase.termsFooterIos", {
                  defaultValue:
                    "자동 갱신 구독은 해지 전까지 매 주기 결제됩니다.\n해지: 설정 → Apple ID → 구독 → afterlife",
                })
              : v_8d41d7("purchase.termsFooterAndroid", {
                  defaultValue:
                    "자동 갱신 구독은 해지 전까지 매 주기 결제됩니다.\n해지: Play 스토어 → 정기 결제 → afterlife",
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
    borderRadius: v_8b0c90.lg,
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
    borderRadius: v_8b0c90.md,
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

  planCard: {
    backgroundColor: v_1bfbd0.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    padding: 20,
    marginBottom: 12,
  },
  planCardRecommended: {
    borderColor: v_1bfbd0.violet600,
    borderWidth: 2,
  },
  recommendBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: v_1bfbd0.violet100,
    borderRadius: 999,
  },
  recommendBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: v_1bfbd0.violet700,
  },

  badgeRow: { flexDirection: "row", gap: 6, marginBottom: 10 },

  currentBadge: { backgroundColor: v_1bfbd0.violet600 },
  currentBadgeText: { color: v_1bfbd0.white },

  giftRedeemCard: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
    padding: 16,
    borderRadius: v_8b0c90.lg,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    backgroundColor: "#faf5ff",
  },
  giftRedeemTitle: { fontSize: 15, fontWeight: "700", color: v_1bfbd0.zinc900 },
  giftRedeemDesc: { fontSize: 12, color: v_1bfbd0.zinc600, marginTop: 4, lineHeight: 17 },
  giftRedeemArrow: { fontSize: 24, color: v_1bfbd0.violet600, marginLeft: 12 },
  planHeader: { marginBottom: 12 },
  planName: { fontSize: 20, fontWeight: "700", color: v_1bfbd0.zinc900 },
  planTagline: { fontSize: 13, color: v_1bfbd0.zinc500, marginTop: 4 },
  planPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  planPrice: { fontSize: 22, fontWeight: "700", color: v_1bfbd0.zinc900 },
  planPricePeriod: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },
  planCta: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    backgroundColor: v_1bfbd0.violet600,
    borderRadius: 999,
    minWidth: 96,
    alignItems: "center",
    justifyContent: "center",
  },
  planCtaDisabled: { opacity: 0.6 },
  planCtaText: { color: v_1bfbd0.white, fontWeight: "700", fontSize: 14 },
  planBenefits: {
    borderTopWidth: 1,
    borderTopColor: v_1bfbd0.zinc200,
    paddingTop: 14,
    gap: 8,
  },
  benefitRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  benefitCheck: { color: v_1bfbd0.violet600, fontWeight: "700", fontSize: 14, width: 16 },
  benefitText: { flex: 1, fontSize: 13, color: v_1bfbd0.zinc700, lineHeight: 18 },

  emptyText: { fontSize: 13, color: v_1bfbd0.zinc500, textAlign: "center", marginVertical: 8 },
  emptyBlock: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    borderStyle: "dashed",
    borderRadius: v_8b0c90.md,
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
    borderRadius: v_8b0c90.md,
    padding: 12,
    marginBottom: 16,
  },
  mockBannerTitle: { fontSize: 13, fontWeight: "700", color: "#b45309", marginBottom: 4 },
  mockBannerDesc: { fontSize: 11, color: "#92400e", lineHeight: 16 },
  footer: { fontSize: 11, color: v_1bfbd0.zinc500, textAlign: "center", lineHeight: 18 },

  giftRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: v_8b0c90.md,
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
