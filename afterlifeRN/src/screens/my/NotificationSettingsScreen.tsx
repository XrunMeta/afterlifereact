

import { v_889fad } from "../../stores/dialogStore";
import v_a3453e, { v_c4deb2, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_79139e,
  v_f2c756,
  v_03e392,
  v_39a996,
} from "rcmrninabrnb";
import v_e84827 from "bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv";
import { v_ada615, v_cf763b } from "ixigazcpvfldbecwtbvavtbi";
import { v_772971 } from "jmpfvteuuztnp";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0, v_8b0c90 } from "../../components/constants";
import {
  v_11921f,
  v_704bef,
  v_9bedf5,
} from "../../lib/pushNotifications";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_67d473, v_ba1376 } from "../../api/notifications";

type PrefKey =
  | "newFollower"
  | "followingActivity"
  | "reactions"
  | "intimacy"
  | "moderation"
  | "promotions";

const v_5c002e = "@notif_pref:";

const v_a5887f = [
  {
    key: "newFollower",
    labelKey: "settings.notifications.prefs.newFollower.label",
    labelDefault: "새로운 팔로워",
    descKey: "settings.notifications.prefs.newFollower.desc",
    descDefault: "누군가가 나를 팔로우했을 때",
  },
  {
    key: "followingActivity",
    labelKey: "settings.notifications.prefs.followingActivity.label",
    labelDefault: "팔로잉하는 멤버 소식",
    descKey: "settings.notifications.prefs.followingActivity.desc",
    descDefault: "내가 팔로우한 사람이 새 클론을 만들 때",
  },
  {
    key: "reactions",
    labelKey: "settings.notifications.prefs.reactions.label",
    labelDefault: "반응",
    descKey: "settings.notifications.prefs.reactions.desc",
    descDefault: "내 클론에 좋아요·댓글·구독·선물이 발생할 때",
  },

  {
    key: "intimacy",
    labelKey: "settings.notifications.prefs.intimacy.label",
    labelDefault: "친밀도 상승",
    descKey: "settings.notifications.prefs.intimacy.desc",
    descDefault: "페르소나와의 친밀도 온도가 올랐을 때",
  },
  {
    key: "moderation",
    labelKey: "settings.notifications.prefs.moderation.label",
    labelDefault: "신고 처리 결과",
    descKey: "settings.notifications.prefs.moderation.desc",
    descDefault: "내 계정·페르소나에 대한 신고 처리 결과(경고·정지 등)",
  },
  {
    key: "promotions",
    labelKey: "settings.notifications.prefs.promotions.label",
    labelDefault: "혜택정보 수신",
    descKey: "settings.notifications.prefs.promotions.desc",
    descDefault: "개인 맞춤 혜택과 이벤트 소식 안내",
  },
];

export default function v_4036d1() {
  const v_c65f5d = v_ada615();
  const { t: v_8d41d7 } = v_772971();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const [v_b6d66b, v_a43b75] = v_5ab095(false);
  const [v_683210, v_34a50a] = v_5ab095(true);

  const [v_207650, v_950221] = v_5ab095<Record<PrefKey, boolean>>({
    newFollower: true,
    followingActivity: true,
    reactions: true,
    intimacy: true,
    moderation: true,
    promotions: true,
  });
  const [v_389da6, v_844010] = v_5ab095(false);

  const v_1a1b9b = v_a3453e.useCallback(async () => {
    v_34a50a(true);
    try {
      const v_8f00b9 = await v_11921f();
      v_a43b75(v_8f00b9.granted);
    } catch (v_49263d) {
      console.warn("[notifications] status failed:", v_49263d);
      v_a43b75(false);
    } finally {
      v_34a50a(false);
    }
  }, []);

  v_c4deb2(() => {
    (async () => {
      try {
        const v_1e6eca = await Promise.all(
          v_a5887f.map(async (v_23805a) => {
            const v_81e2ef = await v_e84827.getItem(v_5c002e + v_23805a.key);
            return [v_23805a.key, v_81e2ef === null ? true : v_81e2ef === "1"] as const;
          }),
        );
        const v_a448ad = { ...v_207650 };
        for (const [v_0eb677, v_81e2ef] of v_1e6eca) v_a448ad[v_0eb677] = v_81e2ef;
        v_950221(v_a448ad);
      } catch (v_49263d) {
        console.warn("[notifications] load prefs failed:", v_49263d);
      } finally {
        v_844010(true);
      }

      if (v_2ca7e0) {
        try {
          const v_88781f = await v_67d473(v_2ca7e0);
          v_950221(v_88781f);
          await Promise.all(
            v_a5887f.map((v_23805a) =>
              v_e84827.setItem(v_5c002e + v_23805a.key, v_88781f[v_23805a.key] ? "1" : "0"),
            ),
          );
        } catch (v_49263d) {
          console.warn("[notifications] server prefs load failed:", v_49263d);
        }
      }
    })();

  }, []);

  v_c4deb2(() => {
    v_1a1b9b();
  }, [v_1a1b9b]);

  v_cf763b(
    v_a3453e.useCallback(() => {
      v_1a1b9b();
    }, [v_1a1b9b]),
  );

  const v_bf58a4 = async (v_a448ad) => {
    if (v_a448ad) {

      try {
        const v_e43fa5 = await v_704bef();
        if (v_e43fa5.granted) {
          v_a43b75(true);

          if (v_2ca7e0) {
            void v_9bedf5(v_2ca7e0);
          }
        } else {
          v_889fad(
            v_8d41d7("settings.notifications.permTitle", { defaultValue: "권한 필요" }),
            v_8d41d7("settings.notifications.deniedHint", {
              defaultValue:
                "OS 설정에서 알림을 허용해주세요.",
            }),
            [
              { text: v_8d41d7("common.cancel", { defaultValue: "취소" }), style: "cancel" },
              {
                text: v_8d41d7("settings.notifications.openSettings", {
                  defaultValue: "설정 열기",
                }),
                onPress: () => v_f2c756.openSettings(),
              },
            ],
          );
        }
      } catch (v_49263d) {
        console.warn("[notifications] toggle on failed:", v_49263d);
      }
    } else {

      v_889fad(
        v_8d41d7("settings.notifications.offTitle", { defaultValue: "알림 끄기" }),
        v_8d41d7("settings.notifications.offHint", {
          defaultValue: "알림을 끄려면 OS 설정에서 변경해주세요.",
        }),
        [
          { text: v_8d41d7("common.cancel", { defaultValue: "취소" }), style: "cancel" },
          {
            text: v_8d41d7("settings.notifications.openSettings", {
              defaultValue: "설정 열기",
            }),
            onPress: () => v_f2c756.openSettings(),
          },
        ],
      );
    }
  };

  const v_2ee23e = async (v_b24339, v_a448ad) => {
    const v_ba2215 = v_207650[v_b24339];
    v_950221((v_e2a85c) => ({ ...v_e2a85c, [v_b24339]: v_a448ad }));
    try {
      if (v_2ca7e0) {
        const v_88781f = await v_ba1376(v_2ca7e0, { [v_b24339]: v_a448ad });
        v_950221(v_88781f);
      }
      await v_e84827.setItem(v_5c002e + v_b24339, v_a448ad ? "1" : "0");

      if (v_b24339 === "promotions" && v_a448ad && v_2ca7e0) void v_9bedf5(v_2ca7e0);
    } catch (v_49263d) {
      console.warn("[notifications] save pref failed:", v_49263d);
      v_950221((v_e2a85c) => ({ ...v_e2a85c, [v_b24339]: v_ba2215 }));
      v_889fad(
        v_8d41d7("common.error"),
        v_8d41d7("settings.notifications.saveFailed", { defaultValue: "설정을 저장하지 못했습니다. 다시 시도해 주세요." }),
      );
    }
  };

  const v_e44bd3 = !v_b6d66b;

  return (
    <SafeScrollView backgroundColor={v_1bfbd0.white} showBottomBackground={false}>
      <PageHeader
        title={v_8d41d7("settings.notifications.title", { defaultValue: "알림" })}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />

      <View style={v_fd5f43.content}>
        {}
        <View style={v_fd5f43.row}>
          <Text style={v_fd5f43.rowLabel}>
            {v_8d41d7("settings.notifications.alarm", { defaultValue: "알림" })}
          </Text>
          {v_683210 ? (
            <ActivityIndicator color={v_1bfbd0.zinc500} />
          ) : (
            <Switch
              value={v_b6d66b}
              onValueChange={v_bf58a4}
              trackColor={{ false: v_1bfbd0.zinc200, true: v_1bfbd0.violet600 }}
              thumbColor={v_1bfbd0.white}
            />
          )}
        </View>

        {}
        <View style={v_fd5f43.subCard}>
          {v_a5887f.map((v_23805a, v_ebec57) => (
            <View
              key={v_23805a.key}
              style={[v_fd5f43.subRow, v_ebec57 < v_a5887f.length - 1 && v_fd5f43.subRowBorder]}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={[v_fd5f43.subLabel, v_e44bd3 && v_fd5f43.subTextDim]}>
                  {v_8d41d7(v_23805a.labelKey, { defaultValue: v_23805a.labelDefault })}
                </Text>
                <Text style={[v_fd5f43.subDesc, v_e44bd3 && v_fd5f43.subTextDim]}>
                  {v_8d41d7(v_23805a.descKey, { defaultValue: v_23805a.descDefault })}
                </Text>
              </View>
              <Switch
                value={v_207650[v_23805a.key] && v_b6d66b}
                onValueChange={(v_81e2ef) => v_2ee23e(v_23805a.key, v_81e2ef)}
                disabled={!v_389da6 || v_e44bd3}
                trackColor={{ false: v_1bfbd0.zinc200, true: v_1bfbd0.violet600 }}
                thumbColor={v_1bfbd0.white}
              />
            </View>
          ))}
        </View>

        {

}
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: v_1bfbd0.white,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    borderRadius: v_8b0c90.lg,
  },
  rowLabel: { fontSize: 15, fontWeight: "500", color: v_1bfbd0.zinc900 },

  subCard: {
    marginTop: 12,
    backgroundColor: v_1bfbd0.white,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    borderRadius: v_8b0c90.lg,
    overflow: "hidden",
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  subRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc100,
  },
  subLabel: { fontSize: 15, fontWeight: "500", color: v_1bfbd0.zinc900 },
  subDesc: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 4 },
  subTextDim: { color: v_1bfbd0.zinc400 },
});
