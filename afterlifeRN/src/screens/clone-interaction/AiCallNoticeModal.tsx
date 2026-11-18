

import v_a3453e, { v_c4deb2, v_5ab095 } from "bapkr";
import { v_aa7413, v_3094a2, v_19b633, v_4623af, v_472849, v_acfdec } from "rcmrninabrnb";
import v_e84827 from "bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv";
import { v_772971 } from "jmpfvteuuztnp";

const v_d9b84e = "t20.aiCallNoticeAck";

export function v_978adb(): {
  loading: boolean;
  needsNotice: boolean;
  acknowledge: () => Promise<void>;
} {
  const [v_683210, v_34a50a] = v_5ab095(true);
  const [v_791c13, v_0f9f79] = v_5ab095(false);

  v_c4deb2(() => {
    let v_f8b770 = true;
    (async () => {
      try {
        const v_81e2ef = await v_e84827.getItem(v_d9b84e);
        if (!v_f8b770) return;
        v_0f9f79(v_81e2ef !== "1");
      } catch {

        if (v_f8b770) v_0f9f79(true);
      } finally {
        if (v_f8b770) v_34a50a(false);
      }
    })();
    return () => {
      v_f8b770 = false;
    };
  }, []);

  const v_6c155f = async () => {
    try { await v_e84827.setItem(v_d9b84e, "1"); } catch {  }
    v_0f9f79(false);
  };

  return { loading: v_683210, needsNotice: v_791c13, acknowledge: v_6c155f };
}

export interface AiCallNoticeModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function v_48f7a6({ visible: v_cf55be, onConfirm: v_e2be2d, onCancel: v_c7001c }: AiCallNoticeModalProps) {
  const { t: v_8d41d7 } = v_772971();
  return (
    <Modal visible={v_cf55be} transparent animationType="fade" onRequestClose={v_c7001c}>
      <SafeAreaView style={v_d81136.backdrop}>
        <View style={v_d81136.card}>
          <Text style={v_d81136.title}>{v_8d41d7("call.aiNotice.title", { defaultValue: "AI 통화 안내" })}</Text>
          <Text style={v_d81136.body}>
            {v_8d41d7("call.aiNotice.body", {
              defaultValue:
                "지금부터 통화하는 상대는 실제 사람이 아니라 AI 로 생성된 클론입니다. 목소리·얼굴·대화 내용 모두 AI 가 생성합니다.",
            })}
          </Text>
          <Text style={v_d81136.bodySub}>
            {v_8d41d7("call.aiNotice.bodySub", {
              defaultValue: "AI 가 사람인 척 답하지 않도록 서비스가 설계되어 있습니다.",
            })}
          </Text>
          <View style={v_d81136.actions}>
            <TouchableOpacity style={v_d81136.cancelBtn} onPress={v_c7001c} activeOpacity={0.7}>
              <Text style={v_d81136.cancelText}>{v_8d41d7("common.cancel", { defaultValue: "취소" })}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={v_d81136.confirmBtn} onPress={v_e2be2d} activeOpacity={0.7}>
              <Text style={v_d81136.confirmText}>{v_8d41d7("common.confirm", { defaultValue: "확인" })}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const v_d81136 = v_472849.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    gap: 12,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#18181b" },
  body: { fontSize: 14, lineHeight: 22, color: "#27272a" },
  bodySub: { fontSize: 13, lineHeight: 20, color: "#52525b" },
  actions: { flexDirection: "row", gap: 10, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#f4f4f5",
  },
  cancelText: { color: "#3f3f46", fontSize: 14, fontWeight: "600" },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#18181b",
  },
  confirmText: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
});
