

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { Product } from "react-native-iap";
import SafeView from "../../components/ui/SafeView";
import PageHeader from "../../components/common/PageHeader";
import { COLORS, RADIUS, SIZES } from "../../components/constants";
import { useAuthStore } from "../../stores/authStore";
import { getCreditBalance, type CreditBalance } from "../../api/credits";
import { showAlert } from "../../stores/dialogStore";
import {
  initIap,
  shutdownIap,
  fetchAllProducts,
  buyConsumable,
  registerPurchaseListeners,
} from "../../lib/iap";

const TEST_SKU = "credits_1000";
const IAP_ALLOWED_EMAILS = new Set(["oth-user@example.invalid"]);

export default function PurchaseScreen() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const apiUser = useAuthStore((s) => s.apiUser);
  const iapAllowed = IAP_ALLOWED_EMAILS.has(apiUser?.email ?? "");
  const [product, setProduct] = useState<Product | null>(null);
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const refreshBalance = useCallback(async () => {
    if (!accessToken) return;
    try {
      const b = await getCreditBalance(accessToken);
      setBalance(b);
    } catch (err) {
      console.warn("[Purchase] balance fetch failed:", err);
    }
  }, [accessToken]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      await initIap();
      const { consumables } = await fetchAllProducts();
      const found = consumables.find((p) => p.id === TEST_SKU) ?? null;
      setProduct(found);
      if (!found) setMsg(`상품 ${TEST_SKU} 을 Play Console 에서 불러오지 못했습니다.`);
    } catch (err) {
      setMsg(`상품 로드 실패: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!iapAllowed) {
      setLoading(false);
      return;
    }
    const cleanup = registerPurchaseListeners({
      onSuccess: (productId) => {
        setBusy(false);
        setMsg(`구매 성공! 상품: ${productId} — 서버 반영 대기 후 잔고 새로고침`);
        setTimeout(() => void refreshBalance(), 1500);
      },
      onError: (err) => {
        setBusy(false);
        setMsg(`구매 실패: ${String(err)}`);
      },
    });
    void loadProducts();
    void refreshBalance();
    return () => {
      cleanup?.();
      void shutdownIap();
    };

  }, []);

  useFocusEffect(useCallback(() => { void refreshBalance(); }, [refreshBalance]));

  const handleBuy = useCallback(async () => {
    if (!accessToken) {
      showAlert("로그인 필요", "결제하려면 먼저 로그인해 주세요.");
      return;
    }
    setBusy(true);
    setMsg("결제 창을 여는 중...");
    try {
      await buyConsumable(TEST_SKU);

    } catch (err) {
      setBusy(false);
      setMsg(`구매 요청 실패: ${String(err)}`);
    }
  }, [accessToken]);

  if (!iapAllowed) {
    return (
      <SafeView backgroundColor={COLORS.zinc50}>
        <PageHeader title="크레딧 충전" />
        <View style={styles.placeholderWrap}>
          <Text style={styles.placeholderTitle}>준비 중</Text>
          <Text style={styles.placeholderDesc}>
            크레딧 충전 기능은 곧 오픈됩니다.
          </Text>
        </View>
      </SafeView>
    );
  }

  return (
    <SafeView backgroundColor={COLORS.zinc50}>
      <PageHeader title="크레딧 충전 (테스트)" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>현재 잔액</Text>
          <Text style={styles.balanceValue}>
            {balance ? `${balance.credits.toLocaleString()} 크레딧` : "-"}
          </Text>
          {balance ? (
            <Text style={styles.balanceSub}>
              무료 {balance.credits_free ?? 0} · 구독 {balance.credits_sub ?? 0} · 충전 {balance.credits_topup ?? 0}
            </Text>
          ) : null}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.zinc700} style={{ marginTop: 40 }} />
        ) : product ? (
          <View style={styles.productCard}>
            <Text style={styles.productName}>{product.title || "크레딧 1,000"}</Text>
            <Text style={styles.productDesc}>{product.description || "약 16분 40초 통화 분량"}</Text>
            <Text style={styles.productPrice}>{product.displayPrice || product.price || "가격 확인 중"}</Text>
            <TouchableOpacity
              style={[styles.buyBtn, busy && styles.buyBtnDisabled]}
              onPress={handleBuy}
              disabled={busy}
            >
              <Text style={styles.buyBtnText}>{busy ? "처리 중..." : "구매하기"}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{msg || "상품을 불러올 수 없습니다."}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadProducts}>
              <Text style={styles.retryText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        )}

        {msg && product ? <Text style={styles.msg}>{msg}</Text> : null}

        <Text style={styles.hint}>
          플랫폼: {Platform.OS} · 테스트 상품 ID: {TEST_SKU}
        </Text>
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  container: { padding: SIZES.medium, gap: SIZES.medium },
  balanceCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SIZES.medium,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.zinc200,
  },
  balanceLabel: { fontSize: 13, color: COLORS.zinc600 },
  balanceValue: { fontSize: 28, fontWeight: "800", color: COLORS.zinc900, marginTop: 4 },
  balanceSub: { fontSize: 12, color: COLORS.zinc500, marginTop: 4 },
  productCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SIZES.medium,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
  },
  productName: { fontSize: 18, fontWeight: "700", color: COLORS.zinc900 },
  productDesc: { fontSize: 13, color: COLORS.zinc600, marginTop: 6 },
  productPrice: { fontSize: 24, fontWeight: "800", color: COLORS.zinc900, marginTop: 12 },
  buyBtn: {
    backgroundColor: "#2563eb",
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  buyBtnDisabled: { opacity: 0.5 },
  buyBtnText: { color: COLORS.white, fontSize: 16, fontWeight: "700" },
  errorCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SIZES.medium,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    alignItems: "center",
  },
  errorText: { fontSize: 14, color: COLORS.zinc700, textAlign: "center" },
  retryBtn: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: COLORS.zinc200, borderRadius: RADIUS.md },
  retryText: { color: COLORS.zinc900, fontWeight: "600" },
  msg: { fontSize: 12, color: COLORS.zinc600, textAlign: "center", paddingHorizontal: 16 },
  hint: { fontSize: 11, color: COLORS.zinc500, textAlign: "center", marginTop: 20 },
  placeholderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  placeholderTitle: { fontSize: 22, fontWeight: "700", color: COLORS.zinc900 },
  placeholderDesc: { fontSize: 14, color: COLORS.zinc600, textAlign: "center" },
});
