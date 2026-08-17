

import v_a3453e from "bapkr";
import { v_3094a2, v_19b633, v_472849 } from "rcmrninabrnb";
import v_f595b9, { v_bf60de, v_003e74 } from "vpztcxjmsfanunln";
import { v_772971 } from "jmpfvteuuztnp";
import { v_5401ae } from "../../testIDs";

const v_26347b = "#D4A017";
const v_bca03f = "#F0C64A";

export default function v_8fba67({ size: v_05b441 = 44 }: { size?: number }) {
  const { t: v_8d41d7 } = v_772971();
  const v_65a2cd = v_05b441 * 1.5; 
  return (
    <View testID={v_5401ae.expertBadge.badge} style={{ width: v_05b441, height: v_65a2cd }}>
      <Svg width={v_05b441} height={v_65a2cd} viewBox="0 0 44 66">
        {}
        <Path d="M14 36 L11 62 L18 54 L22 64 Z" fill={v_26347b} />
        <Path d="M30 36 L33 62 L26 54 L22 64 Z" fill={v_bca03f} />
        {}
        <Circle cx="22" cy="22" r="21" fill={v_26347b} />
        <Circle cx="22" cy="22" r="17" fill={v_bca03f} />
        <Circle cx="22" cy="22" r="14" fill={v_26347b} />
      </Svg>
      <View style={[v_d81136.labelWrap, { width: v_05b441, height: v_05b441 }]}>
        <Text style={[v_d81136.label, { fontSize: v_05b441 * 0.26 }]}>{v_8d41d7("common.expertBadge", { defaultValue: "전문가" })}</Text>
      </View>
    </View>
  );
}

const v_d81136 = v_472849.create({
  labelWrap: { position: "absolute", top: 0, alignItems: "center", justifyContent: "center" },
  label: { color: "#FFFFFF", fontWeight: "700" },
});
