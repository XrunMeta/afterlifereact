

import v_a3453e from "bapkr";
import { v_3094a2, v_19b633, v_472849 } from "rcmrninabrnb";
import { v_772971 } from "jmpfvteuuztnp";

export interface AiBadgeProps {

  size?: "sm" | "md";
}

export default function v_53fcee({ size: v_05b441 = "sm" }: AiBadgeProps) {
  const { t: v_8d41d7 } = v_772971();
  const v_7fa4e4 = v_05b441 === "md" ? v_d81136.pillMd : v_d81136.pillSm;
  const v_197d6e = v_05b441 === "md" ? v_d81136.textMd : v_d81136.textSm;
  return (
    <View
      testID="ai-badge"
      style={v_7fa4e4}
      accessible
      accessibilityLabel={v_8d41d7("common.aiBadgeA11y", { defaultValue: "AI 생성 클론" })}
    >
      <Text style={v_197d6e}>{v_8d41d7("common.aiBadge", { defaultValue: "AI" })}</Text>
    </View>
  );
}

const v_d81136 = v_472849.create({
  pillSm: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: "#18181b",
    alignSelf: "center",
  },
  pillMd: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: "#18181b",
    alignSelf: "center",
  },
  textSm: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  textMd: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
