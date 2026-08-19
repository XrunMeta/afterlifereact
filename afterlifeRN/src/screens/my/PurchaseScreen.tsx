

import v_a3453e, { v_de06a3, v_c4deb2, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
  v_39a996,
  v_122070,
  v_326be8,
} from "rcmrninabrnb";
import { v_cf763b } from "ixigazcpvfldbecwtbvavtbi";
import type { v_678322 } from "bvpcozhmvsrfxgke";
import v_556baf from "../../components/ui/SafeView";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0, v_8b0c90, v_9b1a04 } from "../../components/constants";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_48981e, type v_2b70d7 } from "../../api/credits";
import { v_889fad } from "../../stores/dialogStore";
import {
  v_2f3103,
  v_ad3c15,
  v_1c6d94,
  v_e02ccf,
  v_54ca39,
} from "../../lib/iap";

const v_b474da = "credits_1000";
const v_9f9d8d = new Set(["oth-user@example.invalid"]);

export default function v_0035e1() {
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const v_b113dd = v_1ed7d9((v_fd5f43) => v_fd5f43.apiUser);
  const v_2adf43 = v_9f9d8d.has(v_b113dd?.email ?? "");
  const [v_01bee9, v_2ea5dd] = v_5ab095<v_678322 | null>(null);
  const [v_c88e9b, v_de20d8] = v_5ab095<v_2b70d7 | null>(null);
  const [v_683210, v_34a50a] = v_5ab095(true);
  const [v_3f8465, v_b4f1d2] = v_5ab095(false);
  const [v_badeaf, v_e9cfc6] = v_5ab095<string | null>(null);

  const v_d3ded9 = v_de06a3(async () => {
    if (!v_2ca7e0) return;
    try {
      const v_148ff6 = await v_48981e(v_2ca7e0);
      v_de20d8(v_148ff6);
    } catch (v_49263d) {
      console.warn("[Purchase] balance fetch failed:", v_49263d);
    }
  }, [v_2ca7e0]);

  const v_58a9a8 = v_de06a3(async () => {
    v_34a50a(true);
    try {
      await v_2f3103();
      const { consumables: v_275767 } = await v_1c6d94();
      const v_ea6dff = v_275767.find((v_e2a85c) => v_e2a85c.id === v_b474da) ?? null;
      v_2ea5dd(v_ea6dff);
      if (!v_ea6dff) v_e9cfc6(`상품 ${v_b474da} 을 Play Console 에서 불러오지 못했습니다.`);
    } catch (v_49263d) {
      v_e9cfc6(`상품 로드 실패: ${String(v_49263d)}`);
    } finally {
      v_34a50a(false);
    }
  }, []);

  v_c4deb2(() => {
    if (!v_2adf43) {
      v_34a50a(false);
      return;
    }
    const v_a983d4 = v_54ca39({
      onSuccess: (v_9af408) => {
        v_b4f1d2(false);
        v_e9cfc6(`구매 성공! 상품: ${v_9af408} — 서버 반영 대기 후 잔고 새로고침`);
        setTimeout(() => void v_d3ded9(), 1500);
      },
      onError: (v_49263d) => {
        v_b4f1d2(false);
        v_e9cfc6(`구매 실패: ${String(v_49263d)}`);
      },
    });
    void v_58a9a8();
    void v_d3ded9();
    return () => {
      v_a983d4?.();
      void v_ad3c15();
    };

  }, []);

  v_cf763b(v_de06a3(() => { void v_d3ded9(); }, [v_d3ded9]));

  const v_b52583 = v_de06a3(async () => {
    if (!v_2ca7e0) {
      v_889fad("로그인 필요", "결제하려면 먼저 로그인해 주세요.");
      return;
    }
    v_b4f1d2(true);
    v_e9cfc6("결제 창을 여는 중...");
    try {
      await v_e02ccf(v_b474da);

    } catch (v_49263d) {
      v_b4f1d2(false);
      v_e9cfc6(`구매 요청 실패: ${String(v_49263d)}`);
    }
  }, [v_2ca7e0]);

  if (!v_2adf43) {
    return (
      <SafeView backgroundColor={v_1bfbd0.zinc50}>
        <PageHeader title="크레딧 충전" />
        <View style={v_d81136.placeholderWrap}>
          <Text style={v_d81136.placeholderTitle}>준비 중</Text>
          <Text style={v_d81136.placeholderDesc}>
            크레딧 충전 기능은 곧 오픈됩니다.
          </Text>
        </View>
      </SafeView>
    );
  }

  return (
    <SafeView backgroundColor={v_1bfbd0.zinc50}>
      <PageHeader title="크레딧 충전 (테스트)" />
      <ScrollView contentContainerStyle={v_d81136.container}>
        <View style={v_d81136.balanceCard}>
          <Text style={v_d81136.balanceLabel}>현재 잔액</Text>
          <Text style={v_d81136.balanceValue}>
            {v_c88e9b ? `${(v_c88e9b.totalSec ?? 0).toLocaleString()} 크레딧` : "-"}
          </Text>
          {v_c88e9b ? (
            <Text style={v_d81136.balanceSub}>
              무료 {v_c88e9b.freeSec ?? 0} · 구독 {v_c88e9b.subSec ?? 0} · 충전 {v_c88e9b.topupSec ?? 0}
            </Text>
          ) : null}
        </View>

        {v_683210 ? (
          <ActivityIndicator size="large" color={v_1bfbd0.zinc700} style={{ marginTop: 40 }} />
        ) : v_01bee9 ? (
          <View style={v_d81136.productCard}>
            <Text style={v_d81136.productName}>{v_01bee9.title || "크레딧 1,000"}</Text>
            <Text style={v_d81136.productDesc}>{v_01bee9.description || "약 16분 40초 통화 분량"}</Text>
            <Text style={v_d81136.productPrice}>{v_01bee9.displayPrice || v_01bee9.price || "가격 확인 중"}</Text>
            <TouchableOpacity
              style={[v_d81136.buyBtn, v_3f8465 && v_d81136.buyBtnDisabled]}
              onPress={v_b52583}
              disabled={v_3f8465}
            >
              <Text style={v_d81136.buyBtnText}>{v_3f8465 ? "처리 중..." : "구매하기"}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={v_d81136.errorCard}>
            <Text style={v_d81136.errorText}>{v_badeaf || "상품을 불러올 수 없습니다."}</Text>
            <TouchableOpacity style={v_d81136.retryBtn} onPress={v_58a9a8}>
              <Text style={v_d81136.retryText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        )}

        {v_badeaf && v_01bee9 ? <Text style={v_d81136.msg}>{v_badeaf}</Text> : null}

        <Text style={v_d81136.hint}>
          플랫폼: {v_326be8.OS} · 테스트 상품 ID: {v_b474da}
        </Text>
      </ScrollView>
    </SafeView>
  );
}

const v_d81136 = v_472849.create({
  container: { padding: v_9b1a04.medium, gap: v_9b1a04.medium },
  balanceCard: {
    backgroundColor: v_1bfbd0.white,
    borderRadius: v_8b0c90.md,
    padding: v_9b1a04.medium,
    alignItems: "center",
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
  },
  balanceLabel: { fontSize: 13, color: v_1bfbd0.zinc600 },
  balanceValue: { fontSize: 28, fontWeight: "800", color: v_1bfbd0.zinc900, marginTop: 4 },
  balanceSub: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 4 },
  productCard: {
    backgroundColor: v_1bfbd0.white,
    borderRadius: v_8b0c90.md,
    padding: v_9b1a04.medium,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
  },
  productName: { fontSize: 18, fontWeight: "700", color: v_1bfbd0.zinc900 },
  productDesc: { fontSize: 13, color: v_1bfbd0.zinc600, marginTop: 6 },
  productPrice: { fontSize: 24, fontWeight: "800", color: v_1bfbd0.zinc900, marginTop: 12 },
  buyBtn: {
    backgroundColor: "#2563eb",
    borderRadius: v_8b0c90.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  buyBtnDisabled: { opacity: 0.5 },
  buyBtnText: { color: v_1bfbd0.white, fontSize: 16, fontWeight: "700" },
  errorCard: {
    backgroundColor: v_1bfbd0.white,
    borderRadius: v_8b0c90.md,
    padding: v_9b1a04.medium,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    alignItems: "center",
  },
  errorText: { fontSize: 14, color: v_1bfbd0.zinc700, textAlign: "center" },
  retryBtn: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: v_1bfbd0.zinc200, borderRadius: v_8b0c90.md },
  retryText: { color: v_1bfbd0.zinc900, fontWeight: "600" },
  msg: { fontSize: 12, color: v_1bfbd0.zinc600, textAlign: "center", paddingHorizontal: 16 },
  hint: { fontSize: 11, color: v_1bfbd0.zinc500, textAlign: "center", marginTop: 20 },
  placeholderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  placeholderTitle: { fontSize: 22, fontWeight: "700", color: v_1bfbd0.zinc900 },
  placeholderDesc: { fontSize: 14, color: v_1bfbd0.zinc600, textAlign: "center" },
});
