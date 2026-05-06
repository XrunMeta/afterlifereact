

import v_a3453e, { v_de06a3, v_c4deb2, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_9cabcb,
  v_4623af,
  v_cf9c33,
  v_39a996,
  v_6c4f62,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_ada615, v_650cfa } from "ixigazcpvfldbecwtbvavtbi";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import v_556baf from "../../components/ui/SafeView";
import v_258c1c from "../../components/common/PageHeader";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_674023, type v_0b9d48, type v_347801 } from "../../api/clones";
import { v_1bfbd0, v_8b0c90, v_9b1a04 } from "../../components/constants";
import type { v_e57140 } from "../../navigation/types";

type Nav = v_390fcc<v_e57140>;

const STATUS_META: Record<
  v_347801,
  { label: string; color: string; bg: string; icon: keyof typeof v_dec439.glyphMap }
> = {
  pending: { label: "대기", color: "#92400e", bg: "#fef3c7", icon: "clock" },
  accepted: { label: "수락", color: "#166534", bg: "#dcfce7", icon: "check-circle" },
  cancelled: { label: "취소", color: "#475569", bg: "#e2e8f0", icon: "x-circle" },
  expired: { label: "만료", color: "#991b1b", bg: "#fee2e2", icon: "alert-triangle" },
};

const FILTERS: Array<{ key: "all" | v_347801; label: string }> = [
  { key: "all", label: "전체" },
  { key: "pending", label: "대기" },
  { key: "accepted", label: "수락" },
  { key: "cancelled", label: "취소" },
  { key: "expired", label: "만료" },
];

export default function v_14fa9c() {
  const v_c65f5d = v_ada615<Nav>();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const [v_4622b9, v_fa923c] = v_5ab095<v_0b9d48[]>([]);
  const [v_683210, v_34a50a] = v_5ab095(true);
  const [v_612e9f, v_575aad] = v_5ab095(false);
  const [v_f21110, v_d217e7] = v_5ab095<"all" | v_347801>("all");

  const v_92fdf2 = v_de06a3(async () => {
    if (!v_2ca7e0) {
      v_fa923c([]);
      v_34a50a(false);
      v_575aad(false);
      return;
    }
    try {
      const v_8f00b9 = await v_674023(v_2ca7e0);
      v_fa923c(v_8f00b9.items);
    } catch (v_49263d) {
      console.warn("[InviteStatus] failed:", v_49263d);
    } finally {
      v_34a50a(false);
      v_575aad(false);
    }
  }, [v_2ca7e0]);

  v_c4deb2(() => {
    v_92fdf2();
  }, [v_92fdf2]);

  const v_e4cf17 = v_f21110 === "all" ? v_4622b9 : v_4622b9.filter((v_23805a) => v_23805a.status === v_f21110);

  const v_6ddb32 = {
    all: v_4622b9.length,
    pending: v_4622b9.filter((v_23805a) => v_23805a.status === "pending").length,
    accepted: v_4622b9.filter((v_23805a) => v_23805a.status === "accepted").length,
    cancelled: v_4622b9.filter((v_23805a) => v_23805a.status === "cancelled").length,
    expired: v_4622b9.filter((v_23805a) => v_23805a.status === "expired").length,
  };

  const v_fcf6ec = ({ item: v_8c0b26 }: { item: v_0b9d48 }) => {
    const v_ab4c96 = v_265f62[v_8c0b26.status];
    return (
      <TouchableOpacity
        style={v_fd5f43.row}
        activeOpacity={0.7}
        onPress={() => {

          v_c65f5d.getParent()?.dispatch(
            v_650cfa.navigate({
              name: "ClonesTab",
              params: { screen: "CloneInvite", params: { cloneId: v_8c0b26.clone.id } },
            }),
          );
        }}
      >
        {v_8c0b26.clone.avatarUrl ? (
          <Image source={{ uri: v_8c0b26.clone.avatarUrl }} style={v_fd5f43.avatar} />
        ) : (
          <View style={[v_fd5f43.avatar, v_fd5f43.avatarPh]}>
            <Feather name="user" size={18} color={v_1bfbd0.zinc400} />
          </View>
        )}
        <View style={v_fd5f43.body}>
          <View style={v_fd5f43.line1}>
            <Text style={v_fd5f43.cloneName} numberOfLines={1}>
              {v_8c0b26.clone.name}
            </Text>
            <View style={[v_fd5f43.badge, { backgroundColor: v_ab4c96.bg }]}>
              <Feather name={v_ab4c96.icon} size={11} color={v_ab4c96.color} />
              <Text style={[v_fd5f43.badgeText, { color: v_ab4c96.color }]}>{v_ab4c96.label}</Text>
            </View>
          </View>
          <Text style={v_fd5f43.email} numberOfLines={1}>
            {v_8c0b26.inviteEmail ?? "(이메일 없음)"}
          </Text>
          <Text style={v_fd5f43.subtle}>
            {v_197e0e(v_8c0b26)}
          </Text>
        </View>
        <Feather name="chevron-right" size={18} color={v_1bfbd0.zinc400} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeView backgroundColor={v_1bfbd0.zinc50}>
      <PageHeader
        title="초대 현황"
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />
      {}
      <View style={v_fd5f43.filterRow}>
        {v_c8b1a1.map((v_8b5cd8) => {
          const v_f8b770 = v_f21110 === v_8b5cd8.key;
          const v_7b3f91 = v_6ddb32[v_8b5cd8.key];
          return (
            <TouchableOpacity
              key={v_8b5cd8.key}
              style={[v_fd5f43.filter, v_f8b770 && v_fd5f43.filterActive]}
              onPress={() => v_d217e7(v_8b5cd8.key)}
            >
              <Text style={[v_fd5f43.filterText, v_f8b770 && v_fd5f43.filterTextActive]}>
                {v_8b5cd8.label} {v_7b3f91}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {v_683210 ? (
        <View style={v_fd5f43.center}>
          <ActivityIndicator color={v_1bfbd0.zinc500} />
        </View>
      ) : v_e4cf17.length === 0 ? (
        <View style={v_fd5f43.center}>
          <Feather name="send" size={32} color={v_1bfbd0.zinc300} />
          <Text style={v_fd5f43.empty}>
            {v_f21110 === "all" ? "아직 보낸 초대가 없어요." : `해당 상태의 초대가 없어요.`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={v_e4cf17}
          keyExtractor={(v_23805a) => String(v_23805a.id)}
          renderItem={v_fcf6ec}
          refreshControl={
            <RefreshControl
              refreshing={v_612e9f}
              onRefresh={() => {
                v_575aad(true);
                v_92fdf2();
              }}
            />
          }
          contentContainerStyle={{ paddingVertical: 8 }}
        />
      )}
    </SafeView>
  );
}

function v_bb6f37(v_6fc191): string {
  try {
    const v_8d41d7 = new Date(v_6fc191.replace(" ", "T") + "Z").getTime();
    const v_a41a1b = Date.now() - v_8d41d7;
    const v_43e24b = Math.floor(v_a41a1b / 60000);
    if (v_43e24b < 1) return "방금";
    if (v_43e24b < 60) return `${v_43e24b}분 전`;
    const v_1c3551 = Math.floor(v_43e24b / 60);
    if (v_1c3551 < 24) return `${v_1c3551}시간 전`;
    const v_d5dda0 = Math.floor(v_1c3551 / 24);
    if (v_d5dda0 < 30) return `${v_d5dda0}일 전`;
    return new Date(v_8d41d7).toLocaleDateString("ko-KR");
  } catch {
    return v_6fc191;
  }
}

function v_197e0e(it: v_0b9d48): string {
  switch (v_23805a.status) {
    case "pending":
      return `${v_bb6f37(v_23805a.createdAt)} 발송 · 미수락`;
    case "accepted":
      return `${v_23805a.usedAt ? v_bb6f37(v_23805a.usedAt) : "—"} 수락됨`;
    case "cancelled":
      return `${v_23805a.cancelledAt ? v_bb6f37(v_23805a.cancelledAt) : "—"} 취소`;
    case "expired":
      return `${v_bb6f37(v_23805a.expiresAt)} 만료`;
  }
}

const v_fd5f43 = v_472849.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  empty: { color: v_1bfbd0.zinc500, fontSize: 13 },

  filterRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: v_9b1a04.large,
    paddingVertical: 12,
    backgroundColor: v_1bfbd0.white,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc100,
  },
  filter: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: v_8b0c90.full,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    backgroundColor: v_1bfbd0.white,
  },
  filterActive: { backgroundColor: v_1bfbd0.zinc900, borderColor: v_1bfbd0.zinc900 },
  filterText: { fontSize: 12, color: v_1bfbd0.zinc600, fontWeight: "500" },
  filterTextActive: { color: v_1bfbd0.white, fontWeight: "600" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: v_9b1a04.large,
    paddingVertical: 12,
    backgroundColor: v_1bfbd0.white,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc100,
  },
  avatar: { width: 40, height: 40, borderRadius: 12 },
  avatarPh: {
    backgroundColor: v_1bfbd0.zinc100,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1 },
  line1: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  cloneName: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc900, flexShrink: 1 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: { fontSize: 11, fontWeight: "600" },
  email: { fontSize: 13, color: v_1bfbd0.zinc700 },
  subtle: { fontSize: 11, color: v_1bfbd0.zinc500, marginTop: 2 },
});
