

import v_a3453e, { v_c4deb2, v_5ab095 } from "bapkr";
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
import { v_650cfa, v_ada615, v_2d8264 } from "ixigazcpvfldbecwtbvavtbi";
import { v_772971 } from "jmpfvteuuztnp";
import type { v_ee3714 } from "ixigazcpvfldbecwtbvavtbi";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_8ad91b } from "../../navigation/types";
import v_556baf from "../../components/ui/SafeView";
import v_258c1c from "../../components/common/PageHeader";
import v_1a40c4 from "../../components/ui/Button";
import { v_1bfbd0, v_8b0c90, v_9b1a04 } from "../../components/constants";
import { v_1ed7d9 } from "../../stores/authStore";
import {
  v_a51300,
  v_a56a6a,
  type v_9c049b,
} from "../../api/clones";
import { v_84a859 } from "../../api/auth";

type Route = v_ee3714<v_8ad91b, "InviteAccept">;
type Nav = v_390fcc<v_8ad91b>;

export default function v_000f0a() {
  const v_c65f5d = v_ada615<Nav>();
  const { t: v_8d41d7 } = v_772971();
  const { params: v_24baff } = v_2d8264<Route>();
  const v_21cc31 = v_24baff.token;
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const v_042a8b = v_1ed7d9((v_fd5f43) => v_fd5f43.isLoggedIn);

  const [v_2ccff1, v_473e7d] = v_5ab095<v_9c049b | null>(null);
  const [v_683210, v_34a50a] = v_5ab095(true);
  const [v_5e9bfe, v_3a7d09] = v_5ab095<string | null>(null);
  const [v_9865d0, v_a4287d] = v_5ab095(false);

  v_c4deb2(() => {
    let v_2008a4 = false;
    (async () => {
      try {
        const v_8f00b9 = await v_a56a6a(v_21cc31);
        if (v_2008a4) return;
        v_473e7d(v_8f00b9);
      } catch (v_49263d) {
        if (v_2008a4) return;
        let v_badeaf = v_8d41d7("inviteAccept.acceptFailed");
        if (v_49263d instanceof v_84a859) {
          if (v_49263d.code === "NOT_FOUND") v_badeaf = v_8d41d7("inviteAccept.errorTitle");
          else if (v_49263d.code === "CONFLICT") {
            const v_35f85c = v_49263d.message;
            if (/expired/i.test(v_35f85c)) v_badeaf = v_8d41d7("inviteAccept.expired");
            else if (/cancelled/i.test(v_35f85c)) v_badeaf = v_8d41d7("inviteAccept.alreadyCancelled");
            else if (/used/i.test(v_35f85c)) v_badeaf = v_8d41d7("inviteAccept.alreadyUsed");
            else v_badeaf = v_49263d.message;
          } else {
            v_badeaf = v_49263d.message;
          }
        }
        v_3a7d09(v_badeaf);
      } finally {
        if (!v_2008a4) v_34a50a(false);
      }
    })();
    return () => {
      v_2008a4 = true;
    };
  }, [v_21cc31]);

  const v_ca868d = async () => {
    if (!v_2ca7e0 || !v_2ccff1) {
      v_03e392.alert(v_8d41d7("common.notice"), v_8d41d7("inviteAccept.loginRequired"));
      return;
    }
    v_a4287d(true);
    try {
      const v_8f00b9 = await v_a51300(v_2ca7e0, v_21cc31);
      console.log("[InviteAccept] success:", v_8f00b9);
      v_03e392.alert(v_8d41d7("inviteAccept.accepted"), v_2ccff1.clone.name, [
        {
          text: v_8d41d7("common.ok"),
          onPress: () => {

            v_c65f5d.dispatch(
              v_650cfa.reset({
                index: 0,
                routes: [
                  {
                    name: "Main",
                    state: {
                      routes: [
                        {
                          name: "ClonesTab",
                          state: {
                            routes: [
                              { name: "Dashboard" },
                              { name: "CloneDetail", params: { cloneId: v_8f00b9.cloneId } },
                            ],
                            index: 1,
                          },
                        },
                      ],
                    },
                  },
                ],
              }),
            );
          },
        },
      ]);
    } catch (v_49263d) {
      let v_badeaf = v_8d41d7("inviteAccept.acceptFailed");
      if (v_49263d instanceof v_84a859) {
        v_badeaf = v_49263d.message;
      }
      v_03e392.alert(v_8d41d7("common.error"), v_badeaf);
      v_a4287d(false);
    }
  };

  const v_a482a4 = () => {
    v_03e392.alert(v_8d41d7("inviteAccept.errorTitle"), v_8d41d7("inviteAccept.body", { name: v_2ccff1?.clone.name ?? "" }), [
      { text: v_8d41d7("common.close"), style: "cancel" },
      {
        text: v_8d41d7("common.confirm"),
        style: "destructive",
        onPress: () => v_c65f5d.goBack(),
      },
    ]);
  };

  return (
    <SafeView backgroundColor={v_1bfbd0.zinc50}>
      <PageHeader
        title={v_8d41d7("inviteAccept.title")}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />
      <View style={v_fd5f43.content}>
        {v_683210 ? (
          <ActivityIndicator color={v_1bfbd0.zinc500} style={{ marginTop: 64 }} />
        ) : v_5e9bfe ? (
          <View style={v_fd5f43.errorBox}>
            <Feather name="alert-triangle" size={48} color={v_1bfbd0.error} />
            <Text style={v_fd5f43.errorTitle}>{v_8d41d7("inviteAccept.errorTitle")}</Text>
            <Text style={v_fd5f43.errorDesc}>{v_5e9bfe}</Text>
            <TouchableOpacity style={v_fd5f43.closeBtn} onPress={() => v_c65f5d.goBack()}>
              <Text style={v_fd5f43.closeBtnText}>{v_8d41d7("common.close")}</Text>
            </TouchableOpacity>
          </View>
        ) : v_2ccff1 ? (
          <View style={v_fd5f43.card}>
            <View style={v_fd5f43.previewHeader}>
              {v_2ccff1.clone.avatarUrl ? (
                <Image source={{ uri: v_2ccff1.clone.avatarUrl }} style={v_fd5f43.avatar} />
              ) : (
                <View style={[v_fd5f43.avatar, v_fd5f43.avatarPlaceholder]}>
                  <Feather name="user" size={32} color={v_1bfbd0.zinc400} />
                </View>
              )}
              <Text style={v_fd5f43.cloneName}>{v_2ccff1.clone.name}</Text>
              <Text style={v_fd5f43.cloneUsername}>@{v_2ccff1.clone.username}</Text>
            </View>
            <View style={v_fd5f43.divider} />
            <Text style={v_fd5f43.body}>
              {v_8d41d7("inviteAccept.body", { name: v_2ccff1.clone.name })}
            </Text>
            <Text style={v_fd5f43.expires}>
              {v_8039a2(v_2ccff1.expiresAt, v_8d41d7)}
            </Text>

            {!v_042a8b && (
              <Text style={v_fd5f43.loginHint}>{v_8d41d7("inviteAccept.loginRequired")}</Text>
            )}

            <View style={v_fd5f43.actions}>
              <Button
                title={v_9865d0 ? v_8d41d7("common.loading") : v_8d41d7("inviteAccept.accept")}
                onPress={v_ca868d}
                disabled={v_9865d0 || !v_042a8b}
                variant="accent"
              />
              <Button
                title={v_8d41d7("common.cancel")}
                onPress={v_a482a4}
                disabled={v_9865d0}
                variant="ghost"
              />
            </View>
          </View>
        ) : null}
      </View>
    </SafeView>
  );
}

function v_8039a2(
  v_0b8131,
  v_8d41d7,
): string {
  try {
    const v_f900a6 = new Date(v_0b8131.replace(" ", "T") + "Z").getTime();
    const v_d799e2 = v_f900a6 - Date.now();
    if (v_d799e2 <= 0) return v_8d41d7("invite.expired");
    const v_6a53fd = Math.floor(v_d799e2 / (24 * 60 * 60 * 1000));
    const v_12ebc1 = Math.floor((v_d799e2 % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    if (v_6a53fd > 0) return v_8d41d7("invite.expiresInDays", { days: v_6a53fd, hours: v_12ebc1 });
    return v_8d41d7("invite.expiresInHours", { hours: v_12ebc1 });
  } catch {
    return "";
  }
}

const v_fd5f43 = v_472849.create({
  content: { flex: 1, padding: v_9b1a04.large },
  card: {
    backgroundColor: v_1bfbd0.white,
    borderRadius: v_8b0c90.lg,
    padding: v_9b1a04.large,
    gap: v_9b1a04.medium,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
  },
  previewHeader: { alignItems: "center", gap: 8, paddingTop: 8 },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarPlaceholder: {
    backgroundColor: v_1bfbd0.zinc100,
    alignItems: "center",
    justifyContent: "center",
  },
  cloneName: { fontSize: 18, fontWeight: "700", color: v_1bfbd0.zinc900 },
  cloneUsername: { fontSize: 13, color: v_1bfbd0.zinc500 },
  divider: { height: 1, backgroundColor: v_1bfbd0.zinc100 },
  body: { fontSize: 14, color: v_1bfbd0.zinc700, lineHeight: 22, textAlign: "center" },
  expires: { fontSize: 12, color: v_1bfbd0.zinc500, textAlign: "center" },
  loginHint: {
    fontSize: 12,
    color: v_1bfbd0.error,
    textAlign: "center",
    marginTop: 4,
  },
  actions: { gap: 8, marginTop: 8 },

  errorBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
  },
  errorTitle: { fontSize: 16, fontWeight: "700", color: v_1bfbd0.zinc900, marginTop: 8 },
  errorDesc: { fontSize: 13, color: v_1bfbd0.zinc500, textAlign: "center" },
  closeBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: v_8b0c90.lg,
    backgroundColor: v_1bfbd0.zinc900,
  },
  closeBtnText: { fontSize: 14, color: v_1bfbd0.white, fontWeight: "600" },
});
