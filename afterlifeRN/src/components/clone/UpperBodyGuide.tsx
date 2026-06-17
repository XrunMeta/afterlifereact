import v_a3453e from "bapkr";
import v_f595b9, { v_bf60de, v_003e74 } from "vpztcxjmsfanunln";

interface Props { width: number; color?: string; opacity?: number }

export default function v_11c5c8({ width: v_8e4fb6, color: v_3c2a3a = "#FFFFFF", opacity: v_df9f11 = 0.6 }: Props) {
  const v_c86e33 = v_8e4fb6 * 2;
  return (
    <Svg width={v_8e4fb6} height={v_c86e33} viewBox="0 0 100 200" opacity={v_df9f11}>
      <Circle cx="50" cy="48" r="24" stroke={v_3c2a3a} strokeWidth="2.5" fill="none" />
      <Path
        d="M14 200 C14 150 26 120 50 120 C74 120 86 150 86 200"
        stroke={v_3c2a3a}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}
