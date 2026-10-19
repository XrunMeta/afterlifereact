

import v_a3453e, { v_c4deb2, v_5ab095 } from "bapkr";
import { v_aa7413, v_3094a2, v_19b633, v_4623af, v_472849, v_39a996 } from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_772971 } from "jmpfvteuuztnp";
import v_1a40c4 from "../ui/Button";
import v_c0caa9, { type v_3ac6ea } from "../common/TermsModal";
import { v_1bfbd0, v_8b0c90, v_9b1a04 } from "../constants";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_889fad } from "../../stores/dialogStore";
import {
  v_0f8436,
  v_421733,
  v_9d82d6,
} from "../../api/consent";
import {
  v_6d7a3d,
  v_704bef,
  v_9bedf5,
} from "../../lib/pushNotifications";

export default function v_bfe02f() {
  const { t: v_8d41d7 } = v_772971();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const [v_cf55be, v_72f90e] = v_5ab095(false);
  const [v_8c98c4, v_e378a4] = v_5ab095(false);
  const [v_c7afb2, v_645639] = v_5ab095(false);
  const [v_8d0e18, v_3bb4d3] = v_5ab095(false);
  const [v_35bf26, v_04e389] = v_5ab095(false);
  const [v_adcd4f, v_41be10] = v_5ab095<v_3ac6ea | null>(null);

  v_c4deb2(() => {
    if (!v_2ca7e0) {
      v_72f90e(false);
      return;
    }
    let v_2008a4 = false;
    v_0f8436(v_2ca7e0)
      .then((v_7d769d) => {
        if (!v_2008a4 && v_7d769d.state === "none") v_72f90e(true);
      })
      .catch((v_49263d) => console.warn("[FirstLoginConsent] consent fetch failed:", v_49263d));
    return () => {
      v_2008a4 = true;
    };
  }, [v_2ca7e0]);

  const v_349606 = async () => {
    if (v_8c98c4) {
      v_e378a4(false);
      return;
    }
    try {
      if (await v_6d7a3d()) {
        v_e378a4(true);
        return;
      }
    } catch {

    }
    v_3bb4d3(true);
    try {
      const v_e43fa5 = await v_704bef();
      if (!v_e43fa5.granted) {
        v_889fad(v_8d41d7("auth.signup.pushPermTitle"), v_8d41d7("auth.signup.pushPermDesc"));
        return;
      }
      v_e378a4(true);
    } catch {
      v_889fad(v_8d41d7("common.error"), v_8d41d7("auth.signup.pushPermError"));
    } finally {
      v_3bb4d3(false);
    }
  };

  const v_33f2ba = v_8c98c4 && v_c7afb2;
  const v_0217e6 = async () => {
    if (v_33f2ba) {
      v_e378a4(false);
      v_645639(false);
      return;
    }
    v_645639(true);
    if (!v_8c98c4) await v_349606();
  };

  const v_03cae9 = async () => {
    if (!v_2ca7e0 || v_35bf26) return;
    v_04e389(true);
    try {
      await Promise.all([
        v_421733(v_2ca7e0, v_c7afb2 ? "granted" : "revoked", {
          termsVersion: "v1",
          channel: "first_login",
        }).catch((v_49263d) => console.warn("[FirstLoginConsent] save face failed:", v_49263d)),
        v_9d82d6(v_2ca7e0, v_8c98c4 ? "granted" : "revoked", {
          channel: "first_login",
        }).catch((v_49263d) => console.warn("[FirstLoginConsent] save marketing failed:", v_49263d)),
      ]);
      if (v_8c98c4) void v_9bedf5(v_2ca7e0);
      v_72f90e(false);
    } finally {
      v_04e389(false);
    }
  };

  const v_3ac7e7 = (v_da90dc, v_0a2cea, v_2869c1, terms: v_3ac6ea) => (
    <View style={v_fd5f43.row}>
      <TouchableOpacity onPress={v_0a2cea} hitSlop={8}>
        <View style={[v_fd5f43.checkbox, v_da90dc && v_fd5f43.checkboxChecked]}>
          {v_da90dc && <Feather name="check" size={14} color={v_1bfbd0.white} />}
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={{ flex: 1 }} onPress={() => v_41be10(v_a142f4)} activeOpacity={0.7}>
        <Text style={v_fd5f43.rowText}>{v_2869c1}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={v_cf55be} animationType="fade" transparent statusBarTranslucent onRequestClose={() => {}}>
      <View style={v_fd5f43.backdrop}>
        <View style={v_fd5f43.card}>
          <Text style={v_fd5f43.title}>
            {v_8d41d7("firstLoginConsent.title", { defaultValue: "애프터라이프 이용 동의" })}
          </Text>
          <Text style={v_fd5f43.desc}>
            {v_8d41d7("firstLoginConsent.desc", {
              defaultValue: "애프터라이프에서 사용하는 선택 항목입니다.\n동의하지 않아도 서비스를 이용할 수 있습니다.",
            })}
          </Text>

          <TouchableOpacity style={v_fd5f43.row} onPress={() => void v_0217e6()} activeOpacity={0.7}>
            <View style={[v_fd5f43.checkbox, v_33f2ba && v_fd5f43.checkboxChecked]}>
              {v_33f2ba && <Feather name="check" size={14} color={v_1bfbd0.white} />}
            </View>
            <Text style={[v_fd5f43.rowText, v_fd5f43.allText]}>
              {v_8d41d7("auth.signup.termsAgreeAll", { defaultValue: "전체 동의" })}
            </Text>
          </TouchableOpacity>
          <View style={v_fd5f43.divider} />

          {v_3ac7e7(
            v_8c98c4,
            () => void v_349606(),
            `${v_8d41d7("auth.signup.marketingConsent", { defaultValue: "[선택] 마케팅 정보 수집 및 활용 동의" })}${
              v_8d0e18 ? ` (${v_8d41d7("auth.signup.verifying", { defaultValue: "확인 중" })})` : ""
            }`,
            7,
          )}
          {v_3ac7e7(
            v_c7afb2,
            () => v_645639((v_81e2ef) => !v_81e2ef),
            v_8d41d7("auth.signup.faceBiometricConsent", { defaultValue: "[선택] 얼굴 생체정보 처리 동의" }),
            4,
          )}

          <View style={v_fd5f43.actions}>
            <Button
              title={v_8d41d7("common.confirm", { defaultValue: "확인" })}
              onPress={() => void v_03cae9()}
              disabled={v_35bf26}
              variant="primary"
              size="md"
            />
            {v_35bf26 && <ActivityIndicator color={v_1bfbd0.zinc500} />}
          </View>
        </View>
      </View>

      <TermsModal
        visible={v_adcd4f !== null}
        type={v_adcd4f}
        onClose={() => v_41be10(null)}
        onAgree={() => {
          const v_357868 = v_adcd4f;
          v_41be10(null);
          if (v_357868 === 4) v_645639(true);
          else if (v_357868 === 7 && !v_8c98c4) void v_349606();
        }}
      />
    </Modal>
  );
}

const v_fd5f43 = v_472849.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: v_9b1a04.large,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: v_1bfbd0.white,
    borderRadius: v_8b0c90.lg,
    paddingVertical: v_9b1a04.xlarge,
    paddingHorizontal: v_9b1a04.large,
    gap: v_9b1a04.small,
  },
  title: { fontSize: 18, fontWeight: "700", color: v_1bfbd0.zinc900, textAlign: "center" },
  desc: { fontSize: 13, color: v_1bfbd0.zinc600, textAlign: "center", lineHeight: 18, marginBottom: v_9b1a04.small },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: v_9b1a04.small },
  rowText: { fontSize: 14, color: v_1bfbd0.zinc800, lineHeight: 20 },
  allText: { fontWeight: "700" },
  divider: { height: v_472849.hairlineWidth, backgroundColor: v_1bfbd0.zinc200 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: v_1bfbd0.zinc400,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: v_1bfbd0.white,
  },
  checkboxChecked: { backgroundColor: v_1bfbd0.zinc900, borderColor: v_1bfbd0.zinc900 },
  actions: { marginTop: v_9b1a04.medium, gap: v_9b1a04.small },
});
