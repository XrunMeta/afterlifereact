

import v_a3453e from "bapkr";
import {
  v_aa7413,
  v_3094a2,
  v_19b633,
  v_09d0e5,
  v_472849,
  v_e45a99,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_1bfbd0 } from "../constants";

export interface ActionSheetAction {

  label: string;

  icon?: v_a3453e.ComponentProps<typeof v_dec439>["name"];

  style?: "default" | "destructive";
  onPress: () => void;
}

interface Props {
  visible: boolean;
  title?: string;

  subtitle?: string;
  actions: ActionSheetAction[];
  onClose: () => void;
}

export default function v_5fd66c({ visible: v_cf55be, title: v_9f1622, subtitle: v_dda473, actions: v_dd943a, onClose: v_0890f8 }: Props) {
  const { height: v_c86e33 } = v_e45a99();
  return (
    <Modal visible={v_cf55be} transparent animationType="slide" onRequestClose={v_0890f8}>
      <Pressable style={v_d81136.backdrop} onPress={v_0890f8}>
        <Pressable style={[v_d81136.sheet, { maxHeight: v_c86e33 * 0.6 }]} onPress={(v_9e86fd) => v_9e86fd.stopPropagation?.()}>
          {}
          <View style={v_d81136.handle} />
          {v_9f1622 || v_dda473 ? (
            <View style={v_d81136.header}>
              {v_9f1622 ? <Text style={v_d81136.title}>{v_9f1622}</Text> : null}
              {v_dda473 ? <Text style={v_d81136.subtitle}>{v_dda473}</Text> : null}
            </View>
          ) : null}
          {v_dd943a.map((v_779914, v_ebec57) => (
            <React.Fragment key={`${v_779914.label}-${v_ebec57}`}>
              {v_ebec57 > 0 ? <View style={v_d81136.divider} /> : null}
              <Pressable
                style={({ pressed: v_aba1d2 }) => [v_d81136.actionRow, v_aba1d2 && v_d81136.actionRowPressed]}
                onPress={() => { v_0890f8(); setTimeout(v_779914.onPress, 100); }}
                android_ripple={{ color: "rgba(0,0,0,0.05)" }}
              >
                <Text style={[v_d81136.actionLabel, v_779914.style === "destructive" && v_d81136.actionLabelDestructive]}>
                  {v_779914.label}
                </Text>
                {v_779914.icon ? (
                  <Feather
                    name={v_779914.icon}
                    size={20}
                    color={v_779914.style === "destructive" ? "#ef4444" : v_1bfbd0.zinc600}
                  />
                ) : null}
              </Pressable>
            </React.Fragment>
          ))}
          {}
          <View style={v_d81136.cancelGroup}>
            <Pressable
              style={({ pressed: v_aba1d2 }) => [v_d81136.cancelRow, v_aba1d2 && v_d81136.actionRowPressed]}
              onPress={v_0890f8}
              android_ripple={{ color: "rgba(0,0,0,0.05)" }}
            >
              <Text style={v_d81136.cancelLabel}>취소</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const v_d81136 = v_472849.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: v_1bfbd0.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: v_1bfbd0.zinc200,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 8,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc100,
  },
  title: { fontSize: 15, fontWeight: "600", color: v_1bfbd0.zinc900 },
  subtitle: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  actionRowPressed: {
    backgroundColor: v_1bfbd0.zinc100,
  },
  divider: {
    height: v_472849.hairlineWidth,
    backgroundColor: v_1bfbd0.zinc100,
    marginHorizontal: 20,
  },
  actionLabel: {
    fontSize: 16,
    color: v_1bfbd0.zinc900,
    fontWeight: "500",
  },
  actionLabelDestructive: {
    color: "#ef4444",
    fontWeight: "600",
  },
  cancelGroup: {
    marginTop: 8,
    borderTopWidth: 6,
    borderTopColor: v_1bfbd0.zinc50 ?? "#f4f4f5",
  },
  cancelRow: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: "center",
  },
  cancelLabel: {
    fontSize: 16,
    color: v_1bfbd0.zinc900,
    fontWeight: "600",
  },
});
