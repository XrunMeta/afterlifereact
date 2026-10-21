

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
import { v_cf763b, v_ada615, v_2d8264, type v_ee3714 } from "ixigazcpvfldbecwtbvavtbi";
import { v_772971 } from "jmpfvteuuztnp";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0, v_8b0c90 } from "../../components/constants";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_889fad } from "../../stores/dialogStore";
import { v_865d38, v_a94a1b, type v_5c12dc } from "../../api/persons";
import type { v_e57140 } from "../../navigation/types";

type Nav = v_390fcc<v_e57140, "RememberingCloneDetail">;
type Rt = v_ee3714<v_e57140, "RememberingCloneDetail">;

export default function v_2b785f() {
  const v_3c9f12 = v_ada615<Nav>();
  const v_c7daf6 = v_2d8264<Rt>();
  const { t: v_8d41d7 } = v_772971();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const { cloneId: v_6e0fd3, cloneName: v_f2ff36 } = v_c7daf6.params;

  const [v_4622b9, v_fa923c] = v_5ab095<v_5c12dc[]>([]);
  const [v_683210, v_34a50a] = v_5ab095(true);
  const [v_612e9f, v_575aad] = v_5ab095(false);
  const [v_8728fe, v_efdde3] = v_5ab095<number | null>(null);

  const v_1a1b9b = v_de06a3(async () => {
    if (!v_2ca7e0) { v_34a50a(false); return; }
    try {
      const v_cb35cb = await v_865d38(v_2ca7e0, v_6e0fd3);

      v_fa923c(v_cb35cb.items.filter((v_e2a85c) => !v_e2a85c.isSelf));
    } catch (v_49263d) {
      console.warn("[RememberingCloneDetail] listPersons failed:", v_49263d);
    } finally {
      v_34a50a(false);
      v_575aad(false);
    }
  }, [v_2ca7e0, v_6e0fd3]);

  v_c4deb2(() => { void v_1a1b9b(); }, [v_1a1b9b]);
  v_cf763b(v_de06a3(() => { void v_1a1b9b(); }, [v_1a1b9b]));

  const v_9b29ab = v_de06a3(
    (person: v_5c12dc) => {
      if (!v_2ca7e0) return;
      const v_8a1355 = v_306a28.displayName ?? v_8d41d7("common.unknown", { defaultValue: "이름 없음" });
      v_889fad(
        v_8d41d7("settings.rememberingCloneDetail.revokeTitle", { defaultValue: "동의를 철회할까요?" }),
        v_8d41d7("settings.rememberingCloneDetail.revokeMessage", {
          name: v_8a1355,
          count: v_306a28.faceCount ?? 0,
          defaultValue: "{{name}} 의 얼굴 데이터 {{count}}개가 모두 삭제돼요. 되돌릴 수 없어요.",
        }),
        [
          { text: v_8d41d7("common.cancel", { defaultValue: "취소" }), style: "cancel" },
          {
            text: v_8d41d7("common.confirm", { defaultValue: "철회" }),
            style: "destructive",
            onPress: async () => {
              v_efdde3(v_306a28.id);
              try {
                await v_a94a1b(v_2ca7e0, v_306a28.id);
                v_fa923c((v_ba2215) => v_ba2215.filter((v_e2a85c) => v_e2a85c.id !== v_306a28.id));
              } catch (v_49263d) {
                const v_badeaf = v_49263d instanceof Error ? v_49263d.message : v_8d41d7("settings.rememberingCloneDetail.deleteFailed", { defaultValue: "삭제에 실패했어요." });
                v_889fad(v_8d41d7("common.error", { defaultValue: "오류" }), v_badeaf);
              } finally {
                v_efdde3(null);
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
        title={v_f2ff36 ?? v_8d41d7("settings.rememberingCloneDetail.title", { defaultValue: "얼굴 인식된 사람" })}
        showBackButton
        onBackPress={() => v_3c9f12.goBack()}
      />
      <ScrollView
        contentContainerStyle={v_fd5f43.content}
        refreshControl={
          <RefreshControl
            refreshing={v_612e9f}
            onRefresh={() => { v_575aad(true); void v_1a1b9b(); }}
          />
        }
      >
        <Text style={v_fd5f43.desc}>
          {v_8d41d7("settings.rememberingCloneDetail.desc", {
            defaultValue: "이 페르소나가 얼굴을 인식해 저장한 사람들이에요. 동의를 철회하면 그 사람의 얼굴 데이터가 모두 삭제됩니다.",
          })}
        </Text>

        {v_683210 ? (
          <ActivityIndicator style={{ marginTop: 32 }} />
        ) : v_4622b9.length === 0 ? (
          <Text style={v_fd5f43.empty}>
            {v_8d41d7("settings.rememberingCloneDetail.empty", { defaultValue: "아직 등록된 사람이 없어요." })}
          </Text>
        ) : (
          <>
            <Text style={v_fd5f43.countLabel}>
              {v_8d41d7("settings.rememberingCloneDetail.count", { count: v_4622b9.length, defaultValue: "{{count}}명" })}
            </Text>
            <View style={v_fd5f43.card}>
              {v_4622b9.map((v_306a28, v_ebec57) => (
                <View key={v_306a28.id}>
                  <View style={v_fd5f43.row}>
                    <View style={[v_fd5f43.avatar, v_fd5f43.avatarPh]}>
                      <Feather name="user" size={20} color={v_1bfbd0.zinc400} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={v_fd5f43.rowName} numberOfLines={1}>
                        {v_306a28.displayName ?? v_8d41d7("common.unknown", { defaultValue: "이름 없음" })}
                      </Text>
                      <Text style={v_fd5f43.rowSub} numberOfLines={1}>
                        {v_8d41d7("settings.rememberingCloneDetail.faceCount", {
                          count: v_306a28.faceCount ?? 0,
                          defaultValue: "얼굴 데이터 {{count}}개",
                        })}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[v_fd5f43.revokeBtn, v_8728fe === v_306a28.id && { opacity: 0.6 }]}
                      onPress={() => v_9b29ab(v_306a28)}
                      disabled={v_8728fe === v_306a28.id}
                      accessibilityRole="button"
                    >
                      {v_8728fe === v_306a28.id ? (
                        <ActivityIndicator size="small" color={v_1bfbd0.white} />
                      ) : (
                        <Text style={v_fd5f43.revokeBtnText}>
                          {v_8d41d7("settings.rememberingCloneDetail.revoke", { defaultValue: "동의 철회" })}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                  {v_ebec57 < v_4622b9.length - 1 && <View style={v_fd5f43.divider} />}
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const v_fd5f43 = v_472849.create({
  root: { flex: 1, backgroundColor: v_1bfbd0.white },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 60 },
  desc: { fontSize: 13, color: v_1bfbd0.zinc500, lineHeight: 20, marginBottom: 16 },
  countLabel: { fontSize: 13, color: v_1bfbd0.zinc500, marginBottom: 12, fontWeight: "500" },
  empty: { marginTop: 32, textAlign: "center", color: v_1bfbd0.zinc400 },
  card: {
    borderRadius: v_8b0c90.lg,
    backgroundColor: v_1bfbd0.white,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc100,
    overflow: "hidden",
  },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 14, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPh: { backgroundColor: v_1bfbd0.zinc100, alignItems: "center", justifyContent: "center" },
  rowName: { fontSize: 15, fontWeight: "600", color: v_1bfbd0.zinc900 },
  rowSub: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },
  revokeBtn: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: v_8b0c90.full,
    minWidth: 76,
    alignItems: "center",
  },
  revokeBtnText: { color: v_1bfbd0.white, fontSize: 13, fontWeight: "600" },
  divider: { height: 1, backgroundColor: v_1bfbd0.zinc100, marginLeft: 70 },
});
