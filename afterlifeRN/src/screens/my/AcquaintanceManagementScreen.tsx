

import v_a3453e, { v_de06a3, v_c4deb2, v_df9f57, v_5ab095 } from "bapkr";
import { v_3094a2, v_19b633, v_472849, v_122070, v_39a996, v_6c4f62 } from "rcmrninabrnb";
import { v_cf763b, v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import { v_772971 } from "jmpfvteuuztnp";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0 } from "../../components/constants";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_865d38, type v_5c12dc } from "../../api/persons";

function v_5d366d(v_1833e7): string {
  const v_2f361a = v_1833e7.trim();
  return v_2f361a ? v_2f361a.charAt(0) : "?";
}

const v_de5089 = [
  "#FEE2E2", "#FEF3C7", "#DCFCE7", "#DBEAFE", "#EDE9FE", "#FCE7F3", "#CFFAFE", "#FFEDD5",
];
function v_9fa995(v_1833e7): string {
  let v_65a2cd = 0;
  for (let v_ebec57 = 0; v_ebec57 < v_1833e7.length; v_ebec57++) v_65a2cd = (v_65a2cd * 31 + v_1833e7.charCodeAt(v_ebec57)) >>> 0;
  return v_de5089[v_65a2cd % v_de5089.length];
}
const v_845864 = [
  "#B91C1C", "#B45309", "#166534", "#1D4ED8", "#6D28D9", "#BE185D", "#0E7490", "#C2410C",
];
function v_317493(v_1833e7): string {
  let v_65a2cd = 0;
  for (let v_ebec57 = 0; v_ebec57 < v_1833e7.length; v_ebec57++) v_65a2cd = (v_65a2cd * 31 + v_1833e7.charCodeAt(v_ebec57)) >>> 0;
  return v_845864[v_65a2cd % v_845864.length];
}

export default function v_99450d() {
  const v_c65f5d = v_ada615();
  const { t: v_8d41d7 } = v_772971();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);

  const [v_4622b9, v_fa923c] = v_5ab095<v_5c12dc[]>([]);
  const [v_683210, v_34a50a] = v_5ab095(true);
  const [v_612e9f, v_575aad] = v_5ab095(false);

  const v_1a1b9b = v_de06a3(async () => {
    if (!v_2ca7e0) {
      v_34a50a(false);
      return;
    }
    try {
      const v_8f00b9 = await v_865d38(v_2ca7e0);
      v_fa923c(v_8f00b9.items);
    } catch (v_49263d) {
      console.warn("[Acquaintance] list failed:", v_49263d);
    } finally {
      v_34a50a(false);
      v_575aad(false);
    }
  }, [v_2ca7e0]);

  v_c4deb2(() => { void v_1a1b9b(); }, [v_1a1b9b]);
  v_cf763b(v_de06a3(() => { void v_1a1b9b(); }, [v_1a1b9b]));

  const v_0cde43 = v_de06a3(() => {
    v_575aad(true);
    void v_1a1b9b();
  }, [v_1a1b9b]);

  const v_63db2f = v_df9f57(
    () =>
      v_4622b9.filter(
        (v_e2a85c) => v_e2a85c.consentState === "granted" && !!v_e2a85c.displayName?.trim(),
      ),
    [v_4622b9],
  );

  return (
    <View style={{ flex: 1, backgroundColor: v_1bfbd0.white }}>
      <PageHeader
        title={v_8d41d7("settings.acquaintance.title", { defaultValue: "지인 관리" })}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />
      <ScrollView
        contentContainerStyle={v_fd5f43.content}
        refreshControl={
          <RefreshControl refreshing={v_612e9f} onRefresh={v_0cde43} tintColor={v_1bfbd0.zinc400} />
        }
      >
        {v_683210 ? (
          <ActivityIndicator color={v_1bfbd0.zinc400} style={{ marginTop: 40 }} />
        ) : v_63db2f.length === 0 ? (
          <View style={v_fd5f43.emptyBox}>
            <Text style={v_fd5f43.emptyTitle}>
              {v_8d41d7("settings.acquaintance.empty", { defaultValue: "등록된 지인이 없어요" })}
            </Text>
            <Text style={v_fd5f43.emptySub}>
              {v_8d41d7("settings.acquaintance.emptySub", {
                defaultValue: "동의한 지인이 여기에 표시돼요.",
              })}
            </Text>
          </View>
        ) : (
          <>
            <Text style={v_fd5f43.countLabel}>
              {v_8d41d7("settings.acquaintance.count", {
                defaultValue: "총 {{n}}명",
                n: v_63db2f.length,
              })}
            </Text>
            {v_63db2f.map((v_8c0b26) => {
              const v_1833e7 = v_8c0b26.displayName!.trim();
              return (
                <View key={v_8c0b26.id} style={v_fd5f43.card}>
                  <View style={[v_fd5f43.avatar, { backgroundColor: v_9fa995(v_1833e7) }]}>
                    <Text style={[v_fd5f43.avatarText, { color: v_317493(v_1833e7) }]}>{v_5d366d(v_1833e7)}</Text>
                  </View>
                  <View style={v_fd5f43.cardBody}>
                    <Text style={v_fd5f43.name} numberOfLines={1}>{v_1833e7}</Text>
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

const v_fd5f43 = v_472849.create({
  content: { padding: 20, paddingBottom: 60 },
  countLabel: {
    fontSize: 13,
    color: v_1bfbd0.zinc500,
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
    backgroundColor: v_1bfbd0.zinc50,
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
  name: { fontSize: 15, fontWeight: "600", color: v_1bfbd0.zinc900 },
  emptyBox: { alignItems: "center", marginTop: 80, paddingHorizontal: 24 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: v_1bfbd0.zinc700,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13,
    color: v_1bfbd0.zinc500,
    textAlign: "center",
    lineHeight: 20,
  },
});
