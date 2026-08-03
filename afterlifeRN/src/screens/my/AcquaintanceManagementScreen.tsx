

import v_a3453e, { v_de06a3, v_c4deb2, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_39a996,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_cf763b, v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import { v_772971 } from "jmpfvteuuztnp";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0 } from "../../components/constants";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_865d38, type v_5c12dc } from "../../api/persons";

export default function v_99450d() {
  const v_c65f5d = v_ada615();
  const { t: v_8d41d7 } = v_772971();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);

  const [v_4622b9, v_fa923c] = v_5ab095<v_5c12dc[]>([]);
  const [v_683210, v_34a50a] = v_5ab095(true);

  const v_1a1b9b = v_de06a3(async () => {
    if (!v_2ca7e0) {
      v_fa923c([]);
      v_34a50a(false);
      return;
    }
    try {
      const v_8f00b9 = await v_865d38(v_2ca7e0);

      v_fa923c(v_8f00b9.items.filter((v_e2a85c) => v_e2a85c.consentState === "granted"));
    } catch (v_49263d) {
      console.warn("[Acquaintance] list failed:", v_49263d);
    } finally {
      v_34a50a(false);
    }
  }, [v_2ca7e0]);

  v_c4deb2(() => { void v_1a1b9b(); }, [v_1a1b9b]);
  v_cf763b(v_de06a3(() => { void v_1a1b9b(); }, [v_1a1b9b]));

  return (
    <SafeScrollView backgroundColor={v_1bfbd0.white} showBottomBackground={false}>
      <PageHeader
        title={v_8d41d7("settings.acquaintance.title")}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />

      <View style={v_fd5f43.content}>
        {v_683210 ? (
          <View style={v_fd5f43.emptyState}>
            <ActivityIndicator color={v_1bfbd0.zinc400} />
          </View>
        ) : v_4622b9.length === 0 ? (
          <View style={v_fd5f43.emptyState}>
            <View style={v_fd5f43.emptyIcon}>
              <Feather name="users" size={40} color={v_1bfbd0.zinc300} />
            </View>
            <Text style={v_fd5f43.emptyText}>{v_8d41d7("settings.acquaintance.empty")}</Text>
          </View>
        ) : (
          v_4622b9.map((v_8c0b26, v_ebec57) => {
            const v_531384 = v_8c0b26.displayName?.trim() || `Person #${v_8c0b26.id}`;

            let v_f8e6b9 = "-";
            if (v_8c0b26.createdAt) {
              const v_d5dda0 = new Date(v_8c0b26.createdAt as unknown as string | number);
              if (!Number.isNaN(v_d5dda0.getTime())) {
                v_f8e6b9 = v_d5dda0.toLocaleDateString();
              }
            }
            const v_24c1e9 = v_8c0b26.cloneId ? `#${v_8c0b26.cloneId}` : "-";
            return (
              <View key={v_8c0b26.id}>
                <View style={v_fd5f43.row}>
                  <View style={v_fd5f43.avatar}>
                    <Feather name="user" size={20} color={v_1bfbd0.zinc400} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={v_fd5f43.name} numberOfLines={1}>{v_531384}</Text>
                    <Text style={v_fd5f43.meta} numberOfLines={1}>
                      {v_8d41d7("settings.acquaintance.metaLine", {
                        date: v_f8e6b9,
                        clone: v_24c1e9,
                        defaultValue: `동의 ${v_f8e6b9} · 클론 ${v_24c1e9}`,
                      })}
                    </Text>
                  </View>
                </View>
                {v_ebec57 < v_4622b9.length - 1 && <View style={v_fd5f43.divider} />}
              </View>
            );
          })
        )}
      </View>
    </SafeScrollView>
  );
}

const v_fd5f43 = v_472849.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    maxWidth: 780,
    alignSelf: "center",
    width: "100%",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: v_1bfbd0.zinc100,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 15, fontWeight: "600", color: v_1bfbd0.zinc900 },
  meta: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },
  divider: { height: v_472849.hairlineWidth, backgroundColor: v_1bfbd0.zinc100 },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 16,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: v_1bfbd0.zinc100,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 15,
    color: v_1bfbd0.zinc500,
    textAlign: "center",
  },
});
