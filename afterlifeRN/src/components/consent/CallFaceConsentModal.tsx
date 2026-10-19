

import v_a3453e, { v_5ab095 } from "bapkr";
import { v_aa7413, v_3094a2, v_19b633, v_4623af, v_472849, v_39a996 } from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_772971 } from "jmpfvteuuztnp";
import v_1a40c4 from "../ui/Button";
import v_c0caa9 from "../common/TermsModal";
import { v_1bfbd0, v_8b0c90, v_9b1a04 } from "../constants";

type Props = {
  visible: boolean;
  needFace: boolean;
  needCloneFace: boolean;
  onAgree: (agreeFace: boolean, agreeCloneFace: boolean) => Promise<void> | void;
  onCancel: () => void;
};

export default function v_db6725({ visible: v_cf55be, needFace: v_5cd3f8, needCloneFace: v_53be30, onAgree: v_5cccfe, onCancel: v_c7001c }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const [v_c7afb2, v_645639] = v_5ab095(false);
  const [v_4513fd, v_9537cd] = v_5ab095(false);
  const [v_35bf26, v_04e389] = v_5ab095(false);

  const [v_adcd4f, v_41be10] = v_5ab095<4 | 6 | null>(null);

  const v_f04f9c = async () => {
    v_04e389(true);
    try {
      await v_5cccfe(v_c7afb2, v_4513fd);
    } finally {
      v_04e389(false);
    }
  };

  const v_3ac7e7 = (v_da90dc, v_09f2bd, v_2869c1, v_a142f4) => (
    <View style={v_fd5f43.checkRow}>
      <TouchableOpacity onPress={v_09f2bd} hitSlop={8}>
        <View style={[v_fd5f43.checkbox, v_da90dc && v_fd5f43.checkboxChecked]}>
          {v_da90dc && <Feather name="check" size={14} color={v_1bfbd0.white} />}
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={{ flex: 1 }} onPress={() => v_41be10(v_a142f4)} activeOpacity={0.7}>
        <Text style={v_fd5f43.termText}>{v_2869c1}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={v_cf55be} animationType="fade" transparent onRequestClose={v_c7001c} statusBarTranslucent>
      <View style={v_fd5f43.backdrop}>
        <View style={v_fd5f43.card}>
          <Text style={v_fd5f43.title}>
            {v_8d41d7("call.faceConsentPrompt.title", { defaultValue: "얼굴 인식 동의" })}
          </Text>
          <Text style={v_fd5f43.desc}>
            {v_8d41d7("call.faceConsentPrompt.desc", {
              defaultValue: "통화 중 누가 말하는지 알아보려면 아래 동의가 필요합니다. (선택)",
            })}
          </Text>

          {v_5cd3f8 &&
            v_3ac7e7(v_c7afb2, () => v_645639((v_81e2ef) => !v_81e2ef),
              v_8d41d7("auth.signup.faceBiometricConsent", { defaultValue: "[선택] 얼굴 생체정보 처리 동의" }), 4)}
          {v_53be30 &&
            v_3ac7e7(v_4513fd, () => v_9537cd((v_81e2ef) => !v_81e2ef),
              v_8d41d7("auth.signup.cloneFaceConsent", { defaultValue: "[선택] 클론별 얼굴 인식 동의" }), 6)}

          <View style={v_fd5f43.actions}>
            <Button
              title={v_8d41d7("call.faceConsentPrompt.agree", { defaultValue: "동의" })}
              onPress={() => void v_f04f9c()}
              disabled={v_35bf26 || (!v_c7afb2 && !v_4513fd)}
              variant="primary"
            />
            {v_35bf26 && <ActivityIndicator color={v_1bfbd0.zinc500} />}
            <TouchableOpacity onPress={v_c7001c} style={v_fd5f43.cancel} disabled={v_35bf26}>
              <Text style={v_fd5f43.cancelText}>{v_8d41d7("common.cancel", { defaultValue: "취소" })}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <TermsModal
        visible={v_adcd4f !== null}
        type={v_adcd4f}
        onClose={() => v_41be10(null)}
        onAgree={() => {
          if (v_adcd4f === 4) v_645639(true);
          else if (v_adcd4f === 6) v_9537cd(true);
          v_41be10(null);
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
  checkRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6, gap: v_9b1a04.small },
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
  checkboxChecked: { backgroundColor: v_1bfbd0.zinc900, borderColor: v_1bfbd0.zinc900 },
  termText: { fontSize: 13, color: v_1bfbd0.zinc700, lineHeight: 18, textDecorationLine: "underline" },
  actions: { marginTop: v_9b1a04.medium, gap: v_9b1a04.small },
  cancel: { alignItems: "center", paddingVertical: v_9b1a04.small },
  cancelText: { fontSize: 13, color: v_1bfbd0.zinc500, textDecorationLine: "underline" },
});
