

import v_a3453e, { v_c4deb2, v_5ab095 } from "bapkr";
import {
  v_aa7413,
  v_3094a2,
  v_19b633,
  v_79c4f2,
  v_4623af,
  v_472849,
  v_39a996,
  v_e767d1,
  v_326be8,
  v_09d0e5,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_1bfbd0, v_8b0c90 } from "../../../components/constants";
import { v_1ed7d9 } from "../../../stores/authStore";
import { v_194498 } from "../../../stores/cloneStore";
import { v_d60cdf } from "../../../api/clones";

const v_c02c4c = 100;

interface Props {

  onProceed: () => void;

  onCancel: () => void;
}

export default function v_286084({ onProceed: v_4b3759, onCancel: v_c7001c }: Props) {
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const v_5795de = v_194498((v_fd5f43) => v_fd5f43.setCreationDraft);

  const [v_683210, v_34a50a] = v_5ab095(true);
  const [v_f99e34, v_337a5f] = v_5ab095(false);
  const [v_6bee94, v_240fbf] = v_5ab095("");
  const [v_5e9bfe, v_3a7d09] = v_5ab095<string | null>(null);

  v_c4deb2(() => {
    let v_2008a4 = false;
    (async () => {
      if (!v_2ca7e0) {

        if (!v_2008a4) {
          v_34a50a(false);
          v_4b3759();
        }
        return;
      }
      try {
        const v_8f00b9 = await v_d60cdf(v_2ca7e0);
        if (v_2008a4) return;
        const v_9e8c70 = v_8f00b9.items?.length ?? 0;
        if (v_9e8c70 >= 1) {
          v_337a5f(true);
          v_34a50a(false);
        } else {
          v_34a50a(false);
          v_4b3759();
        }
      } catch (v_49263d) {
        console.warn("[PaymentGate] listMyClones failed:", v_49263d);

        if (!v_2008a4) {
          v_34a50a(false);
          v_4b3759();
        }
      }
    })();
    return () => {
      v_2008a4 = true;
    };

  }, [v_2ca7e0]);

  const v_03cae9 = () => {
    if (v_6bee94.length !== 6) {
      v_3a7d09("PIN 6자리를 입력해주세요.");
      return;
    }

    v_5795de({ pin: v_6bee94 });
    v_4b3759();
  };

  if (v_683210) {
    return (
      <View style={v_d81136.fullCenter}>
        <ActivityIndicator color={v_1bfbd0.violet600} />
      </View>
    );
  }

  if (!v_f99e34) return null; 

  return (
    <Modal visible transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={v_326be8.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <Pressable style={v_d81136.overlay} onPress={v_c7001c}>
          <Pressable style={v_d81136.box} onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}>
            <View style={v_d81136.iconWrap}>
              <Feather name="credit-card" size={26} color={v_1bfbd0.violet600} />
            </View>
            <Text style={v_d81136.title}>페르소나 생성 결제</Text>
            <Text style={v_d81136.desc}>
              두 번째 페르소나부터 {v_c02c4c} XRUN 이 부과돼요.{"\n"}
              결제 비밀번호 6자리를 입력해주세요.
            </Text>
            <TextInput
              style={v_d81136.input}
              value={v_6bee94}
              onChangeText={(v_81e2ef) => {
                v_240fbf(v_81e2ef.replace(/\D/g, "").slice(0, 6));
                v_3a7d09(null);
              }}
              placeholder="PIN 6자리"
              placeholderTextColor={v_1bfbd0.zinc400}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              autoFocus
            />
            {v_5e9bfe && <Text style={v_d81136.error}>{v_5e9bfe}</Text>}
            <View style={v_d81136.btns}>
              <TouchableOpacity style={v_d81136.cancel} onPress={v_c7001c}>
                <Text style={v_d81136.cancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[v_d81136.confirm, v_6bee94.length !== 6 && v_d81136.disabled]}
                onPress={v_03cae9}
                disabled={v_6bee94.length !== 6}
              >
                <Text style={v_d81136.confirmText}>
                  {v_c02c4c} XRUN 결제
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const v_d81136 = v_472849.create({
  fullCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  box: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: v_1bfbd0.white,
    borderRadius: v_8b0c90.lg,
    padding: 24,
    alignItems: "center",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(167,139,250,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: v_1bfbd0.zinc900,
    marginBottom: 6,
    textAlign: "center",
  },
  desc: {
    fontSize: 13,
    color: v_1bfbd0.zinc600,
    marginBottom: 16,
    textAlign: "center",
    lineHeight: 20,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    borderRadius: v_8b0c90.md,
    padding: 12,
    fontSize: 18,
    textAlign: "center",
    letterSpacing: 4,
    color: v_1bfbd0.zinc900,
    marginBottom: 8,
  },
  error: { fontSize: 12, color: "#ef4444", marginBottom: 8 },
  btns: { flexDirection: "row", gap: 8, width: "100%", marginTop: 12 },
  cancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: v_8b0c90.md,
    backgroundColor: v_1bfbd0.zinc100,
    alignItems: "center",
  },
  cancelText: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc700 },
  confirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: v_8b0c90.md,
    backgroundColor: v_1bfbd0.violet600,
    alignItems: "center",
  },
  disabled: { opacity: 0.5 },
  confirmText: { fontSize: 14, fontWeight: "700", color: v_1bfbd0.white },
});
