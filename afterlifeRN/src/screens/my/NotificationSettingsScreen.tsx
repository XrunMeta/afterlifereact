

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
} from "../../lib/pushNotifications";

type PrefKey =
  | "newFollower"
  | "followingActivity"
  | "reactions"
  | "chat"
  | "promotions";

const v_5c002e = "@notif_pref:";

const v_a5887f = [
  {
    key: "newFollower",
    label: "새로운 팔로워",
    desc: "나를 팔로우 하는 멤버 안내",
  },
  {
    key: "followingActivity",
    label: "팔로잉하는 멤버 소식",
    desc: "팔로잉 멤버의 새로운 활동 안내",
  },
  {
    key: "reactions",
    label: "반응",
    desc: "좋아요 댓글",
  },
  {
    key: "chat",
    label: "채팅",
    desc: "새로운 메시지",
  },
  {
    key: "promotions",
    label: "혜택정보 수신",
    desc: "개인 맞춤 혜택과 이벤트 소식을 앱 푸시, 문자로 안내",
  },
];

export default function v_4036d1() {
  const v_c65f5d = v_ada615();
  const { t: v_8d41d7 } = v_772971();
  const [v_b6d66b, v_a43b75] = v_5ab095(false);
  const [v_683210, v_34a50a] = v_5ab095(true);

  const [v_207650, v_950221] = v_5ab095<Record<PrefKey, boolean>>({
    newFollower: true,
    followingActivity: true,
    reactions: true,
    chat: true,
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
        } else {
          v_03e392.alert(
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

      v_03e392.alert(
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
    v_950221((v_e2a85c) => ({ ...v_e2a85c, [v_b24339]: v_a448ad }));
    try {
      await v_e84827.setItem(v_5c002e + v_b24339, v_a448ad ? "1" : "0");
    } catch (v_49263d) {
      console.warn("[notifications] save pref failed:", v_49263d);
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
                  {v_23805a.label}
                </Text>
                <Text style={[v_fd5f43.subDesc, v_e44bd3 && v_fd5f43.subTextDim]}>
                  {v_23805a.desc}
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
