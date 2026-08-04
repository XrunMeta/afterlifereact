

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/common/PageHeader";
import { COLORS } from "../../components/constants";
import { useAuthStore } from "../../stores/authStore";
import { listPersons, type Person } from "../../api/persons";

function initialOf(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0) : "?";
}

const AVATAR_BG = [
  "#FEE2E2", "#FEF3C7", "#DCFCE7", "#DBEAFE", "#EDE9FE", "#FCE7F3", "#CFFAFE", "#FFEDD5",
];
function bgFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_BG[h % AVATAR_BG.length];
}
const AVATAR_FG = [
  "#B91C1C", "#B45309", "#166534", "#1D4ED8", "#6D28D9", "#BE185D", "#0E7490", "#C2410C",
];
function fgFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_FG[h % AVATAR_FG.length];
}

export default function AcquaintanceManagementScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const accessToken = useAuthStore((s) => s.accessToken);

  const [items, setItems] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    try {
      const res = await listPersons(accessToken);
      setItems(res.items);
    } catch (err) {
      console.warn("[Acquaintance] list failed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => { void refresh(); }, [refresh]);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const onPullRefresh = useCallback(() => {
    setRefreshing(true);
    void refresh();
  }, [refresh]);

  const named = useMemo(
    () =>
      items.filter(
        (p) => p.consentState === "granted" && !!p.displayName?.trim(),
      ),
    [items],
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.white }}>
      <PageHeader
        title={t("settings.acquaintance.title", { defaultValue: "지인 관리" })}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onPullRefresh} tintColor={COLORS.zinc400} />
        }
      >
        {loading ? (
          <ActivityIndicator color={COLORS.zinc400} style={{ marginTop: 40 }} />
        ) : named.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyTitle}>
              {t("settings.acquaintance.empty", { defaultValue: "등록된 지인이 없어요" })}
            </Text>
            <Text style={s.emptySub}>
              {t("settings.acquaintance.emptySub", {
                defaultValue: "동의한 지인이 여기에 표시돼요.",
              })}
            </Text>
          </View>
        ) : (
          <>
            <Text style={s.countLabel}>
              {t("settings.acquaintance.count", {
                defaultValue: "총 {{n}}명",
                n: named.length,
              })}
            </Text>
            {named.map((item) => {
              const name = item.displayName!.trim();
              return (
                <View key={item.id} style={s.card}>
                  <View style={[s.avatar, { backgroundColor: bgFor(name) }]}>
                    <Text style={[s.avatarText, { color: fgFor(name) }]}>{initialOf(name)}</Text>
                  </View>
                  <View style={s.cardBody}>
                    <Text style={s.name} numberOfLines={1}>{name}</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  content: { padding: 20, paddingBottom: 60 },
  countLabel: {
    fontSize: 13,
    color: COLORS.zinc500,
    marginBottom: 12,
    fontWeight: "500",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: COLORS.zinc50,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarText: { fontSize: 18, fontWeight: "700" },
  cardBody: { flex: 1 },
  name: { fontSize: 15, fontWeight: "600", color: COLORS.zinc900 },
  emptyBox: { alignItems: "center", marginTop: 80, paddingHorizontal: 24 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.zinc700,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.zinc500,
    textAlign: "center",
    lineHeight: 20,
  },
});
