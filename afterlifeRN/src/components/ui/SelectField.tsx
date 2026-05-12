

import v_a3453e, { v_e662ae, v_5ab095, v_de06a3 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_4623af,
  v_aa7413,
  v_09d0e5,
  v_472849,
  v_961e77,
  v_7e4944,
  v_122070,
  v_700696,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_1bfbd0, v_843035, v_9b1a04, v_8b0c90 } from "../constants";

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

export interface SelectFieldProps<T extends string = string> {
  options: SelectOption<T>[];
  value: T | "";
  onChange: (value: T) => void;
  placeholder?: string;
  label?: string;
  errorText?: string;
  leftIcon?: v_a3453e.ReactNode;
  containerStyle?: v_961e77<v_7e4944>;
  rounded?: number;

  dropdownMaxHeight?: number;
}

type Anchor = { top: number; left: number; width: number; below: boolean };

export default function v_d56c0a<T extends string = string>({
  options: v_b36f96,
  value: v_3b402b,
  onChange: v_b187d9,
  placeholder: v_c6baea = "선택",
  label: v_2869c1,
  errorText: v_74dc8b,
  leftIcon: v_86ef18,
  containerStyle: v_4affe9,
  rounded: v_f52086 = 10,
  dropdownMaxHeight: v_79040b = 280,
}: SelectFieldProps<T>) {
  const [v_207c31, v_3cc8fd] = v_5ab095(false);
  const [v_05241d, v_56b59b] = v_5ab095<Anchor | null>(null);
  const v_ff7a13 = v_e662ae<v_3094a2>(null);
  const v_587413 = v_b36f96.find((v_b6c474) => v_b6c474.value === v_3b402b);

  const v_8a5603 = v_de06a3(() => {
    v_ff7a13.current?.measureInWindow((v_62c214, v_64877a, v_8e4fb6, v_c86e33) => {
      const v_ed180a = v_700696.get("window").height;
      const v_df5bdb = v_ed180a - (v_64877a + v_c86e33);
      const v_c4494c = v_64877a;

      const v_28c352 = v_df5bdb >= 160 || v_df5bdb >= v_c4494c;
      v_56b59b({
        top: v_28c352 ? v_64877a + v_c86e33 + 4 : v_64877a - 4,
        left: v_62c214,
        width: v_8e4fb6,
        below: v_28c352,
      });
      v_3cc8fd(true);
    });
  }, []);

  return (
    <View style={[v_d81136.container, v_4affe9]}>
      {v_2869c1 ? <Text style={v_d81136.label}>{v_2869c1}</Text> : null}
      <TouchableOpacity
        ref={v_ff7a13 as v_a3453e.MutableRefObject<v_3094a2>}
        style={[v_d81136.selectBox, { borderRadius: v_f52086 }]}
        onPress={v_8a5603}
        activeOpacity={0.7}
      >
        {v_86ef18 ? <View style={v_d81136.leftIcon}>{v_86ef18}</View> : null}
        <Text style={[v_d81136.selectText, !v_587413 && v_d81136.placeholder]}>
          {v_587413 ? v_587413.label : v_c6baea}
        </Text>
        <Feather
          name={v_207c31 ? "chevron-up" : "chevron-down"}
          size={18}
          color={v_1bfbd0.zinc400}
        />
      </TouchableOpacity>
      {v_74dc8b ? <Text style={v_d81136.errorText}>{v_74dc8b}</Text> : null}

      <Modal visible={v_207c31} transparent animationType="none" onRequestClose={() => v_3cc8fd(false)}>
        <Pressable style={v_d81136.overlay} onPress={() => v_3cc8fd(false)}>
          {v_05241d && (
            <Pressable
              style={[
                v_d81136.dropdown,
                {
                  position: "absolute",
                  top: v_05241d.below ? v_05241d.top : undefined,
                  bottom: v_05241d.below
                    ? undefined
                    : v_700696.get("window").height - v_05241d.top,
                  left: v_05241d.left,
                  width: v_05241d.width,
                  maxHeight: v_79040b,
                },
              ]}
              onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}
            >
              <ScrollView
                style={{ maxHeight: v_79040b }}
                showsVerticalScrollIndicator
                keyboardShouldPersistTaps="handled"
              >
                {v_b36f96.map((v_68b2be, v_e86ad8) => (
                  <TouchableOpacity
                    key={v_68b2be.value}
                    style={[
                      v_d81136.item,
                      v_3b402b === v_68b2be.value && v_d81136.itemActive,
                      v_e86ad8 === v_b36f96.length - 1 && v_d81136.itemLast,
                    ]}
                    onPress={() => {
                      v_b187d9(v_68b2be.value);
                      v_3cc8fd(false);
                    }}
                  >
                    <Text
                      style={[
                        v_d81136.itemText,
                        v_3b402b === v_68b2be.value && v_d81136.itemTextActive,
                      ]}
                    >
                      {v_68b2be.label}
                    </Text>
                    {v_3b402b === v_68b2be.value && (
                      <Feather name="check" size={16} color={v_1bfbd0.zinc900} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Pressable>
          )}
        </Pressable>
      </Modal>
    </View>
  );
}

const v_d81136 = v_472849.create({
  container: { alignSelf: "stretch" },
  label: {
    fontSize: 14,
    color: v_1bfbd0.mutedText,
    marginBottom: v_9b1a04.small / 2,
    fontFamily: v_843035.medium,
  },
  selectBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderWidth: 1,
    borderColor: v_1bfbd0.border,
    backgroundColor: v_1bfbd0.white,
    paddingHorizontal: v_9b1a04.medium,
  },
  leftIcon: { marginRight: v_9b1a04.small },
  selectText: {
    flex: 1,
    fontSize: 16,
    color: v_1bfbd0.text,
    fontFamily: v_843035.regular,
  },
  placeholder: { color: v_1bfbd0.placeholder },
  errorText: {
    marginTop: v_9b1a04.small / 2,
    fontSize: 12,
    color: v_1bfbd0.error,
    fontFamily: v_843035.medium,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.08)",
  },

  dropdown: {
    backgroundColor: v_1bfbd0.white,
    borderRadius: v_8b0c90.md,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    overflow: "hidden",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc100,
  },
  itemActive: { backgroundColor: v_1bfbd0.zinc50 },
  itemLast: { borderBottomWidth: 0 },
  itemText: { fontSize: 14, color: v_1bfbd0.zinc700 },
  itemTextActive: { color: v_1bfbd0.zinc900, fontWeight: "600" },
});
