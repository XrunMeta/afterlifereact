

import v_a3453e, { v_de06a3, v_c4deb2, v_5ab095 } from "bapkr";
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
import { v_cf763b } from "ixigazcpvfldbecwtbvavtbi";
import type { v_678322, v_23b84c } from "bvpcozhmvsrfxgke";
import v_556baf from "../../components/ui/SafeView";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0, v_8b0c90, v_9b1a04 } from "../../components/constants";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_48981e, type v_2b70d7 } from "../../api/credits";
import {
  v_1c6d94,
  v_e02ccf,
  v_7c6fd6,
  type v_a9d25e,
  type v_a81007,
} from "../../lib/iap";

function v_429a79(v_b6a7e0): string {
  const v_43e24b = Math.floor(v_b6a7e0 / 60);
  const v_fd5f43 = v_b6a7e0 % 60;
  return v_fd5f43 > 0 ? `${v_43e24b}분 ${v_fd5f43}초` : `${v_43e24b}분`;
}

export default function v_0035e1() {
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const [v_c88e9b, v_de20d8] = v_5ab095<v_2b70d7 | null>(null);
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
  }, [v_2ca7e0]);

  v_cf763b(
    v_de06a3(() => {
      void v_1a1b9b();
    }, [v_1a1b9b]),
  );

  v_c4deb2(() => {
    (async () => {
      v_6d964e(true);
      try {
        const { subscriptions: v_60a14d, consumables: v_cfc98b } = await v_1c6d94();
        v_0cf94e(v_60a14d);
        v_cb5356(v_cfc98b);
        console.log(`[purchase] loaded ${v_60a14d.length} subs, ${v_cfc98b.length} consumables`);
      } catch (v_49263d) {
        console.warn("[purchase] product fetch failed:", v_49263d);
        v_03e392.alert("상품 로드 실패", "잠시 후 다시 시도해주세요.");
      } finally {
        v_6d964e(false);
      }
    })();
  }, []);

  const v_0b9762 = async (sku: v_a9d25e) => {
    if (v_c63375) return;
    v_ce0cde(v_399dbd);
    try {
      await v_7c6fd6(v_399dbd);

      setTimeout(() => v_1a1b9b(), 2000);
    } catch (v_49263d) {
      const v_badeaf = (v_49263d as Error).message ?? "";
      if (!v_badeaf.includes("cancel")) {
        v_03e392.alert("결제 오류", v_badeaf);
      }
    } finally {
      setTimeout(() => v_ce0cde(null), 3000);
    }
  };

  const v_bdb045 = async (sku: v_a81007) => {
    if (v_c63375) return;
    v_ce0cde(v_399dbd);
    try {
      await v_e02ccf(v_399dbd);
      setTimeout(() => v_1a1b9b(), 2000);
    } catch (v_49263d) {
      const v_badeaf = (v_49263d as Error).message ?? "";
      if (!v_badeaf.includes("cancel")) {
        v_03e392.alert("결제 오류", v_badeaf);
      }
    } finally {
      setTimeout(() => v_ce0cde(null), 3000);
    }
  };

  return (
    <SafeView backgroundColor={v_1bfbd0.white}>
      <PageHeader title="크레딧 충전 · 구독" showBackButton />

      <ScrollView contentContainerStyle={{ padding: v_9b1a04.large, paddingBottom: 40 }}>
        {}
        <View style={v_fd5f43.balanceCard}>
          <Text style={v_fd5f43.balanceTitle}>남은 통화 시간</Text>
          {v_55599a ? (
            <ActivityIndicator color={v_1bfbd0.violet600} />
          ) : v_c88e9b ? (
            <>
              <Text style={v_fd5f43.balanceTotal}>{v_429a79(v_c88e9b.totalSec)}</Text>
              <View style={v_fd5f43.balanceRow}>
                <View style={v_fd5f43.balanceCol}>
                  <Text style={v_fd5f43.balanceLabel}>무료</Text>
                  <Text style={v_fd5f43.balanceVal}>{v_429a79(v_c88e9b.freeSec)}</Text>
                </View>
                <View style={v_fd5f43.balanceCol}>
                  <Text style={v_fd5f43.balanceLabel}>구독</Text>
                  <Text style={v_fd5f43.balanceVal}>{v_429a79(v_c88e9b.subSec)}</Text>
                </View>
                <View style={v_fd5f43.balanceCol}>
                  <Text style={v_fd5f43.balanceLabel}>충전</Text>
                  <Text style={v_fd5f43.balanceVal}>{v_429a79(v_c88e9b.topupSec)}</Text>
                </View>
              </View>
              {v_c88e9b.subscription && (
                <Text style={v_fd5f43.subInfo}>
                  {v_c88e9b.subscription.planCode.toUpperCase()} 구독 활성 · 다음 갱신 {new Date(v_c88e9b.subscription.periodEnd).toLocaleDateString("ko-KR")}
                </Text>
              )}
            </>
          ) : (
            <Text style={v_fd5f43.balanceLabel}>잔액 조회 실패</Text>
          )}
        </View>

        {}
        <Text style={v_fd5f43.sectionTitle}>월 구독</Text>
        <Text style={v_fd5f43.sectionDesc}>매월 자동 갱신. 언제든 해지 가능.</Text>

        {v_723218 ? (
          <ActivityIndicator color={v_1bfbd0.violet600} style={{ marginVertical: 20 }} />
        ) : v_ab371b.length === 0 ? (
          <Text style={v_fd5f43.emptyText}>구독 상품을 불러올 수 없어요.</Text>
        ) : (
          v_ab371b.map((v_e2a85c) => (
            <TouchableOpacity
              key={v_e2a85c.id}
              style={[v_fd5f43.card, v_c63375 === v_e2a85c.id && v_fd5f43.cardDisabled]}
              onPress={() => v_0b9762(v_e2a85c.id as v_a9d25e)}
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
        <Text style={[v_fd5f43.sectionTitle, { marginTop: 32 }]}>충전 (일회성)</Text>
        <Text style={v_fd5f43.sectionDesc}>구독과 별개로 통화 시간을 추가할 수 있어요. 5년 유효.</Text>

        {v_723218 ? (
          <ActivityIndicator color={v_1bfbd0.violet600} style={{ marginVertical: 20 }} />
        ) : v_275767.length === 0 ? (
          <Text style={v_fd5f43.emptyText}>충전 상품을 불러올 수 없어요.</Text>
        ) : (
          v_275767.map((v_e2a85c) => (
            <TouchableOpacity
              key={v_e2a85c.id}
              style={[v_fd5f43.card, v_c63375 === v_e2a85c.id && v_fd5f43.cardDisabled]}
              onPress={() => v_bdb045(v_e2a85c.id as v_a81007)}
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
            Android 결제는 준비 중이에요. iOS 로 먼저 이용해주세요.
          </Text>
        )}

        {}
        <View style={{ marginTop: 32, alignItems: "center" }}>
          <Text style={v_fd5f43.footer}>
            자동 갱신 구독은 해지 전까지 매 주기 결제됩니다.{"\n"}
            해지: 설정 → Apple ID → 구독 → afterlife
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

  emptyText: { fontSize: 13, color: v_1bfbd0.zinc500, textAlign: "center", marginVertical: 20 },
  footer: { fontSize: 11, color: v_1bfbd0.zinc500, textAlign: "center", lineHeight: 18 },
});
