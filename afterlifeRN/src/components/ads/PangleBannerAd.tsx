

import v_a3453e, { v_c4deb2 } from "bapkr";
import {
  v_326be8,
  v_3094a2,
  v_19b633,
  v_472849,
  v_027028,
  v_7e4944,
  v_961e77,
} from "rcmrninabrnb";
import { v_772971 } from "jmpfvteuuztnp";
import { v_f095b0 } from "../../lib/pangle";
import { v_1bfbd0 } from "../constants";

type Props = {
  adUnitId: string;
  style?: v_961e77<v_7e4944>;
};

type NativeProps = {
  adUnitId: string;
  style?: v_961e77<v_7e4944>;
};

const v_ec44be = "PangleBannerAdView";
const v_db6966 =
  v_326be8.OS === "android"
    ? v_027028<NativeProps>(v_ec44be)
    : null;

console.log(
  `[PangleBannerAd][module] platform=${v_326be8.OS} nativeComponent=${!!v_db6966}`,
);

export default function v_fb73af({ adUnitId: v_61418d, style: v_7fa4e4 }: Props) {
  const { t: v_8d41d7 } = v_772971();

  const v_86668d =
    v_326be8.OS !== "android"
      ? "fallback-ios"
      : !v_db6966
        ? "fallback-no-native"
        : !v_61418d
          ? "fallback-no-unit"
          : "native";
  console.log(
    `[PangleBannerAd][render] branch=${v_86668d} adUnitId=${v_61418d || "(empty)"}`,
  );

  v_c4deb2(() => {
    if (v_326be8.OS !== "android") return;
    if (!v_61418d) return;
    console.log(`[PangleBannerAd][effect] initializePangle 호출 adUnitId=${v_61418d}`);
    void v_f095b0()
      .then((v_3ed4c3) => {
        console.log(`[PangleBannerAd][effect] initializePangle → ${v_3ed4c3}`);
      })
      .catch((v_49263d) => {
        console.warn("[PangleBannerAd] init 실패:", (v_49263d as Error)?.message ?? v_49263d);
      });
  }, [v_61418d]);

  if (v_326be8.OS !== "android" || !v_db6966) {
    return (
      <View style={[v_d81136.fallback, v_7fa4e4]}>
        <Text style={v_d81136.fallbackText}>{v_8d41d7("chat.adBannerFallback")}</Text>
      </View>
    );
  }

  if (!v_61418d) {
    return <View style={[v_d81136.fallback, v_7fa4e4]} />;
  }

  return <PangleBannerAdNative adUnitId={v_61418d} style={v_7fa4e4} />;
}

const v_d81136 = v_472849.create({
  fallback: {
    backgroundColor: v_1bfbd0.violet600,
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  fallbackText: { color: v_1bfbd0.white, fontSize: 15, fontWeight: "600" },
});
