
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import type { MyStackParamList } from "../../navigation/types";
import SafeView from "../../components/ui/SafeView";
import PageHeader from "../../components/common/PageHeader";
import { useAuthStore } from "../../stores/authStore";
import {
  getMyReportsMade,
  getMyReportsReceived,
  type MyReportMade,
  type MyReportReceived,
} from "../../api/reports";
import { COLORS, RADIUS } from "../../components/constants";

const MADE_STATUS_META: Record<string, { color: string; bg: string; labelKey: string }> = {
  open: { color: "#1d4ed8", bg: "#dbeafe", labelKey: "reports.statusOpen" },
  reviewed: { color: "#15803d", bg: "#dcfce7", labelKey: "reports.statusReviewed" },
  actioned: { color: "#15803d", bg: "#dcfce7", labelKey: "reports.statusActioned" },
  dismissed: { color: "#64748b", bg: "#f1f5f9", labelKey: "reports.statusDismissed" },
};

const TYPE_LABEL_KEYS: Record<string, string> = {
  user: "reports.typeUser",
  clone: "reports.typeClone",
  comment: "reports.typeComment",
};

const fmt = (iso: string | null) => (iso ? iso.slice(0, 16).replace("T", " ") : "—");

export default function ReportsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<MyStackParamList, "Reports">>();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [tab, setTab] = useState<"made" | "received">(route.params?.tab ?? "made");
  const [loading, setLoading] = useState(true);

  const [made, setMade] = useState<MyReportMade[]>([]);
  const [received, setReceived] = useState<MyReportReceived[]>([]);
  const [warningCount, setWarningCount] = useState(0);
  const [suspendedUntil, setSuspendedUntil] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [m, r] = await Promise.all([
        getMyReportsMade(accessToken),
        getMyReportsReceived(accessToken),
      ]);
      setMade(m.items);
      setReceived(r.items);
      setWarningCount(r.warningCount);
      setSuspendedUntil(r.suspendedUntil);
    } catch (err) {
      console.warn("[Reports] load failed:", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    reload();
  }, [reload]);

  const isSuspended = !!suspendedUntil && new Date(suspendedUntil) > new Date();

  const renderMade = ({ item }: { item: MyReportMade }) => {
    const st = MADE_STATUS_META[item.status] ?? MADE_STATUS_META.open;
    const typeKey = TYPE_LABEL_KEYS[item.type];
    return (
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Text style={s.typeTag}>{typeKey ? t(typeKey) : t("reports.typeFallback")}</Text>
          <Text style={s.name} numberOfLines={1}>
            {item.targetName || item.targetEmail.split("@")[0] || "—"}
          </Text>
          <Text style={s.sub} numberOfLines={2}>
            {item.reason || t("reports.emptyReason")}
          </Text>
          {item.adminMessage ? (
            <Text style={s.adminMsg} numberOfLines={3}>
              {t("reports.adminPrefix", { message: item.adminMessage })}
            </Text>
          ) : null}
          <Text style={s.date}>{fmt(item.createdAt)}</Text>
        </View>
        <View style={[s.badge, { backgroundColor: st.bg }]}>
          <Text style={[s.badgeText, { color: st.color }]}>{t(st.labelKey)}</Text>
        </View>
      </View>
    );
  };

  const renderReceived = ({ item }: { item: MyReportReceived }) => {

    const title =
      item.reportType === "comment"
        ? t("reports.receivedTitleComment", { clone: item.cloneName ?? t("reports.cloneFallback") })
        : item.reportType === "clone"
        ? t("reports.receivedTitleClone", { clone: item.cloneName ?? "—" })
        : t("reports.receivedTitleUser");
    const typeKey = TYPE_LABEL_KEYS[item.reportType];
    return (
    <View style={s.row}>
      <View style={{ flex: 1 }}>
        <Text style={s.typeTag}>{typeKey ? t(typeKey) : t("reports.typeFallback")}</Text>
        <Text style={s.name}>{title}</Text>
        {item.reportType === "comment" && item.content ? (
          <Text style={s.quote} numberOfLines={2}>
            “{item.content}”
          </Text>
        ) : null}
        {item.adminMessage || item.warningReason ? (
          <Text style={s.adminMsg} numberOfLines={3}>
            {t("reports.adminPrefix", { message: item.adminMessage || item.warningReason })}
          </Text>
        ) : null}
        <Text style={s.date}>
          {t("reports.receivedAt", { date: fmt(item.createdAt) })}
          {item.warnedAt ? ` · ${t("reports.actionedAt", { date: fmt(item.warnedAt) })}` : ""}
        </Text>
      </View>
      <View style={[s.badge, { backgroundColor: "#fef3c7" }]}>
        <Text style={[s.badgeText, { color: "#b45309" }]}>{t("reports.warningBadge")}</Text>
      </View>
    </View>
    );
  };

  return (
    <SafeView backgroundColor={COLORS.white}>
      <PageHeader title={t("reports.title")} showBackButton onBackPress={() => navigation.goBack()} />

      <View style={s.tabBar}>
        {(["made", "received"] as const).map((tk) => (
          <TouchableOpacity
            key={tk}
            style={[s.tab, tab === tk && s.tabActive]}
            onPress={() => setTab(tk)}
          >
            <Text style={[s.tabText, tab === tk && s.tabTextActive]}>
              {tk === "made" ? t("reports.tabMade") : t("reports.tabReceived")}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.zinc500} style={{ paddingTop: 60 }} />
      ) : tab === "made" ? (
        <FlatList
          data={made}
          keyExtractor={(it) => `m-${it.type}-${it.id}`}
          renderItem={renderMade}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyText}>{t("reports.emptyMade")}</Text>
            </View>
          }
          contentContainerStyle={made.length === 0 ? { flex: 1 } : { paddingVertical: 8 }}
        />
      ) : (
        <FlatList
          data={received}
          keyExtractor={(it) => `r-${it.reportType}-${it.id}`}
          renderItem={renderReceived}
          ListHeaderComponent={
            <View style={s.statusCard}>
              <Text style={s.statusTitle}>{t("reports.statusMineTitle")}</Text>
              <Text style={s.statusLine}>{t("reports.warningCount", { n: warningCount })}</Text>
              {isSuspended ? (
                <Text style={[s.statusLine, { color: "#b91c1c" }]}>
                  {t("reports.suspendedUntil", { date: fmt(suspendedUntil) })}
                </Text>
              ) : (
                <Text style={[s.statusLine, { color: "#15803d" }]}>{t("reports.notSuspended")}</Text>
              )}
            </View>
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyText}>{t("reports.emptyReceived")}</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </SafeView>
  );
}

const s = StyleSheet.create({
  tabBar: { flexDirection: "row", gap: 8, padding: 16 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    alignItems: "center",
    backgroundColor: COLORS.zinc100,
  },
  tabActive: { backgroundColor: COLORS.zinc900 },
  tabText: { fontSize: 13, fontWeight: "700", color: COLORS.zinc500 },
  tabTextActive: { color: COLORS.white },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  typeTag: { fontSize: 11, fontWeight: "700", color: COLORS.zinc400, marginBottom: 2 },
  name: { fontSize: 14, fontWeight: "600", color: COLORS.zinc900 },
  sub: { fontSize: 12, color: COLORS.zinc600, marginTop: 3 },
  quote: { fontSize: 12, color: COLORS.zinc600, marginTop: 4, fontStyle: "italic" },
  adminMsg: { fontSize: 12, color: "#b45309", marginTop: 4, lineHeight: 17 },
  date: { fontSize: 11, color: COLORS.zinc400, marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  emptyText: { color: COLORS.zinc500, fontSize: 13 },
  statusCard: {
    margin: 16,
    marginTop: 0,
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    backgroundColor: COLORS.zinc50,
  },
  statusTitle: { fontSize: 12, fontWeight: "700", color: COLORS.zinc500, marginBottom: 6 },
  statusLine: { fontSize: 14, fontWeight: "600", color: COLORS.zinc900, marginTop: 2 },
});
