
import v_a3453e, { v_de06a3, v_c4deb2, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_9cabcb,
  v_4623af,
  v_39a996,
} from "rcmrninabrnb";
import { v_ada615, v_2d8264, type v_ee3714 } from "ixigazcpvfldbecwtbvavtbi";
import type { v_e57140 } from "../../navigation/types";
import v_556baf from "../../components/ui/SafeView";
import v_258c1c from "../../components/common/PageHeader";
import { v_1ed7d9 } from "../../stores/authStore";
import {
  v_5d6789,
  v_be317d,
  type v_2a77a6,
  type v_2d86f0,
} from "../../api/reports";
import { v_1bfbd0, v_8b0c90 } from "../../components/constants";

const v_210e32 = {
  open: { label: "대기중", color: "#1d4ed8", bg: "#dbeafe" },
  reviewed: { label: "처리 완료", color: "#15803d", bg: "#dcfce7" },
  actioned: { label: "처리 완료", color: "#15803d", bg: "#dcfce7" },
  dismissed: { label: "거절", color: "#64748b", bg: "#f1f5f9" },
};

const v_a28029 = {
  user: "유저",
  clone: "페르소나",
  comment: "댓글",
};

const v_85cf93 = (v_6fc191) => (v_6fc191 ? v_6fc191.slice(0, 16).replace("T", " ") : "—");

export default function v_7e6637() {
  const v_c65f5d = v_ada615();
  const v_c7daf6 = v_2d8264<v_ee3714<v_e57140, "Reports">>();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const [v_11083e, v_94ee83] = v_5ab095<"made" | "received">(v_c7daf6.params?.tab ?? "made");
  const [v_683210, v_34a50a] = v_5ab095(true);

  const [v_51146d, v_a7d910] = v_5ab095<v_2a77a6[]>([]);
  const [v_79f454, v_588ee6] = v_5ab095<v_2d86f0[]>([]);
  const [v_e87618, v_654229] = v_5ab095(0);
  const [v_3e0055, v_b3cceb] = v_5ab095<string | null>(null);

  const v_92fdf2 = v_de06a3(async () => {
    if (!v_2ca7e0) {
      v_34a50a(false);
      return;
    }
    v_34a50a(true);
    try {
      const [v_35f85c, v_cb35cb] = await Promise.all([
        v_5d6789(v_2ca7e0),
        v_be317d(v_2ca7e0),
      ]);
      v_a7d910(v_35f85c.items);
      v_588ee6(v_cb35cb.items);
      v_654229(v_cb35cb.warningCount);
      v_b3cceb(v_cb35cb.suspendedUntil);
    } catch (v_49263d) {
      console.warn("[Reports] load failed:", v_49263d);
    } finally {
      v_34a50a(false);
    }
  }, [v_2ca7e0]);

  v_c4deb2(() => {
    v_92fdf2();
  }, [v_92fdf2]);

  const v_eb6255 = !!v_3e0055 && new Date(v_3e0055) > new Date();

  const v_757d4c = ({ item: v_8c0b26 }: { item: v_2a77a6 }) => {
    const v_72c7a6 = v_210e32[v_8c0b26.status] ?? v_210e32.open;
    return (
      <View style={v_fd5f43.row}>
        <View style={{ flex: 1 }}>
          <Text style={v_fd5f43.typeTag}>{v_a28029[v_8c0b26.type] ?? "신고"}</Text>
          <Text style={v_fd5f43.name} numberOfLines={1}>
            {v_8c0b26.targetName || v_8c0b26.targetEmail.split("@")[0] || "—"}
          </Text>
          <Text style={v_fd5f43.sub} numberOfLines={2}>
            {v_8c0b26.reason || "(사유 없음)"}
          </Text>
          {v_8c0b26.adminMessage ? (
            <Text style={v_fd5f43.adminMsg} numberOfLines={3}>
              관리자: {v_8c0b26.adminMessage}
            </Text>
          ) : null}
          <Text style={v_fd5f43.date}>{v_85cf93(v_8c0b26.createdAt)}</Text>
        </View>
        <View style={[v_fd5f43.badge, { backgroundColor: v_72c7a6.bg }]}>
          <Text style={[v_fd5f43.badgeText, { color: v_72c7a6.color }]}>{v_72c7a6.label}</Text>
        </View>
      </View>
    );
  };

  const v_30f616 = ({ item: v_8c0b26 }: { item: v_2d86f0 }) => (
    <View style={v_fd5f43.row}>
      <View style={{ flex: 1 }}>
        <Text style={v_fd5f43.typeTag}>{v_a28029[v_8c0b26.reportType] ?? "신고"}</Text>
        <Text style={v_fd5f43.name}>
          {v_a28029[v_8c0b26.reportType] ?? ""} 신고가 수락되어 조치됐어요
        </Text>
        {v_8c0b26.adminMessage || v_8c0b26.warningReason ? (
          <Text style={v_fd5f43.adminMsg} numberOfLines={3}>
            관리자: {v_8c0b26.adminMessage || v_8c0b26.warningReason}
          </Text>
        ) : null}
        <Text style={v_fd5f43.date}>
          접수 {v_85cf93(v_8c0b26.createdAt)}
          {v_8c0b26.warnedAt ? ` · 조치 ${v_85cf93(v_8c0b26.warnedAt)}` : ""}
        </Text>
      </View>
      <View style={[v_fd5f43.badge, { backgroundColor: "#fef3c7" }]}>
        <Text style={[v_fd5f43.badgeText, { color: "#b45309" }]}>경고</Text>
      </View>
    </View>
  );

  return (
    <SafeView backgroundColor={v_1bfbd0.white}>
      <PageHeader title="신고" showBackButton onBackPress={() => v_c65f5d.goBack()} />

      <View style={v_fd5f43.tabBar}>
        {(["made", "received"] as const).map((v_9edd60) => (
          <TouchableOpacity
            key={v_9edd60}
            style={[v_fd5f43.tab, v_11083e === v_9edd60 && v_fd5f43.tabActive]}
            onPress={() => v_94ee83(v_9edd60)}
          >
            <Text style={[v_fd5f43.tabText, v_11083e === v_9edd60 && v_fd5f43.tabTextActive]}>
              {v_9edd60 === "made" ? "신고 관리" : "신고당한 내역"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {v_683210 ? (
        <ActivityIndicator color={v_1bfbd0.zinc500} style={{ paddingTop: 60 }} />
      ) : v_11083e === "made" ? (
        <FlatList
          data={v_51146d}
          keyExtractor={(v_23805a) => `m-${v_23805a.type}-${v_23805a.id}`}
          renderItem={v_757d4c}
          ListEmptyComponent={
            <View style={v_fd5f43.empty}>
              <Text style={v_fd5f43.emptyText}>접수한 신고가 없어요</Text>
            </View>
          }
          contentContainerStyle={v_51146d.length === 0 ? { flex: 1 } : { paddingVertical: 8 }}
        />
      ) : (
        <FlatList
          data={v_79f454}
          keyExtractor={(v_23805a) => `r-${v_23805a.reportType}-${v_23805a.id}`}
          renderItem={v_30f616}
          ListHeaderComponent={
            <View style={v_fd5f43.statusCard}>
              <Text style={v_fd5f43.statusTitle}>내 상태</Text>
              <Text style={v_fd5f43.statusLine}>받은 경고 {v_e87618}회</Text>
              {v_eb6255 ? (
                <Text style={[v_fd5f43.statusLine, { color: "#b91c1c" }]}>
                  활동 정지 중 (~{v_85cf93(v_3e0055)}) — 페르소나 생성이 제한돼요
                </Text>
              ) : (
                <Text style={[v_fd5f43.statusLine, { color: "#15803d" }]}>활동 정지 없음</Text>
              )}
            </View>
          }
          ListEmptyComponent={
            <View style={v_fd5f43.empty}>
              <Text style={v_fd5f43.emptyText}>관리자가 조치한 신고가 없어요</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </SafeView>
  );
}

const v_fd5f43 = v_472849.create({
  tabBar: { flexDirection: "row", gap: 8, padding: 16 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: v_8b0c90.md,
    alignItems: "center",
    backgroundColor: v_1bfbd0.zinc100,
  },
  tabActive: { backgroundColor: v_1bfbd0.zinc900 },
  tabText: { fontSize: 13, fontWeight: "700", color: v_1bfbd0.zinc500 },
  tabTextActive: { color: v_1bfbd0.white },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc100,
  },
  typeTag: { fontSize: 11, fontWeight: "700", color: v_1bfbd0.zinc400, marginBottom: 2 },
  name: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc900 },
  sub: { fontSize: 12, color: v_1bfbd0.zinc600, marginTop: 3 },
  adminMsg: { fontSize: 12, color: "#b45309", marginTop: 4, lineHeight: 17 },
  date: { fontSize: 11, color: v_1bfbd0.zinc400, marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  emptyText: { color: v_1bfbd0.zinc500, fontSize: 13 },
  statusCard: {
    margin: 16,
    marginTop: 0,
    padding: 14,
    borderRadius: v_8b0c90.lg,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    backgroundColor: v_1bfbd0.zinc50,
  },
  statusTitle: { fontSize: 12, fontWeight: "700", color: v_1bfbd0.zinc500, marginBottom: 6 },
  statusLine: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc900, marginTop: 2 },
});
