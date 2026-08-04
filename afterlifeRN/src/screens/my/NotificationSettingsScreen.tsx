

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
} from "../../lib/pushNotifications";
import { v_7bc674 } from "../../api/notifications";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_4623af } from "rcmrninabrnb";

type PrefKey =
  | "newFollower"
  | "followingActivity"
  | "reactions"
  | "promotions";

const v_5c002e = "@notif_pref:";

const v_a5887f = [
  {
    key: "newFollower",
    label: "새로운 팔로워",
    desc: "누군가가 나를 팔로우했을 때",
  },
  {
    key: "followingActivity",
    label: "팔로잉하는 멤버 소식",
    desc: "내가 팔로우한 사람이 새 클론을 만들 때",
  },
  {
    key: "reactions",
    label: "반응",
    desc: "내 클론에 좋아요·댓글·신고가 발생할 때",
  },
  {
    key: "promotions",
    label: "혜택정보 수신",
    desc: "개인 맞춤 혜택과 이벤트 소식 안내",
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
    v_950221((v_e2a85c) => ({ ...v_e2a85c, [v_b24339]: v_a448ad }));
    try {
      await v_e84827.setItem(v_5c002e + v_b24339, v_a448ad ? "1" : "0");
    } catch (v_49263d) {
      console.warn("[notifications] save pref failed:", v_49263d);
    }
  };

  const v_e44bd3 = !v_b6d66b;

  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const [v_a12759, v_c07211] = v_5ab095(false);
  const v_f40eee = async () => {
    if (!v_2ca7e0 || v_a12759) return;
    v_c07211(true);
    try {
      const v_8f00b9 = await v_7bc674(v_2ca7e0);
      if (v_8f00b9.attempted === 0) {
        v_889fad(
          "테스트 알림",
          v_8f00b9.error ?? "등록된 활성 토큰이 없습니다. 알림 권한을 다시 켜주세요.",
        );
      } else {
        const v_3ed4c3 = v_8f00b9.tickets.filter((v_8d41d7) => v_8d41d7.status === "ok").length;
        const v_3cfdfc = v_8f00b9.tickets
          .map((v_8d41d7) => `${v_8d41d7.platform}: ${v_8d41d7.status}${v_8d41d7.errorCode ? " (" + v_8d41d7.errorCode + ")" : ""}`)
          .join("\n");
        v_889fad(
          "테스트 알림 발송 결과",
          `발송 ${v_8f00b9.attempted}건 · 성공 ${v_3ed4c3}건\n\n${v_3cfdfc}\n\n몇 초 안에 알림이 도착하는지 확인해주세요.`,
        );
      }
    } catch (v_49263d) {
      v_889fad("테스트 알림", `발송 실패: ${(v_49263d as Error).message ?? String(v_49263d)}`);
    } finally {
      v_c07211(false);
    }
  };

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

        {}
        <TouchableOpacity
          onPress={v_f40eee}
          disabled={!v_b6d66b || v_a12759}
          style={[v_fd5f43.testBtn, (!v_b6d66b || v_a12759) && v_fd5f43.testBtnDisabled]}
        >
          {v_a12759 ? (
            <ActivityIndicator color={v_1bfbd0.white} />
          ) : (
            <Text style={v_fd5f43.testBtnText}>테스트 알림 보내기</Text>
          )}
        </TouchableOpacity>

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
  testBtn: {
    marginTop: 20,
    backgroundColor: v_1bfbd0.violet600,
    paddingVertical: 14,
    borderRadius: v_8b0c90.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  testBtnDisabled: { backgroundColor: v_1bfbd0.zinc300 },
  testBtnText: { color: v_1bfbd0.white, fontSize: 15, fontWeight: "600" },

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
