

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

  anchorY?: number;
}

export default function v_5fd66c({ visible: v_cf55be, actions: v_dd943a, onClose: v_0890f8, anchorY: v_aab37b }: Props) {

  const { height: v_ed180a } = v_e45a99();
  const v_b32007 = Math.min(v_dd943a.length * 48 + 20, 260); 
  let v_bfb490;
  if (v_aab37b != null) {
    const v_df5bdb = v_ed180a - v_aab37b;
    if (v_df5bdb >= v_b32007 + 40) v_bfb490 = v_aab37b + 8; 
    else v_bfb490 = Math.max(60, v_aab37b - v_b32007 - 8); 
  }
  return (
    <Modal visible={v_cf55be} transparent animationType="fade" onRequestClose={v_0890f8}>
      {}
      <View style={v_472849.absoluteFillObject}>
        {}
        <Pressable style={v_d81136.backdrop} onPress={v_0890f8} />
        {}
        <View
          style={[
            v_d81136.anchorLayer,
            v_bfb490 != null
              ? { justifyContent: "flex-start", alignItems: "flex-start", paddingTop: v_bfb490, paddingLeft: 20 }
              : { justifyContent: "center", alignItems: "center" },
          ]}
          pointerEvents="box-none"
        >
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
        </View>
      </View>
    </Modal>
  );
}

const v_d81136 = v_472849.create({

  backdrop: {
    ...v_472849.absoluteFillObject,

    backgroundColor: "rgba(0,0,0,0.45)",
  },

  anchorLayer: {
    ...v_472849.absoluteFillObject,
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
