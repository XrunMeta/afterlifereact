

import v_a3453e from "bapkr";
import {
  v_aa7413,
  v_3094a2,
  v_19b633,
  v_4623af,
  v_472849,
  v_09d0e5,
} from "rcmrninabrnb";
import { v_b54176, type v_2bdc79 } from "../../stores/dialogStore";
import { v_1bfbd0, v_8b0c90 } from "../constants";

export default function v_d714a5() {
  const { visible: v_cf55be, title: v_9f1622, message: v_a8cd21, subMessage: v_b16388, buttons: v_3d694a, key: v_b24339, close: v_c78a36, messageAlign: v_48225e } = v_b54176();

  const v_5ba0f2 = (btn: v_2bdc79) => {
    v_c78a36();

    setTimeout(() => {
      try {
        v_8955f9.onPress?.();
      } catch (v_49263d) {
        console.warn("[AppDialog] onPress threw:", v_49263d);
      }
    }, 0);
  };

  const v_954b83 = v_3d694a.length >= 3;

  return (
    <Modal
      key={v_b24339}
      visible={v_cf55be}
      transparent
      animationType="fade"
      onRequestClose={v_c78a36}
      statusBarTranslucent
    >
      <Pressable
        style={v_d81136.overlay}

        onPress={() => {}}
      >
        <View style={v_d81136.box} onStartShouldSetResponder={() => true}>
          <Text style={v_d81136.title}>{v_9f1622}</Text>
          {v_a8cd21 ? (
            <Text style={[v_d81136.message, v_48225e === "left" && { textAlign: "left" }]}>{v_a8cd21}</Text>
          ) : null}
          {v_b16388 ? <Text style={v_d81136.subMessage}>{v_b16388}</Text> : null}
          <View
            style={[
              v_d81136.btnRow,
              v_954b83 && { flexDirection: "column", gap: 8 },
            ]}
          >
            {v_3d694a.map((v_8955f9, v_e86ad8) => {
              const v_d7a4ff = v_8955f9.style === "cancel";
              const v_6cbd7f = v_8955f9.style === "destructive";
              const v_292ed0 = v_d7a4ff
                ? v_d81136.cancel
                : v_6cbd7f
                  ? v_d81136.destructive
                  : v_d81136.confirm;
              const v_197d6e = v_d7a4ff
                ? v_d81136.cancelText
                : v_d81136.confirmText;
              return (
                <TouchableOpacity
                  key={`${v_e86ad8}-${v_8955f9.text}`}
                  style={[v_292ed0, { flex: v_954b83 ? undefined : 1 }]}
                  activeOpacity={0.85}
                  onPress={() => v_5ba0f2(v_8955f9)}
                >
                  <Text style={v_197d6e}>{v_8955f9.text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const v_d81136 = v_472849.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  box: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: v_1bfbd0.white,
    borderRadius: v_8b0c90.lg,
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 20,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: v_1bfbd0.zinc900,
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: v_1bfbd0.zinc600,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 6,
  },

  subMessage: {
    fontSize: 11,
    color: v_1bfbd0.zinc400,
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 14,
  },
  btnRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },

  confirm: {
    paddingVertical: 12,
    borderRadius: v_8b0c90.md,
    backgroundColor: v_1bfbd0.violet600,
    alignItems: "center",
  },
  confirmText: { color: v_1bfbd0.white, fontSize: 15, fontWeight: "700" },

  destructive: {
    paddingVertical: 12,
    borderRadius: v_8b0c90.md,
    backgroundColor: "#ef4444",
    alignItems: "center",
  },

  cancel: {
    paddingVertical: 12,
    borderRadius: v_8b0c90.md,
    backgroundColor: v_1bfbd0.white,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    alignItems: "center",
  },
  cancelText: { color: v_1bfbd0.zinc700, fontSize: 15, fontWeight: "600" },
});
