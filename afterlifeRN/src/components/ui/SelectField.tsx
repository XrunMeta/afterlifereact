import v_a3453e, { v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_4623af,
  v_aa7413,
  v_09d0e5,
  v_472849,
  v_961e77,
  v_7e4944,
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
}

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
}: SelectFieldProps<T>) {
  const [v_207c31, v_3cc8fd] = v_5ab095(false);
  const v_587413 = v_b36f96.find((v_b6c474) => v_b6c474.value === v_3b402b);

  return (
    <View style={[v_d81136.container, v_4affe9]}>
      {v_2869c1 ? <Text style={v_d81136.label}>{v_2869c1}</Text> : null}
      <TouchableOpacity
        style={[v_d81136.selectBox, { borderRadius: v_f52086 }]}
        onPress={() => v_3cc8fd(true)}
        activeOpacity={0.7}
      >
        {v_86ef18 ? <View style={v_d81136.leftIcon}>{v_86ef18}</View> : null}
        <Text style={[v_d81136.selectText, !v_587413 && v_d81136.placeholder]}>
          {v_587413 ? v_587413.label : v_c6baea}
        </Text>
        <Feather name="chevron-down" size={18} color={v_1bfbd0.zinc400} />
      </TouchableOpacity>
      {v_74dc8b ? <Text style={v_d81136.errorText}>{v_74dc8b}</Text> : null}

      <Modal visible={v_207c31} transparent animationType="fade">
        <Pressable style={v_d81136.overlay} onPress={() => v_3cc8fd(false)}>
          <Pressable style={v_d81136.dropdownBox} onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}>
            {v_b36f96.map((v_68b2be, v_e86ad8) => (
              <TouchableOpacity
                key={v_68b2be.value}
                style={[
                  v_d81136.item,
                  v_3b402b === v_68b2be.value && v_d81136.itemActive,
                  v_e86ad8 === v_b36f96.length - 1 && v_d81136.itemLast,
                ]}
                onPress={() => { v_b187d9(v_68b2be.value); v_3cc8fd(false); }}
              >
                <Text style={[v_d81136.itemText, v_3b402b === v_68b2be.value && v_d81136.itemTextActive]}>
                  {v_68b2be.label}
                </Text>
                {v_3b402b === v_68b2be.value && <Feather name="check" size={16} color={v_1bfbd0.zinc900} />}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const v_d81136 = v_472849.create({
  container: {
    alignSelf: "stretch",
  },
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
  leftIcon: {
    marginRight: v_9b1a04.small,
  },
  selectText: {
    flex: 1,
    fontSize: 16,
    color: v_1bfbd0.text,
    fontFamily: v_843035.regular,
  },
  placeholder: {
    color: v_1bfbd0.placeholder,
  },
  errorText: {
    marginTop: v_9b1a04.small / 2,
    fontSize: 12,
    color: v_1bfbd0.error,
    fontFamily: v_843035.medium,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  dropdownBox: {
    backgroundColor: v_1bfbd0.white,
    borderRadius: v_8b0c90.lg,
    width: "100%",
    maxWidth: 320,
    overflow: "hidden",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc100,
  },
  itemActive: {
    backgroundColor: v_1bfbd0.zinc50,
  },
  itemLast: {
    borderBottomWidth: 0,
  },
  itemText: {
    fontSize: 15,
    color: v_1bfbd0.zinc700,
  },
  itemTextActive: {
    color: v_1bfbd0.zinc900,
    fontWeight: "600",
  },
});
