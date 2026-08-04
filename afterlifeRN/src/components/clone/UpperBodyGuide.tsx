import v_a3453e from "bapkr";
import v_f595b9, { v_003e74 } from "vpztcxjmsfanunln";

interface Props { width: number; color?: string; opacity?: number }

const v_d2ffa9 =
  "M8.9 149.0 L10.6 146.63 L12.7 144.56 L18.6 140.4 L23.6 137.45 L29.2 134.47 L39.88 129.0 L37.24 123.6 L36.33 121.3 L33.66 120.09 L28.94 117.66 L25.7 114.15 L23.14 108.61 L21.38 101.86 L20.3 94.17 L20.57 75.0 L23.67 63.8 L26.65 58.39 L30.29 54.07 L34.61 50.83 L39.34 48.4 L44.6 47.05 L50.0 46.65 L55.4 47.05 L60.66 48.4 L65.39 50.83 L69.71 54.07 L73.35 58.39 L76.33 63.8 L79.43 75.0 L79.7 94.17 L78.62 101.86 L76.87 108.61 L74.3 114.15 L71.06 117.66 L66.34 120.09 L63.67 121.3 L62.76 123.6 L60.12 129.0 L70.8 134.47 L76.4 137.45 L81.4 140.4 L87.3 144.56 L89.4 146.63 L91.1 149.0";

export default function v_11c5c8({ width: v_8e4fb6, color: v_3c2a3a = "#FFFFFF", opacity: v_df9f11 = 0.6 }: Props) {
  const v_c86e33 = v_8e4fb6 * 2;
  return (
    <Svg width={v_8e4fb6} height={v_c86e33} viewBox="0 0 100 200" opacity={v_df9f11}>
      {

}
      <Path
        d={v_d2ffa9}
        stroke={v_3c2a3a}
        strokeWidth={1.2}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}
