
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
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

const MADE_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: "대기중", color: "#1d4ed8", bg: "#dbeafe" },
  reviewed: { label: "대기중", color: "#1d4ed8", bg: "#dbeafe" },
  actioned: { label: "수락됨 (조치 완료)", color: "#b45309", bg: "#fef3c7" },
  dismissed: { label: "기각", color: "#64748b", bg: "#f1f5f9" },
};

const TYPE_LABEL: Record<string, string> = {
  user: "유저",
  clone: "페르소나",
  comment: "댓글",
};

const fmt = (iso: string | null) => (iso ? iso.slice(0, 16).replace("T", " ") : "—");

export default function ReportsScreen() {
  const navigation = useNavigation();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [tab, setTab] = useState<"made" | "received">("made");
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
    const st = MADE_STATUS[item.status] ?? MADE_STATUS.open;
    return (
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Text style={s.typeTag}>{TYPE_LABEL[item.type] ?? "신고"}</Text>
          <Text style={s.name} numberOfLines={1}>
            {item.targetName || item.targetEmail.split("@")[0] || "—"}
          </Text>
          <Text style={s.sub} numberOfLines={2}>
            {item.reason || "(사유 없음)"}
          </Text>
          {item.adminMessage ? (
            <Text style={s.adminMsg} numberOfLines={3}>
              📩 관리자: {item.adminMessage}
            </Text>
          ) : null}
          <Text style={s.date}>{fmt(item.createdAt)}</Text>
        </View>
        <View style={[s.badge, { backgroundColor: st.bg }]}>
          <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
        </View>
      </View>
    );
  };

  const renderReceived = ({ item }: { item: MyReportReceived }) => (
    <View style={s.row}>
      <View style={{ flex: 1 }}>
        <Text style={s.name}>신고가 수락되어 조치됐어요</Text>
        {item.adminMessage || item.warningReason ? (
          <Text style={s.adminMsg} numberOfLines={3}>
            📩 관리자: {item.adminMessage || item.warningReason}
          </Text>
        ) : null}
        <Text style={s.date}>
          접수 {fmt(item.createdAt)}
          {item.warnedAt ? ` · 조치 ${fmt(item.warnedAt)}` : ""}
        </Text>
      </View>
      <View style={[s.badge, { backgroundColor: "#fef3c7" }]}>
        <Text style={[s.badgeText, { color: "#b45309" }]}>경고</Text>
      </View>
    </View>
  );

  return (
    <SafeView backgroundColor={COLORS.white}>
      <PageHeader title="신고" showBackButton onBackPress={() => navigation.goBack()} />

      <View style={s.tabBar}>
        {(["made", "received"] as const).map((tk) => (
          <TouchableOpacity
            key={tk}
            style={[s.tab, tab === tk && s.tabActive]}
            onPress={() => setTab(tk)}
          >
            <Text style={[s.tabText, tab === tk && s.tabTextActive]}>
              {tk === "made" ? "신고 관리" : "신고당한 내역"}
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
              <Feather name="flag" size={32} color={COLORS.zinc300} />
              <Text style={s.emptyText}>접수한 신고가 없어요</Text>
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
              <Text style={s.statusTitle}>내 상태</Text>
              <Text style={s.statusLine}>받은 경고 {warningCount}회</Text>
              {isSuspended ? (
                <Text style={[s.statusLine, { color: "#b91c1c" }]}>
                  활동 정지 중 (~{fmt(suspendedUntil)}) — 페르소나 생성이 제한돼요
                </Text>
              ) : (
                <Text style={[s.statusLine, { color: "#15803d" }]}>활동 정지 없음</Text>
              )}
            </View>
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Feather name="shield" size={32} color={COLORS.zinc300} />
              <Text style={s.emptyText}>관리자가 조치한 신고가 없어요</Text>
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
