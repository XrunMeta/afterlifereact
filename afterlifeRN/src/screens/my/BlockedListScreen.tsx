
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
import { v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import v_556baf from "../../components/ui/SafeView";
import v_258c1c from "../../components/common/PageHeader";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_dbedc9, v_c0dd8d, type v_b67716 } from "../../api/clones";
import { v_1bfbd0, v_8b0c90, v_9b1a04 } from "../../components/constants";

export default function v_65df53() {
  const v_c65f5d = v_ada615();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const [v_4622b9, v_fa923c] = v_5ab095<v_b67716[]>([]);
  const [v_683210, v_34a50a] = v_5ab095(true);
  const [v_612e9f, v_575aad] = v_5ab095(false);

  const v_92fdf2 = v_de06a3(async () => {
    if (!v_2ca7e0) {
      v_fa923c([]);
      v_34a50a(false);
      v_575aad(false);
      return;
    }
    try {
      const v_8f00b9 = await v_dbedc9(v_2ca7e0);
      v_fa923c(v_8f00b9.items);
    } catch (v_49263d) {
      console.warn("[BlockedList] failed:", v_49263d);
    } finally {
      v_34a50a(false);
      v_575aad(false);
    }
  }, [v_2ca7e0]);

  v_c4deb2(() => {
    v_92fdf2();
  }, [v_92fdf2]);

  const v_55b20d = async (v_6e0fd3) => {
    if (!v_2ca7e0) return;
    try {
      await v_c0dd8d(v_2ca7e0, v_6e0fd3);
      v_fa923c((v_ba2215) => v_ba2215.filter((v_148ff6) => v_148ff6.clone.id !== v_6e0fd3));
    } catch (v_49263d) {
      console.warn("[BlockedList] unblock failed:", v_49263d);
    }
  };

  return (
    <SafeView backgroundColor={v_1bfbd0.zinc50}>
      <PageHeader
        title="차단 목록"
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />
      {v_683210 ? (
        <View style={v_fd5f43.center}>
          <ActivityIndicator color={v_1bfbd0.zinc500} />
        </View>
      ) : v_4622b9.length === 0 ? (
        <View style={v_fd5f43.center}>
          <Feather name="slash" size={32} color={v_1bfbd0.zinc300} />
          <Text style={v_fd5f43.empty}>차단한 페르소나가 없어요</Text>
        </View>
      ) : (
        <FlatList
          data={v_4622b9}
          keyExtractor={(v_23805a) => String(v_23805a.blockId)}
          renderItem={({ item: v_8c0b26 }) => (
            <View style={v_fd5f43.row}>
              {v_8c0b26.clone.avatarUrl ? (
                <Image source={{ uri: v_8c0b26.clone.avatarUrl }} style={v_fd5f43.avatar} />
              ) : (
                <View style={[v_fd5f43.avatar, v_fd5f43.avatarPh]}>
                  <Feather name="user" size={18} color={v_1bfbd0.zinc400} />
                </View>
              )}
              <View style={v_fd5f43.body}>
                <Text style={v_fd5f43.name}>{v_8c0b26.clone.name}</Text>
                <Text style={v_fd5f43.sub}>@{v_8c0b26.clone.username}</Text>
              </View>
              <TouchableOpacity style={v_fd5f43.unblockBtn} onPress={() => v_55b20d(v_8c0b26.clone.id)}>
                <Text style={v_fd5f43.unblockText}>차단 해제</Text>
              </TouchableOpacity>
            </View>
          )}
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

const v_fd5f43 = v_472849.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  empty: { color: v_1bfbd0.zinc500, fontSize: 13 },
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
  name: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc900 },
  sub: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },
  unblockBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: v_8b0c90.full,
    backgroundColor: v_1bfbd0.zinc900,
  },
  unblockText: { color: v_1bfbd0.white, fontSize: 12, fontWeight: "600" },
});
