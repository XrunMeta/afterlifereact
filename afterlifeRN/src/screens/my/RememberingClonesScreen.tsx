

import v_a3453e, { v_de06a3, v_c4deb2, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_122070,
  v_39a996,
  v_6c4f62,
  v_4623af,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_cf763b, v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import { v_772971 } from "jmpfvteuuztnp";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0, v_8b0c90 } from "../../components/constants";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_889fad } from "../../stores/dialogStore";
import {
  v_a1ba62,
  v_c63c1d,
  type v_485676,
} from "../../api/persons";

export default function v_e6afa3() {
  const v_c65f5d = v_ada615();
  const { t: v_8d41d7 } = v_772971();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);

  const [v_4622b9, v_fa923c] = v_5ab095<v_485676[]>([]);
  const [v_683210, v_34a50a] = v_5ab095(true);
  const [v_612e9f, v_575aad] = v_5ab095(false);
  const [v_3fc8d6, v_dcc631] = v_5ab095<number | null>(null);

  const v_1a1b9b = v_de06a3(async () => {
    if (!v_2ca7e0) {
      v_34a50a(false);
      return;
    }
    try {
      const v_8f00b9 = await v_a1ba62(v_2ca7e0);
      v_fa923c(v_8f00b9.clones);
    } catch (v_49263d) {
      console.warn("[RememberingClones] list failed:", v_49263d);
    } finally {
      v_34a50a(false);
      v_575aad(false);
    }
  }, [v_2ca7e0]);

  v_c4deb2(() => {
    void v_1a1b9b();
  }, [v_1a1b9b]);

  v_cf763b(
    v_de06a3(() => {
      void v_1a1b9b();
    }, [v_1a1b9b]),
  );

  const v_9bb421 = v_de06a3(
    (clone: v_485676) => {
      if (!v_2ca7e0) return;
      v_889fad(
        v_8d41d7("settings.rememberingClones.deleteConfirmTitle", { defaultValue: "기억을 지울까요?" }),
        v_8d41d7("settings.rememberingClones.deleteConfirmMessage", {
          defaultValue: `${v_eb25ce.name} 이(가) 나를 기억하는 내용과 얼굴 정보가 모두 삭제돼요. 되돌릴 수 없어요.`,
        }),
        [
          { text: v_8d41d7("common.cancel", { defaultValue: "취소" }), style: "cancel" },
          {
            text: v_8d41d7("common.delete", { defaultValue: "삭제" }),
            style: "destructive",
            onPress: async () => {
              v_dcc631(v_eb25ce.cloneId);
              try {
                await v_c63c1d(v_2ca7e0, v_eb25ce.cloneId);
                v_fa923c((v_ba2215) => v_ba2215.filter((v_3f4e2e) => v_3f4e2e.cloneId !== v_eb25ce.cloneId));
              } catch (v_49263d) {
                const v_badeaf =
                  v_49263d instanceof Error
                    ? v_49263d.message
                    : v_8d41d7("settings.rememberingClones.deleteError", { defaultValue: "삭제에 실패했어요." });
                v_889fad(
                  v_8d41d7("settings.rememberingClones.deleteErrorTitle", { defaultValue: "삭제 실패" }),
                  v_badeaf,
                );
              } finally {
                v_dcc631(null);
              }
            },
          },
        ],
      );
    },
    [v_2ca7e0, v_8d41d7],
  );

  return (
    <View style={v_fd5f43.root}>
      <PageHeader
        title={v_8d41d7("settings.rememberingClones.title", { defaultValue: "나를 기억하는 클론" })}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />
      <ScrollView
        contentContainerStyle={v_fd5f43.content}
        refreshControl={
          <RefreshControl
            refreshing={v_612e9f}
            onRefresh={() => {
              v_575aad(true);
              void v_1a1b9b();
            }}
          />
        }
      >
        {v_683210 ? (
          <ActivityIndicator style={{ marginTop: 32 }} />
        ) : v_4622b9.length === 0 ? (
          <Text style={v_fd5f43.empty}>
            {v_8d41d7("settings.rememberingClones.empty", {
              defaultValue: "아직 나를 기억하는 클론이 없어요.",
            })}
          </Text>
        ) : (
          <View style={v_fd5f43.card}>
            {v_4622b9.map((v_eb25ce, v_ebec57) => (
              <View key={v_eb25ce.cloneId}>
                <View style={v_fd5f43.row}>
                  <View style={[v_fd5f43.avatar, v_fd5f43.avatarPh]}>
                    <Feather name="user" size={20} color={v_1bfbd0.zinc400} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={v_fd5f43.rowName} numberOfLines={1}>
                      {v_eb25ce.name}
                    </Text>
                    <Text style={v_fd5f43.rowSub} numberOfLines={1}>
                      @{v_eb25ce.username}
                    </Text>
                  </View>
                  <TouchableOpacity
                    testID={`remembering-delete-${v_eb25ce.cloneId}`}
                    style={[v_fd5f43.deleteBtn, v_3fc8d6 === v_eb25ce.cloneId && { opacity: 0.6 }]}
                    onPress={() => v_9bb421(v_eb25ce)}
                    disabled={v_3fc8d6 === v_eb25ce.cloneId}
                    accessibilityRole="button"
                  >
                    {v_3fc8d6 === v_eb25ce.cloneId ? (
                      <ActivityIndicator size="small" color={v_1bfbd0.white} />
                    ) : (
                      <Text style={v_fd5f43.deleteBtnText}>
                        {v_8d41d7("settings.rememberingClones.deleteButton", { defaultValue: "지우기" })}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
                {v_ebec57 < v_4622b9.length - 1 && <View style={v_fd5f43.divider} />}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const v_fd5f43 = v_472849.create({
  root: { flex: 1, backgroundColor: v_1bfbd0.white },
  content: { padding: 16 },
  empty: { marginTop: 32, textAlign: "center", color: v_1bfbd0.zinc400 },
  card: { backgroundColor: v_1bfbd0.white, borderRadius: v_8b0c90.lg, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarPh: { backgroundColor: v_1bfbd0.zinc100 },
  rowName: { fontSize: 15, fontWeight: "600" },
  rowSub: { fontSize: 13, color: v_1bfbd0.zinc400 },
  divider: { height: 1, backgroundColor: v_1bfbd0.zinc100 },
  deleteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: v_8b0c90.md,
    backgroundColor: v_1bfbd0.zinc900,
  },
  deleteBtnText: { color: v_1bfbd0.white, fontSize: 13, fontWeight: "600" },
});
