

import v_a3453e, { v_5ab095 } from "bapkr";
import { v_aa7413, v_3094a2, v_19b633, v_4623af, v_472849, v_39a996 } from "rcmrninabrnb";
import { v_772971 } from "jmpfvteuuztnp";
import v_1a40c4 from "../ui/Button";
import v_c0caa9 from "../common/TermsModal";
import { v_1bfbd0, v_8b0c90, v_9b1a04 } from "../constants";

type Props = {
  visible: boolean;
  onAgree: () => Promise<void> | void;
  onCancel: () => void;
};

export default function v_db6725({ visible: v_cf55be, onAgree: v_5cccfe, onCancel: v_c7001c }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const [v_35bf26, v_04e389] = v_5ab095(false);
  const [v_0008da, v_b34f2b] = v_5ab095(false);

  const v_f04f9c = async () => {
    v_04e389(true);
    try {
      await v_5cccfe();
    } finally {
      v_04e389(false);
    }
  };

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
          <TouchableOpacity onPress={() => v_b34f2b(true)} activeOpacity={0.7}>
            <Text style={v_fd5f43.termText}>
              {v_8d41d7("auth.signup.faceBiometricConsent", { defaultValue: "[선택] 얼굴 생체정보 처리 동의" })}
            </Text>
          </TouchableOpacity>

          <View style={v_fd5f43.actions}>
            <Button
              title={v_8d41d7("call.faceConsentPrompt.agree", { defaultValue: "동의" })}
              onPress={() => void v_f04f9c()}
              disabled={v_35bf26}
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
        visible={v_0008da}
        type={4}
        onClose={() => v_b34f2b(false)}
        onAgree={() => {
          v_b34f2b(false);
          void v_f04f9c();
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
  termText: {
    fontSize: 13,
    color: v_1bfbd0.zinc700,
    lineHeight: 18,
    textDecorationLine: "underline",
    textAlign: "center",
  },
  actions: { marginTop: v_9b1a04.medium, gap: v_9b1a04.small },
  cancel: { alignItems: "center", paddingVertical: v_9b1a04.small },
  cancelText: { fontSize: 13, color: v_1bfbd0.zinc500, textDecorationLine: "underline" },
});
