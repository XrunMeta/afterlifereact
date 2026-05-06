

import v_a3453e, { v_de06a3, v_c4deb2, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_9cabcb,
  v_4623af,
  v_472849,
  v_39a996,
  v_6c4f62,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import { v_772971 } from "jmpfvteuuztnp";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import v_556baf from "../../components/ui/SafeView";
import v_258c1c from "../../components/common/PageHeader";
import { v_1ed7d9 } from "../../stores/authStore";
import {
  v_9cd139,
  v_b7d6d1,
  v_8c796a,
  type v_d9bc70,
} from "../../api/notifications";
import { v_1bfbd0, v_8b0c90, v_9b1a04 } from "../../components/constants";
import type { v_8ad91b } from "../../navigation/types";

type Nav = v_390fcc<v_8ad91b>;

const TYPE_ICON: Record<string, keyof typeof v_dec439.glyphMap> = {
  invite_received: "user-plus",
  invite_accepted: "check-circle",
  share_kicked: "user-x",
  ownership_transferred: "shuffle",
};

export default function v_18ad36() {
  const v_c65f5d = v_ada615<Nav>();
  const { t: v_8d41d7 } = v_772971();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const [v_4622b9, v_fa923c] = v_5ab095<v_d9bc70[]>([]);
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
      const v_8f00b9 = await v_9cd139(v_2ca7e0, { limit: 50 });
      v_fa923c(v_8f00b9.items);
    } catch (v_49263d) {
      console.warn("[Notifications] list failed:", v_49263d);
    } finally {
      v_34a50a(false);
      v_575aad(false);
    }
  }, [v_2ca7e0]);

  v_c4deb2(() => {
    v_92fdf2();
  }, [v_92fdf2]);

  const v_8e442f = async (n: v_d9bc70) => {
    if (!v_2ca7e0) return;
    if (!v_f4e98d.isRead) {

      v_fa923c((v_ba2215) =>
        v_ba2215.map((v_23805a) => (v_23805a.id === v_f4e98d.id ? { ...v_23805a, isRead: true } : v_23805a)),
      );
      try {
        await v_8c796a(v_2ca7e0, v_f4e98d.id);
      } catch (v_49263d) {
        console.warn("[Notifications] markRead failed:", v_49263d);
      }
    }

    const v_f71b56 = (v_f4e98d.data as { url?: string } | null)?.url;
    if (v_f71b56) {
      const v_35f85c = v_f71b56.match(/^afterlife:\/\/invite\/(.+)$/);
      if (v_35f85c) {
        v_c65f5d.navigate("InviteAccept", { token: decodeURIComponent(v_35f85c[1]) });
      }
    }
  };

  const v_e3b8da = async () => {
    if (!v_2ca7e0) return;
    v_fa923c((v_ba2215) => v_ba2215.map((v_23805a) => ({ ...v_23805a, isRead: true })));
    try {
      await v_b7d6d1(v_2ca7e0);
    } catch (v_49263d) {
      console.warn("[Notifications] markAllRead failed:", v_49263d);
    }
  };

  const v_20d05d = v_4622b9.some((v_23805a) => !v_23805a.isRead);

  const v_fcf6ec = ({ item: v_8c0b26 }: { item: v_d9bc70 }) => {
    const v_9ddfab = v_754db4[v_8c0b26.type] ?? "bell";
    return (
      <TouchableOpacity
        style={[v_fd5f43.row, !v_8c0b26.isRead && v_fd5f43.rowUnread]}
        onPress={() => v_8e442f(v_8c0b26)}
        activeOpacity={0.6}
      >
        <View style={v_fd5f43.iconWrap}>
          <Feather name={v_9ddfab} size={18} color={v_1bfbd0.violet600} />
          {!v_8c0b26.isRead && <View style={v_fd5f43.unreadDot} />}
        </View>
        <View style={v_fd5f43.body}>
          {v_8c0b26.title ? <Text style={v_fd5f43.title}>{v_8c0b26.title}</Text> : null}
          {v_8c0b26.body ? (
            <Text style={v_fd5f43.text} numberOfLines={2}>
              {v_8c0b26.body}
            </Text>
          ) : null}
          <Text style={v_fd5f43.time}>{v_afaf91(v_8c0b26.createdAt, v_8d41d7)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeView backgroundColor={v_1bfbd0.zinc50}>
      <PageHeader
        title={v_8d41d7("notifications.title")}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
        rightAction={
          v_20d05d ? (
            <TouchableOpacity onPress={v_e3b8da} style={{ padding: 6 }}>
              <Text style={v_fd5f43.markAll}>{v_8d41d7("notifications.markAllRead")}</Text>
            </TouchableOpacity>
          ) : null
        }
      />
      {v_683210 ? (
        <View style={v_fd5f43.center}>
          <ActivityIndicator color={v_1bfbd0.zinc500} />
        </View>
      ) : v_4622b9.length === 0 ? (
        <View style={v_fd5f43.center}>
          <Feather name="bell-off" size={32} color={v_1bfbd0.zinc300} />
          <Text style={v_fd5f43.empty}>{v_8d41d7("notifications.empty")}</Text>
        </View>
      ) : (
        <FlatList
          data={v_4622b9}
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

function v_afaf91(v_6fc191, v_a1c815): string {
  try {
    const v_d799e2 = new Date(v_6fc191.replace(" ", "T") + "Z").getTime();
    const v_a41a1b = Date.now() - v_d799e2;
    const v_43e24b = Math.floor(v_a41a1b / 60000);
    if (v_43e24b < 1) return v_a1c815("common.now");
    if (v_43e24b < 60) return v_a1c815("common.agoMinutes", { n: v_43e24b });
    const v_1c3551 = Math.floor(v_43e24b / 60);
    if (v_1c3551 < 24) return v_a1c815("common.agoHours", { n: v_1c3551 });
    const v_d5dda0 = Math.floor(v_1c3551 / 24);
    if (v_d5dda0 < 30) return v_a1c815("common.agoDays", { n: v_d5dda0 });
    return new Date(v_d799e2).toLocaleDateString();
  } catch {
    return v_6fc191;
  }
}

const v_fd5f43 = v_472849.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  empty: { color: v_1bfbd0.zinc500, fontSize: 13 },
  markAll: { fontSize: 13, color: v_1bfbd0.violet600, fontWeight: "600" },

  row: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: v_9b1a04.large,
    paddingVertical: 14,
    backgroundColor: v_1bfbd0.white,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc100,
  },
  rowUnread: { backgroundColor: "#faf5ff" },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: v_1bfbd0.violet100,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  unreadDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: v_1bfbd0.error,
    borderWidth: 2,
    borderColor: v_1bfbd0.white,
  },
  body: { flex: 1 },
  title: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc900, marginBottom: 2 },
  text: { fontSize: 13, color: v_1bfbd0.zinc600, lineHeight: 18 },
  time: { fontSize: 11, color: v_1bfbd0.zinc400, marginTop: 6 },
});

void v_8b0c90;
