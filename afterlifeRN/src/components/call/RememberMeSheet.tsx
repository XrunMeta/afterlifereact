

import v_a3453e, { v_c4deb2, v_5ab095 } from "bapkr";
import {
  v_aa7413,
  v_3094a2,
  v_19b633,
  v_79c4f2,
  v_09d0e5,
  v_472849,
  v_e767d1,
  v_326be8,
  v_0e1f26,
  v_122070,
} from "rcmrninabrnb";
import { v_772971 } from "jmpfvteuuztnp";
import { v_1bfbd0, v_8b0c90 } from "../constants";

export interface RememberMeSheetProps {
  visible: boolean;

  saving?: boolean;

  error?: string | null;
  onSubmit: (name: string, relation: string) => void;
  onDismiss: () => void;
}

export default function v_39b6c7({
  visible: v_cf55be,
  saving: v_35bf26 = false,
  error: v_5e9bfe = null,
  onSubmit: v_3bfe4c,
  onDismiss: v_1b97a8,
}: RememberMeSheetProps) {
  const { t: v_8d41d7 } = v_772971();
  const [v_1833e7, v_318f24] = v_5ab095("");
  const [v_dd8af0, v_23e8d3] = v_5ab095("");

  const [v_136fe5, v_fc15da] = v_5ab095(false);
  v_c4deb2(() => {
    const v_fdffe1 = v_0e1f26.addListener("keyboardDidShow", () => v_fc15da(true));
    const v_2f19d2 = v_0e1f26.addListener("keyboardDidHide", () => v_fc15da(false));
    return () => {
      v_fdffe1.remove();
      v_2f19d2.remove();
    };
  }, []);

  v_c4deb2(() => {
    if (v_cf55be) {
      v_318f24("");
      v_23e8d3("");
    }
  }, [v_cf55be]);

  const v_affc3e = v_1833e7.trim();
  const v_4b57e7 = v_affc3e.length > 0 && !v_35bf26;

  return (
    <Modal visible={v_cf55be} transparent animationType="fade" onRequestClose={v_1b97a8}>
      {

}
      <Pressable
        testID="remember-me-backdrop"
        style={v_d81136.backdropTouch}
        onPress={() => {
          if (v_136fe5) {
            v_0e1f26.dismiss();
            return;
          }
          v_1b97a8();
        }}
        accessibilityLabel={v_8d41d7("common.close", { defaultValue: "닫기" })}
      />
      <KeyboardAvoidingView
        style={v_d81136.backdrop}
        pointerEvents="box-none"

        behavior={v_326be8.OS === "ios" ? "padding" : "height"}
      >
        {
}
        <View style={v_d81136.cardWrapper} pointerEvents="box-none">
        <View style={v_d81136.card} testID="remember-me-sheet">
          <Text style={v_d81136.title}>{v_8d41d7("call.rememberMe.sheetTitle", { defaultValue: "이 분은 누구신가요?" })}</Text>
          <Text style={v_d81136.desc}>
            {v_8d41d7("call.rememberMe.sheetDesc", { defaultValue: "알려주시면 다음 통화부터 기억할게요." })}
          </Text>

          <Text style={v_d81136.label}>{v_8d41d7("call.rememberMe.nameLabel", { defaultValue: "이름" })}</Text>
          <TextInput
            testID="remember-me-name"
            style={v_d81136.input}
            value={v_1833e7}
            onChangeText={v_318f24}
            placeholder={v_8d41d7("call.rememberMe.namePlaceholder", { defaultValue: "예: 지호" })}
            placeholderTextColor="#9ca3af"
            autoFocus
            returnKeyType="next"
            editable={!v_35bf26}
          />

          <Text style={v_d81136.label}>{v_8d41d7("call.rememberMe.relationLabel", { defaultValue: "관계" })}</Text>
          <TextInput
            testID="remember-me-relation"
            style={v_d81136.input}
            value={v_dd8af0}
            onChangeText={v_23e8d3}
            placeholder={v_8d41d7("call.rememberMe.relationPlaceholder", { defaultValue: "예: 손주, 오랜 친구" })}
            placeholderTextColor="#9ca3af"
            returnKeyType="done"
            editable={!v_35bf26}
            onSubmitEditing={() => v_4b57e7 && v_3bfe4c(v_affc3e, v_dd8af0.trim())}
          />

          {v_5e9bfe ? <Text style={v_d81136.error}>{v_5e9bfe}</Text> : null}

          <View style={v_d81136.row}>
            <Pressable
              testID="remember-me-dismiss"
              accessibilityRole="button"
              onPress={v_1b97a8}
              disabled={v_35bf26}
              style={({ pressed: v_aba1d2 }) => [v_d81136.btn, v_d81136.btnGhost, v_aba1d2 && v_d81136.pressed]}
            >
              <Text style={v_d81136.btnGhostText}>{v_8d41d7("call.rememberMe.later", { defaultValue: "나중에" })}</Text>
            </Pressable>
            <Pressable
              testID="remember-me-submit"
              accessibilityRole="button"
              onPress={() => v_3bfe4c(v_affc3e, v_dd8af0.trim())}
              disabled={!v_4b57e7}
              style={({ pressed: v_aba1d2 }) => [
                v_d81136.btn,
                v_d81136.btnPrimary,
                !v_4b57e7 && v_d81136.btnDisabled,
                v_aba1d2 && v_d81136.pressed,
              ]}
            >
              <Text style={v_d81136.btnPrimaryText}>{v_35bf26 ? v_8d41d7("common.saving", { defaultValue: "저장 중…" }) : v_8d41d7("common.save", { defaultValue: "저장" })}</Text>
            </Pressable>
          </View>
        </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const v_d81136 = v_472849.create({

  backdropTouch: {
    ...v_472849.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  backdrop: {
    ...v_472849.absoluteFillObject,

    justifyContent: "flex-end",
    alignItems: "center",
    padding: 24,
  },
  cardWrapper: {
    width: "100%",
    maxWidth: 380,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#18181b",
    borderRadius: v_8b0c90.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  title: { color: v_1bfbd0.white, fontSize: 19, fontWeight: "800" },
  desc: { color: "#a1a1aa", fontSize: 13, marginTop: 6, marginBottom: 14 },
  label: { color: "#d4d4d8", fontSize: 12, marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: "#27272a",
    color: v_1bfbd0.white,
    borderRadius: v_8b0c90.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  error: { color: "#f87171", fontSize: 12, marginTop: 10 },
  row: { flexDirection: "row", gap: 10, marginTop: 18 },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: v_8b0c90.md,
    alignItems: "center",
  },
  btnGhost: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#3f3f46" },
  btnGhostText: { color: "#d4d4d8", fontSize: 15, fontWeight: "600" },
  btnPrimary: { backgroundColor: "#2563eb" },
  btnPrimaryText: { color: v_1bfbd0.white, fontSize: 15, fontWeight: "700" },
  btnDisabled: { opacity: 0.45 },
  pressed: { opacity: 0.75 },
});
