

import v_a3453e, { v_c4deb2, v_5ab095 } from "bapkr";
import { v_39a996, v_9cabcb, v_cf9c33, v_472849, v_19b633, v_4623af, v_3094a2 } from "rcmrninabrnb";
import { v_ada615, v_650cfa } from "ixigazcpvfldbecwtbvavtbi";

import { v_d60cdf, v_7281a5 } from "../../api/clones";
import { v_1bfbd0, v_8b0c90, v_9b1a04 } from "../../components/constants";
import v_556baf from "../../components/ui/SafeView";
import { v_1ed7d9 } from "../../stores/authStore";

type Row = { id: number; name: string; avatarUrl: string | null; mine: boolean };

export default function v_755c7c() {
  const v_c65f5d = v_ada615();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const v_43e90c = v_1ed7d9((v_fd5f43) => v_fd5f43.apiUser?.id);
  const [v_18b8bf, v_586294] = v_5ab095<Row[] | null>(null);
  const [v_5e9bfe, v_3a7d09] = v_5ab095<string | null>(null);

  v_c4deb2(() => {
    if (!v_2ca7e0 || !v_43e90c) return;
    let v_2008a4 = false;
    Promise.all([
      v_d60cdf(v_2ca7e0).catch(() => ({ items: [] })),
      v_7281a5(v_2ca7e0, v_43e90c).catch(() => ({ items: [] })),
    ])
      .then(([v_1c1268, v_10387a]) => {
        if (v_2008a4) return;
        const v_b6b02f = new Map<number, Row>();
        for (const v_3f4e2e of v_1c1268.items) {
          v_b6b02f.set(v_3f4e2e.id, { id: v_3f4e2e.id, name: v_3f4e2e.name, avatarUrl: v_3f4e2e.avatarUrl ?? null, mine: true });
        }
        for (const v_3f4e2e of v_10387a.items as Array<{ id: number; name: string; avatarUrl?: string | null }>) {
          if (!v_b6b02f.has(v_3f4e2e.id)) v_b6b02f.set(v_3f4e2e.id, { id: v_3f4e2e.id, name: v_3f4e2e.name, avatarUrl: v_3f4e2e.avatarUrl ?? null, mine: false });
        }
        v_586294([...v_b6b02f.values()]);
      })
      .catch((v_9e86fd) => !v_2008a4 && v_3a7d09(String(v_9e86fd?.message ?? v_9e86fd)));
    return () => {
      v_2008a4 = true;
    };
  }, [v_2ca7e0, v_43e90c]);

  const v_207c31 = (v_cb35cb) => {
    v_c65f5d.getParent()?.dispatch(
      v_650cfa.navigate({
        name: "PreCallFaceEnroll",
        params: { cloneId: v_cb35cb.id, name: v_cb35cb.name, image: v_cb35cb.avatarUrl ?? undefined, fromSettings: true },
      }),
    );
  };

  return (
    <SafeView backgroundColor={v_1bfbd0.zinc50}>
      <View style={v_fd5f43.head}>
        <Text style={v_fd5f43.title}>얼굴 등록</Text>
        <Text style={v_fd5f43.desc}>얼굴은 페르소나마다 따로 기억해요. 등록할 페르소나를 고르세요.</Text>
      </View>
      {v_18b8bf == null && !v_5e9bfe ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={v_18b8bf ?? []}
          keyExtractor={(v_cb35cb) => String(v_cb35cb.id)}
          contentContainerStyle={v_fd5f43.list}
          ListEmptyComponent={
            <Text style={v_fd5f43.empty}>{v_5e9bfe ? `불러오지 못했어요: ${v_5e9bfe}` : "구독하거나 만든 페르소나가 없어요."}</Text>
          }
          renderItem={({ item: v_8c0b26 }) => (
            <TouchableOpacity style={v_fd5f43.row} onPress={() => v_207c31(v_8c0b26)}>
              {v_8c0b26.avatarUrl ? (
                <Image source={{ uri: v_8c0b26.avatarUrl }} style={v_fd5f43.avatar} />
              ) : (
                <View style={[v_fd5f43.avatar, v_fd5f43.avatarEmpty]} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={v_fd5f43.name}>{v_8c0b26.name}</Text>
                <Text style={v_fd5f43.sub}>{v_8c0b26.mine ? "내 페르소나" : "구독 중"}</Text>
              </View>
              <Text style={v_fd5f43.go}>등록 ›</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeView>
  );
}

const v_fd5f43 = v_472849.create({
  head: { paddingHorizontal: v_9b1a04.medium, paddingTop: v_9b1a04.medium, gap: 6 },
  title: { fontSize: 18, fontWeight: "700", color: v_1bfbd0.zinc900 },
  desc: { fontSize: 13, color: v_1bfbd0.zinc500 },
  list: { padding: v_9b1a04.medium, gap: 10 },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12, padding: 12,
    backgroundColor: v_1bfbd0.white, borderRadius: v_8b0c90.lg, borderWidth: 1, borderColor: v_1bfbd0.zinc200,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarEmpty: { backgroundColor: v_1bfbd0.zinc200 },
  name: { fontSize: 15, fontWeight: "600", color: v_1bfbd0.zinc900 },
  sub: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },
  go: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc700 },
  empty: { textAlign: "center", color: v_1bfbd0.zinc500, marginTop: 40 },
});
