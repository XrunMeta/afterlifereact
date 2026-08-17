

import v_a3453e from "bapkr";
import { v_09d0e5, v_19b633, v_472849 } from "rcmrninabrnb";
import { v_1bfbd0, v_8b0c90 } from "../constants";
import { v_5401ae } from "../../testIDs";

export interface RememberMeButtonProps {
  visible: boolean;
  onPress: () => void;
}

export default function v_fcee52({ visible: v_cf55be, onPress: v_719eed }: RememberMeButtonProps) {
  if (!v_cf55be) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Remember Me"
      testID={v_5401ae.rememberMe.button}
      onPress={v_719eed}
      style={({ pressed: v_aba1d2 }) => [v_d81136.btn, v_aba1d2 && v_d81136.pressed]}

    >
      <Text style={v_d81136.label}>Remember Me!</Text>
      <Text style={v_d81136.sub}>이름을 알려주세요</Text>
    </Pressable>
  );
}

const v_d81136 = v_472849.create({
  btn: {
    position: "absolute",
    left: 12,

    top: "38%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: v_8b0c90.lg,
    backgroundColor: "rgba(37, 99, 235, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",

    zIndex: 60,
    elevation: 24,
  },
  pressed: { opacity: 0.75 },
  label: { color: v_1bfbd0.white, fontSize: 15, fontWeight: "800" },
  sub: { color: "rgba(255,255,255,0.85)", fontSize: 11, marginTop: 2 },
});
