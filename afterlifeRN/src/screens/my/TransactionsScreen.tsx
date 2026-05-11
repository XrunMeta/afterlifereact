

import v_a3453e, { v_de06a3, v_c4deb2, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_39a996,
  v_6c4f62,
  v_cf9c33,
  v_122070,
} from "rcmrninabrnb";
import { v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import { v_772971 } from "jmpfvteuuztnp";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0, v_8b0c90 } from "../../components/constants";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_2a15d8, type v_42880a } from "../../api/payments";

function v_9f7632(v_6fc191): string {
  const v_d5dda0 = new Date(v_6fc191.includes("T") ? v_6fc191 : v_6fc191.replace(" ", "T") + "Z");
  if (Number.isNaN(v_d5dda0.getTime())) return v_6fc191;
  const v_3ee5fb = (v_f4e98d) => String(v_f4e98d).padStart(2, "0");
  return `${v_d5dda0.getFullYear()}-${v_3ee5fb(v_d5dda0.getMonth() + 1)}-${v_3ee5fb(v_d5dda0.getDate())} ${v_3ee5fb(v_d5dda0.getHours())}:${v_3ee5fb(v_d5dda0.getMinutes())}`;
}

export default function v_9e01f7() {
  const { t: v_8d41d7 } = v_772971();
  const v_c65f5d = v_ada615();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);

  const [v_4622b9, v_fa923c] = v_5ab095<v_42880a[]>([]);
  const [v_683210, v_34a50a] = v_5ab095(true);
  const [v_612e9f, v_575aad] = v_5ab095(false);

  const v_f6f5de = v_de06a3(async () => {
    if (!v_2ca7e0) {
      v_34a50a(false);
      return;
    }
    try {
      const v_cb35cb = await v_2a15d8(v_2ca7e0, { limit: 100 });
      v_fa923c(v_cb35cb.items);
    } catch (v_49263d) {
      console.warn("[Transactions] fetch failed:", v_49263d);
    } finally {
      v_34a50a(false);
      v_575aad(false);
    }
  }, [v_2ca7e0]);

  v_c4deb2(() => {
    void v_f6f5de();
  }, [v_f6f5de]);

  const v_d5345f = () => {
    v_575aad(true);
    void v_f6f5de();
  };

  return (
    <SafeScrollView
      backgroundColor={v_1bfbd0.white}
      showBottomBackground={false}
      refreshControl={<RefreshControl refreshing={v_612e9f} onRefresh={v_d5345f} />}
    >
      <PageHeader
        title="전체 거래 내역"
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />

      <View style={v_fd5f43.content}>
        {v_683210 ? (
          <View style={v_fd5f43.center}>
            <ActivityIndicator color={v_1bfbd0.zinc500} />
          </View>
        ) : v_4622b9.length === 0 ? (
          <View style={v_fd5f43.center}>
            <Text style={v_fd5f43.empty}>아직 거래 내역이 없어요</Text>
          </View>
        ) : (
          <View style={v_fd5f43.card}>
            {v_4622b9.map((v_2f6fcc, v_ebec57) => {
              const v_2869c1 =
                v_2f6fcc.type === "gift_sent"
                  ? `${v_2f6fcc.cloneName ?? "페르소나"}에게 ${v_2f6fcc.giftName} 선물`
                  : `${v_2f6fcc.cloneName ?? "페르소나"}로부터 ${v_2f6fcc.giftName} 선물 수익`;
              const v_d39e5b = v_2f6fcc.amount > 0;
              return (
                <View
                  key={v_2f6fcc.id}
                  style={[v_fd5f43.row, v_ebec57 < v_4622b9.length - 1 && v_fd5f43.rowBorder]}
                >
                  {v_2f6fcc.cloneAvatarUrl ? (
                    <Image source={{ uri: v_2f6fcc.cloneAvatarUrl }} style={v_fd5f43.avatar} />
                  ) : (
                    <View style={[v_fd5f43.avatar, { backgroundColor: v_1bfbd0.zinc100 }]} />
                  )}
                  <View style={v_fd5f43.info}>
                    <Text style={v_fd5f43.label} numberOfLines={1}>
                      {v_2869c1}
                    </Text>
                    <Text style={v_fd5f43.date}>{v_9f7632(v_2f6fcc.createdAt)}</Text>
                  </View>
                  <Text style={[v_fd5f43.amount, v_d39e5b ? v_fd5f43.green : v_fd5f43.red]}>
                    {v_d39e5b ? "+" : ""}
                    {v_2f6fcc.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })}{" "}
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

const v_fd5f43 = v_472849.create({
  content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40, maxWidth: 780, alignSelf: "center", width: "100%" },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: 80 },
  empty: { fontSize: 14, color: v_1bfbd0.zinc500 },
  card: {
    backgroundColor: v_1bfbd0.white,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    borderRadius: v_8b0c90.lg,
    overflow: "hidden",
  },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: v_1bfbd0.zinc100 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  info: { flex: 1, minWidth: 0 },
  label: { fontSize: 14, fontWeight: "500", color: v_1bfbd0.zinc900, marginBottom: 2 },
  date: { fontSize: 12, color: v_1bfbd0.zinc500 },
  amount: { fontSize: 14, fontWeight: "700", marginLeft: 12 },
  green: { color: "#10b981" },
  red: { color: "#ef4444" },
});
