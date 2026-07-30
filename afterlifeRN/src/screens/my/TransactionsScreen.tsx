

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import SafeScrollView from "../../components/ui/SafeScrollView";
import PageHeader from "../../components/common/PageHeader";
import { COLORS, RADIUS } from "../../components/constants";
import { useAuthStore } from "../../stores/authStore";
import { getMyTransactions, type TransactionItem } from "../../api/payments";

function fmtDate(iso: string): string {
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function TransactionsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const accessToken = useAuthStore((s) => s.accessToken);

  const [items, setItems] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    try {
      const r = await getMyTransactions(accessToken, { limit: 100 });
      setItems(r.items);
    } catch (err) {
      console.warn("[Transactions] fetch failed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    void load();
  };

  return (
    <SafeScrollView
      backgroundColor={COLORS.white}
      showBottomBackground={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <PageHeader
        title={t("transactions.title", { defaultValue: "전체 거래 내역" })}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <View style={s.content}>
        {loading ? (
          <View style={s.center}>
            <ActivityIndicator color={COLORS.zinc500} />
          </View>
        ) : items.length === 0 ? (
          <View style={s.center}>
            <Text style={s.empty}>{t("transactions.empty", { defaultValue: "아직 거래 내역이 없어요" })}</Text>
          </View>
        ) : (
          <View style={s.card}>
            {items.map((tx, i) => {
              const cloneName = tx.cloneName ?? t("transactions.cloneFallback", { defaultValue: "클론" });
              const label =
                tx.type === "gift_sent"
                  ? t("transactions.giftSentLabel", { clone: cloneName, gift: tx.giftName, defaultValue: "{{clone}}에게 {{gift}} 선물" })
                  : t("transactions.giftReceivedLabel", { clone: cloneName, gift: tx.giftName, defaultValue: "{{clone}}으로부터 {{gift}} 선물 수익" });
              const positive = tx.amount > 0;
              return (
                <View
                  key={tx.id}
                  style={[s.row, i < items.length - 1 && s.rowBorder]}
                >
                  {tx.cloneAvatarUrl ? (
                    <Image source={{ uri: tx.cloneAvatarUrl }} style={s.avatar} />
                  ) : (
                    <View style={[s.avatar, { backgroundColor: COLORS.zinc100 }]} />
                  )}
                  <View style={s.info}>
                    <Text style={s.label} numberOfLines={1}>
                      {label}
                    </Text>
                    <Text style={s.date}>{fmtDate(tx.createdAt)}</Text>
                  </View>
                  <Text style={[s.amount, positive ? s.green : s.red]}>
                    {positive ? "+" : ""}
                    {tx.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })}{" "}
                    xrun
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </SafeScrollView>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40, maxWidth: 780, alignSelf: "center", width: "100%" },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: 80 },
  empty: { fontSize: 14, color: COLORS.zinc500 },
  card: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
  },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.zinc100 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  info: { flex: 1, minWidth: 0 },
  label: { fontSize: 14, fontWeight: "500", color: COLORS.zinc900, marginBottom: 2 },
  date: { fontSize: 12, color: COLORS.zinc500 },
  amount: { fontSize: 14, fontWeight: "700", marginLeft: 12 },
  green: { color: "#10b981" },
  red: { color: "#ef4444" },
});
