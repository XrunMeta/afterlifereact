

import v_a3453e, { v_de06a3, v_5ab095 } from "bapkr";
import {
  v_aa7413,
  v_3094a2,
  v_19b633,
  v_4623af,
  v_472849,
  v_39a996,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_772971 } from "jmpfvteuuztnp";
import v_1a40c4 from "../ui/Button";
import v_c0caa9, { type v_3ac6ea } from "../common/TermsModal";
import {
  v_7f847d,
  v_421733,
  type v_6a3f07,
  type v_f8228d,
} from "../../api/consent";
import { v_1bfbd0, v_8b0c90, v_9b1a04 } from "../constants";

type Props = {
  visible: boolean;
  accessToken: string | null;
  faceState: v_f8228d | null;
  callState: v_6a3f07 | null;

  onComplete: (next: { face: v_f8228d; call: v_6a3f07 }) => void;

  onCancel: () => void;
};

export default function v_64aee4({
  visible: v_cf55be,
  accessToken: v_2ca7e0,
  faceState: v_bbb3d3,
  callState: v_2c3180,
  onComplete: v_9397ad,
  onCancel: v_c7001c,
}: Props) {
  const { t: v_8d41d7 } = v_772971();
  const [v_c7afb2, v_645639] = v_5ab095(true);
  const [v_f5d2c6, v_d7aae4] = v_5ab095(true);
  const [v_35bf26, v_04e389] = v_5ab095(false);
  const [v_d39271, v_fe0d62] = v_5ab095<v_3ac6ea | null>(null);

  const v_c5037d = v_bbb3d3 !== null && v_bbb3d3 !== "granted";
  const v_c707c6 = v_2c3180 !== null && v_2c3180 !== "granted";

  const v_0577ff = v_de06a3(async () => {
    if (!v_2ca7e0) {

      v_9397ad({ face: v_bbb3d3 ?? "granted", call: v_2c3180 ?? "granted" });
      return;
    }
    v_04e389(true);
    let nextFace: v_f8228d = v_bbb3d3 ?? "granted";
    let nextCall: v_6a3f07 = v_2c3180 ?? "granted";
    try {
      const v_ea7071 = [];
      if (v_c5037d) {
        v_ea7071.push(
          v_421733(v_2ca7e0, v_c7afb2 ? "granted" : "revoked", {
            channel: "settings",
          })
            .then((v_8f00b9) => {
              v_7b312c = v_8f00b9.state as v_f8228d;
            })
            .catch((v_49263d) => {
              console.warn("[ConsentPromptModal] saveFaceBiometric failed:", v_49263d);
            }),
        );
      }
      if (v_c707c6) {
        v_ea7071.push(
          v_7f847d(v_2ca7e0, v_f5d2c6 ? "granted" : "revoked", {
            channel: "settings",
          })
            .then((v_8f00b9) => {
              v_df4db2 = v_8f00b9.state as v_6a3f07;
            })
            .catch((v_49263d) => {
              console.warn("[ConsentPromptModal] saveCallLearning failed:", v_49263d);
            }),
        );
      }
      await Promise.all(v_ea7071);
    } finally {
      v_04e389(false);
    }
    v_9397ad({ face: v_7b312c, call: v_df4db2 });
  }, [v_2ca7e0, v_c7afb2, v_f5d2c6, v_c5037d, v_c707c6, v_bbb3d3, v_2c3180, v_9397ad]);

  return (
    <Modal
      visible={v_cf55be}
      animationType="fade"
      transparent
      onRequestClose={v_c7001c}
      statusBarTranslucent
    >
      <View style={v_d81136.backdrop}>
        <View style={v_d81136.card}>
          <View style={v_d81136.iconWrap}>
            <Feather name="shield" size={28} color={v_1bfbd0.white} />
          </View>
          <Text style={v_d81136.title}>
            {v_8d41d7("consentPrompt.title", { defaultValue: "통화 전 동의가 필요합니다" })}
          </Text>
          <Text style={v_d81136.desc}>
            {v_8d41d7("consentPrompt.desc", {
              defaultValue: "원활한 통화를 위해 아래 동의를 확인해 주세요.",
            })}
          </Text>

          {v_c707c6 && (
            <View style={v_d81136.checkRow}>
              <TouchableOpacity onPress={() => v_d7aae4(!v_f5d2c6)} hitSlop={8}>
                <View style={[v_d81136.checkbox, v_f5d2c6 && v_d81136.checkboxChecked]}>
                  {v_f5d2c6 && <Feather name="check" size={14} color={v_1bfbd0.white} />}
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={v_d81136.termTextWrap}
                onPress={() => v_fe0d62(5)}
                activeOpacity={0.7}
              >
                <Text style={[v_d81136.termText, v_d81136.termLink]}>
                  {v_8d41d7("permissionGate.callLearningConsent", {
                    defaultValue: "(선택) 통화 대화 학습에 동의합니다",
                  })}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {v_c5037d && (
            <View style={v_d81136.checkRow}>
              <TouchableOpacity onPress={() => v_645639(!v_c7afb2)} hitSlop={8}>
                <View style={[v_d81136.checkbox, v_c7afb2 && v_d81136.checkboxChecked]}>
                  {v_c7afb2 && <Feather name="check" size={14} color={v_1bfbd0.white} />}
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={v_d81136.termTextWrap}
                onPress={() => v_fe0d62(4)}
                activeOpacity={0.7}
              >
                <Text style={[v_d81136.termText, v_d81136.termLink]}>
                  {v_8d41d7("permissionGate.faceBiometricConsent", {
                    defaultValue: "(선택) 얼굴 인식(생체정보) 활용에 동의합니다",
                  })}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={v_d81136.actions}>
            <Button
              title={
                v_35bf26
                  ? v_8d41d7("common.saving", { defaultValue: "저장 중..." })
                  : v_8d41d7("consentPrompt.continueBtn", { defaultValue: "계속" })
              }
              onPress={() => void v_0577ff()}
              disabled={v_35bf26}
              variant="primary"
            />
            {v_35bf26 && (
              <View style={v_d81136.loadingRow}>
                <ActivityIndicator color={v_1bfbd0.zinc500} />
              </View>
            )}
            <TouchableOpacity onPress={v_c7001c} style={v_d81136.cancelLink} disabled={v_35bf26}>
              <Text style={v_d81136.cancelLinkText}>
                {v_8d41d7("common.cancel", { defaultValue: "취소" })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <TermsModal
        visible={v_d39271 !== null}
        type={v_d39271}
        onClose={() => v_fe0d62(null)}
        onAgree={() => {
          if (v_d39271 === 4) v_645639(true);
          else if (v_d39271 === 5) v_d7aae4(true);
          v_fe0d62(null);
        }}
      />
    </Modal>
  );
}

const v_d81136 = v_472849.create({
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
    alignItems: "stretch",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: v_8b0c90.full ?? 999,
    backgroundColor: v_1bfbd0.zinc900,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: v_9b1a04.small,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: v_1bfbd0.zinc900,
    textAlign: "center",
  },
  desc: {
    fontSize: 13,
    color: v_1bfbd0.zinc600,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: v_9b1a04.small,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    gap: v_9b1a04.small,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: v_1bfbd0.zinc400,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: v_1bfbd0.white,
  },
  checkboxChecked: {
    backgroundColor: v_1bfbd0.zinc900,
    borderColor: v_1bfbd0.zinc900,
  },
  termTextWrap: {
    flex: 1,
  },
  termText: {
    fontSize: 13,
    color: v_1bfbd0.zinc700,
    lineHeight: 18,
  },
  termLink: {
    textDecorationLine: "underline",
  },
  actions: {
    marginTop: v_9b1a04.medium,
    gap: v_9b1a04.small,
  },
  loadingRow: {
    alignItems: "center",
    paddingVertical: 4,
  },
  cancelLink: {
    alignItems: "center",
    paddingVertical: v_9b1a04.small,
  },
  cancelLinkText: {
    fontSize: 13,
    color: v_1bfbd0.zinc500,
    textDecorationLine: "underline",
  },
});
