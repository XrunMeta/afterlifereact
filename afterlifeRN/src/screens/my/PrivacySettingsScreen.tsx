

import { v_889fad } from "../../stores/dialogStore";
import v_a3453e, { v_de06a3, v_c4deb2, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
  v_39a996,
  v_cf9c33,
  v_03e392,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_cf763b, v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import { v_772971 } from "jmpfvteuuztnp";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0, v_8b0c90 } from "../../components/constants";
import type { v_e57140 } from "../../navigation/types";
import { v_1ed7d9 } from "../../stores/authStore";
import {
  v_dbedc9,
  v_c0dd8d,
  type v_b67716,
} from "../../api/clones";

export default function v_9232cf() {
  const v_c65f5d = v_ada615<v_390fcc<v_e57140>>();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const { t: v_8d41d7 } = v_772971();

  const [v_4622b9, v_fa923c] = v_5ab095<v_b67716[]>([]);
  const [v_683210, v_34a50a] = v_5ab095(true);
  const [v_5a07a2, v_169234] = v_5ab095<number | null>(null);

  const v_1a1b9b = v_de06a3(async () => {
    if (!v_2ca7e0) {
      v_fa923c([]);
      v_34a50a(false);
      return;
    }
    v_34a50a(true);
    try {
      const v_8f00b9 = await v_dbedc9(v_2ca7e0);
      v_fa923c(v_8f00b9.items);
    } catch (v_49263d) {
      console.warn("[Privacy] listMyBlocks failed:", v_49263d);
    } finally {
      v_34a50a(false);
    }
  }, [v_2ca7e0]);

  v_c4deb2(() => {
    v_1a1b9b();
  }, [v_1a1b9b]);

  v_cf763b(
    v_a3453e.useCallback(() => {
      v_1a1b9b();
    }, [v_1a1b9b]),
  );

  const v_55b20d = (item: v_b67716) => {
    v_889fad(
      "차단 해제",
      `${v_8c0b26.clone.name} 차단을 해제하시겠어요?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "해제",
          onPress: async () => {
            if (!v_2ca7e0) return;
            v_169234(v_8c0b26.clone.id);
            try {
              await v_c0dd8d(v_2ca7e0, v_8c0b26.clone.id);
              v_fa923c((v_ba2215) => v_ba2215.filter((v_148ff6) => v_148ff6.clone.id !== v_8c0b26.clone.id));
            } catch (v_49263d) {
              const v_badeaf = v_49263d instanceof Error ? v_49263d.message : "해제에 실패했어요.";
              v_889fad("오류", v_badeaf);
            } finally {
              v_169234(null);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeScrollView backgroundColor={v_1bfbd0.white} showBottomBackground={false}>
      <PageHeader
        title={v_8d41d7("settings.privacy.title")}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />

      <View style={v_fd5f43.content}>
        {v_683210 ? (
          <ActivityIndicator color={v_1bfbd0.zinc500} style={{ paddingTop: 60 }} />
        ) : v_4622b9.length === 0 ? (
          <View style={v_fd5f43.empty}>
            <Feather name="slash" size={36} color={v_1bfbd0.zinc300} />
            <Text style={v_fd5f43.emptyText}>차단한 클론이 없어요</Text>
            <Text style={v_fd5f43.emptySub}>
              클론 메뉴에서 차단할 수 있어요
            </Text>
          </View>
        ) : (
          <View style={v_fd5f43.card}>
            {v_4622b9.map((v_23805a, v_ebec57) => (
              <View key={v_23805a.blockId}>
                <View style={v_fd5f43.row}>
                  {v_23805a.clone.avatarUrl ? (
                    <Image source={{ uri: v_23805a.clone.avatarUrl }} style={v_fd5f43.avatar} />
                  ) : (
                    <View style={[v_fd5f43.avatar, v_fd5f43.avatarPh]}>
                      <Feather name="user" size={20} color={v_1bfbd0.zinc400} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={v_fd5f43.rowName} numberOfLines={1}>
                      {v_23805a.clone.name}
                    </Text>
                    <Text style={v_fd5f43.rowSub} numberOfLines={1}>
                      @{v_23805a.clone.username}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      v_fd5f43.unblockBtn,
                      v_5a07a2 === v_23805a.clone.id && { opacity: 0.6 },
                    ]}
                    onPress={() => v_55b20d(v_23805a)}
                    disabled={v_5a07a2 === v_23805a.clone.id}
                  >
                    {v_5a07a2 === v_23805a.clone.id ? (
                      <ActivityIndicator size="small" color={v_1bfbd0.white} />
                    ) : (
                      <Text style={v_fd5f43.unblockText}>차단 해제</Text>
                    )}
                  </TouchableOpacity>
                </View>
                {v_ebec57 < v_4622b9.length - 1 && <View style={v_fd5f43.divider} />}
              </View>
            ))}
          </View>
        )}
      </View>
    </SafeScrollView>
  );
}

const v_fd5f43 = v_472849.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    maxWidth: 780,
    alignSelf: "center",
    width: "100%",
  },
  card: {
    backgroundColor: v_1bfbd0.white,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    borderRadius: v_8b0c90.lg,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPh: {
    backgroundColor: v_1bfbd0.zinc100,
    alignItems: "center",
    justifyContent: "center",
  },
  rowName: { fontSize: 15, fontWeight: "600", color: v_1bfbd0.zinc900 },
  rowSub: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },
  unblockBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: v_1bfbd0.zinc900,
    minWidth: 78,
    alignItems: "center",
  },
  unblockText: { fontSize: 12, fontWeight: "700", color: v_1bfbd0.white },
  divider: { height: 1, backgroundColor: v_1bfbd0.zinc100, marginLeft: 72 },

  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyText: { color: v_1bfbd0.zinc600, fontSize: 14, fontWeight: "600" },
  emptySub: { color: v_1bfbd0.zinc400, fontSize: 12 },
});
