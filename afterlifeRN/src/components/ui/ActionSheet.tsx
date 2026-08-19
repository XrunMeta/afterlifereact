

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

export default function v_5fd66c({ visible: v_cf55be, actions: v_dd943a, onClose: v_0890f8 }: Props) {

  return (
    <Modal visible={v_cf55be} transparent animationType="fade" onRequestClose={v_0890f8}>
      <Pressable style={v_d81136.backdrop} onPress={v_0890f8}>
        <Pressable style={v_d81136.sheet} onPress={(v_9e86fd) => v_9e86fd.stopPropagation?.()}>
          {v_dd943a.map((v_779914, v_ebec57) => (
            <React.Fragment key={`${v_779914.label}-${v_ebec57}`}>
              {v_ebec57 > 0 ? <View style={v_d81136.divider} /> : null}
              <Pressable
                style={({ pressed: v_aba1d2 }) => [v_d81136.actionRow, v_aba1d2 && v_d81136.actionRowPressed]}
                onPress={() => { v_0890f8(); setTimeout(v_779914.onPress, 100); }}
                android_ripple={{ color: "rgba(0,0,0,0.05)" }}
              >
                {v_779914.icon ? (
                  <Feather
                    name={v_779914.icon}
                    size={22}
                    color={v_779914.style === "destructive" ? "#ef4444" : v_1bfbd0.zinc800}
                  />
                ) : (
                  <View style={{ width: 22 }} />
                )}
                <Text style={[v_d81136.actionLabel, v_779914.style === "destructive" && v_d81136.actionLabelDestructive]}>
                  {v_779914.label}
                </Text>
              </Pressable>
            </React.Fragment>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const v_d81136 = v_472849.create({

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  sheet: {
    width: 240,
    backgroundColor: "#fafafa",
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionRowPressed: {
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  divider: {
    height: v_472849.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.08)",
    marginHorizontal: 14,
  },
  actionLabel: {
    fontSize: 15,
    color: "#000000",
    fontWeight: "500",
  },
  actionLabelDestructive: {
    color: "#ed4956",
    fontWeight: "600",
  },
});
