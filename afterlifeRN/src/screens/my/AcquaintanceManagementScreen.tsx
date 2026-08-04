

import v_a3453e, { v_de06a3, v_c4deb2, v_5ab095 } from "bapkr";
import { v_3094a2, v_19b633, v_472849, v_122070, v_39a996 } from "rcmrninabrnb";
import { v_cf763b, v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import { v_772971 } from "jmpfvteuuztnp";
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
    <View style={{ flex: 1, backgroundColor: v_1bfbd0.white }}>
      <PageHeader
        title={v_8d41d7("settings.acquaintance.title", { defaultValue: "지인 관리" })}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />
      <ScrollView contentContainerStyle={v_fd5f43.content}>
        {v_683210 ? (
          <ActivityIndicator color={v_1bfbd0.zinc400} style={{ marginTop: 40 }} />
        ) : v_4622b9.length === 0 ? (
          <Text style={v_fd5f43.empty}>
            {v_8d41d7("settings.acquaintance.empty", { defaultValue: "등록된 지인이 없어요" })}
          </Text>
        ) : (
          v_4622b9.map((v_8c0b26) => (
            <View key={v_8c0b26.id} style={v_fd5f43.row}>
              <Text style={v_fd5f43.name} numberOfLines={1}>
                {v_8c0b26.displayName?.trim() || `Person #${v_8c0b26.id}`}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const v_fd5f43 = v_472849.create({
  content: { padding: 20, paddingBottom: 60 },
  row: {
    paddingVertical: 14,
    borderBottomWidth: v_472849.hairlineWidth,
    borderBottomColor: v_1bfbd0.zinc100,
  },
  name: { fontSize: 15, fontWeight: "600", color: v_1bfbd0.zinc900 },
  empty: { fontSize: 15, color: v_1bfbd0.zinc500, textAlign: "center", marginTop: 60 },
});
