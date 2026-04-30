import v_a3453e, { v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
  v_f2c756,
  v_03e392,
  v_39a996,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import { v_772971 } from "jmpfvteuuztnp";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0, v_8b0c90 } from "../../components/constants";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_5b2249 } from "../../api/payments";
import { v_84a859 } from "../../api/auth";

const v_50256d = 6;
const v_138a00 = 5;
const v_23211e = "xrun://";

export default function v_da4f91() {
  const v_c65f5d = v_ada615();
  const { t: v_8d41d7 } = v_772971();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);

  const [v_6bee94, v_240fbf] = v_5ab095("");
  const [v_5e9bfe, v_3a7d09] = v_5ab095<string | null>(null);
  const [v_0be067, v_75488d] = v_5ab095(v_138a00);
  const [v_076be5, v_b3c1a7] = v_5ab095(false);
  const [v_177bdd, v_ae32d6] = v_5ab095(false);

  const v_5ba0f2 = (v_5f701e) => {
    if (v_076be5) return;
    v_3a7d09(null);
    if (v_5f701e === "del") {
      v_240fbf((v_e2a85c) => {
        const v_a448ad = v_e2a85c.slice(0, -1);
        console.log("[PIN] del → length:", v_a448ad.length);
        return v_a448ad;
      });
      return;
    }
    if (v_6bee94.length >= v_50256d) {
      console.log("[PIN] ignored (already full)");
      return;
    }
    v_240fbf((v_e2a85c) => {
      const v_a448ad = v_e2a85c + v_5f701e;
      console.log("[PIN] press:", v_5f701e, "→ length:", v_a448ad.length);
      return v_a448ad;
    });
  };

  const v_83b05b = async () => {
    console.log("[PIN] verify clicked, len:", v_6bee94.length, "attemptsLeft:", v_0be067);
    if (v_6bee94.length !== v_50256d || v_177bdd) return;
    if (!v_2ca7e0) {
      v_03e392.alert("알림", "로그인이 필요합니다.");
      return;
    }
    v_ae32d6(true);
    try {
      const v_43c42e = await v_5b2249(v_2ca7e0, v_6bee94);
      console.log("[PIN] verify result:", v_43c42e);

      if (!v_43c42e.hasPin) {

        v_b3c1a7(true);
        return;
      }
      if (v_43c42e.match) {
        v_03e392.alert("확인", "비밀번호가 확인되었습니다.");
        v_c65f5d.goBack();
        return;
      }
      const v_a448ad = v_0be067 - 1;
      console.log("[PIN] wrong → attemptsLeft:", v_a448ad);
      v_75488d(v_a448ad);
      v_240fbf("");
      if (v_a448ad <= 0) {
        console.log("[PIN] LOCKED");
        v_b3c1a7(true);
      } else {
        v_3a7d09(v_8d41d7("settings.paymentPin.wrong"));
      }
    } catch (v_49263d) {
      console.log("[PIN] verify error:", v_49263d);
      let v_badeaf = "검증 중 오류가 발생했습니다.";
      if (v_49263d instanceof v_84a859) {
        if (v_49263d.code === "CONFLICT") v_badeaf = "xrun 회원 매핑이 안 되어 있습니다.";
        else v_badeaf = v_49263d.message;
      }
      v_3a7d09(v_badeaf);
      v_240fbf("");
    } finally {
      v_ae32d6(false);
    }
  };

  const v_44c6f8 = async () => {
    console.log("[PIN] open xrun:", v_23211e);
    const v_29eaf2 = await v_f2c756.canOpenURL(v_23211e);
    console.log("[PIN] canOpenURL:", v_29eaf2);
    if (v_29eaf2) {
      await v_f2c756.openURL(v_23211e);
    } else {
      v_03e392.alert("알림", "xrun 앱이 설치되어 있지 않습니다.");
    }
  };

  const v_d8e104 = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["", "0", "del"],
  ];

  return (
    <SafeScrollView backgroundColor={v_1bfbd0.white} showBottomBackground={false}>
      <PageHeader
        title={v_8d41d7("settings.paymentPin.title")}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />

      <View style={v_fd5f43.content}>
        {v_076be5 ? (
          <View style={v_fd5f43.lockedBox}>
            <Feather name="alert-triangle" size={48} color={v_1bfbd0.error} />
            <Text style={v_fd5f43.lockedTitle}>{v_8d41d7("settings.paymentPin.lockedTitle")}</Text>
            <Text style={v_fd5f43.lockedDesc}>{v_8d41d7("settings.paymentPin.lockedDesc")}</Text>
            <TouchableOpacity style={v_fd5f43.openBtn} onPress={v_44c6f8}>
              <Feather name="external-link" size={16} color={v_1bfbd0.white} />
              <Text style={v_fd5f43.openBtnText}>{v_8d41d7("settings.paymentPin.openXrun")}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={v_fd5f43.subtitle}>{v_8d41d7("settings.paymentPin.subtitle")}</Text>

            <View style={v_fd5f43.dotsRow}>
              {Array.from({ length: v_50256d }).map((v_37eab7, v_ebec57) => (
                <View
                  key={v_ebec57}
                  style={[v_fd5f43.dot, v_ebec57 < v_6bee94.length && v_fd5f43.dotFilled]}
                />
              ))}
            </View>

            {v_5e9bfe ? (
              <Text style={v_fd5f43.errorText}>{v_5e9bfe}</Text>
            ) : (
              <Text style={v_fd5f43.attemptsText}>
                {v_8d41d7("settings.paymentPin.attemptsLeft", { count: v_0be067 })}
              </Text>
            )}

            <View style={v_fd5f43.numpad}>
              {v_d8e104.map((v_3ac7e7, v_749a5e) => (
                <View key={v_749a5e} style={v_fd5f43.numpadRow}>
                  {v_3ac7e7.map((v_b24339, v_d354ab) => (
                    <TouchableOpacity
                      key={`${v_749a5e}-${v_d354ab}`}
                      style={[v_fd5f43.numKey, !v_b24339 && v_fd5f43.numKeyEmpty]}
                      onPress={() => v_b24339 && v_5ba0f2(v_b24339)}
                      disabled={!v_b24339}
                    >
                      {v_b24339 === "del" ? (
                        <Feather name="delete" size={22} color={v_1bfbd0.zinc900} />
                      ) : (
                        <Text style={v_fd5f43.numKeyText}>{v_b24339}</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[v_fd5f43.verifyBtn, (v_6bee94.length !== v_50256d || v_177bdd) && v_fd5f43.verifyBtnDisabled]}
              onPress={v_83b05b}
              disabled={v_6bee94.length !== v_50256d || v_177bdd}
            >
              {v_177bdd ? (
                <ActivityIndicator color={v_1bfbd0.white} />
              ) : (
                <Text style={v_fd5f43.verifyBtnText}>{v_8d41d7("settings.paymentPin.verify")}</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeScrollView>
  );
}

const v_fd5f43 = v_472849.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    maxWidth: 480,
    alignSelf: "center",
    width: "100%",
  },
  subtitle: {
    fontSize: 14,
    color: v_1bfbd0.zinc600,
    textAlign: "center",
    marginBottom: 32,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 16,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: v_1bfbd0.zinc300,
    backgroundColor: v_1bfbd0.white,
  },
  dotFilled: {
    backgroundColor: v_1bfbd0.zinc900,
    borderColor: v_1bfbd0.zinc900,
  },
  attemptsText: {
    fontSize: 12,
    color: v_1bfbd0.zinc500,
    textAlign: "center",
    marginBottom: 24,
  },
  errorText: {
    fontSize: 13,
    color: v_1bfbd0.error,
    textAlign: "center",
    marginBottom: 24,
  },
  numpad: { gap: 12, marginBottom: 24 },
  numpadRow: { flexDirection: "row", gap: 12, justifyContent: "center" },
  numKey: {
    flex: 1,
    aspectRatio: 1.6,
    maxWidth: 96,
    borderRadius: v_8b0c90.lg,
    backgroundColor: v_1bfbd0.zinc50,
    alignItems: "center",
    justifyContent: "center",
  },
  numKeyEmpty: { backgroundColor: "transparent" },
  numKeyText: { fontSize: 24, fontWeight: "600", color: v_1bfbd0.zinc900 },
  verifyBtn: {
    paddingVertical: 16,
    borderRadius: v_8b0c90.lg,
    backgroundColor: v_1bfbd0.zinc900,
    alignItems: "center",
  },
  verifyBtnDisabled: { backgroundColor: v_1bfbd0.zinc300 },
  verifyBtnText: { fontSize: 15, fontWeight: "700", color: v_1bfbd0.white },
  lockedBox: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  lockedTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: v_1bfbd0.zinc900,
    marginTop: 8,
  },
  lockedDesc: {
    fontSize: 14,
    color: v_1bfbd0.zinc600,
    textAlign: "center",
    marginBottom: 16,
  },
  openBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: v_8b0c90.lg,
    backgroundColor: v_1bfbd0.zinc900,
  },
  openBtnText: { fontSize: 15, fontWeight: "700", color: v_1bfbd0.white },
});
