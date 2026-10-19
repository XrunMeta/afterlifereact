

import v_a3453e, { v_b0de9c, v_c4deb2, v_5ab095, type v_4a8ba2 } from "bapkr";
import {
  v_18ba07,
  v_326be8,
  v_bfa1d6,
  v_3094a2,
  v_19b633,
  v_472849,
  v_027028,
  v_7e4944,
  v_961e77,
} from "rcmrninabrnb";
import { v_772971 } from "jmpfvteuuztnp";
import { v_51e8dd, v_85b8ef } from "tgjb";
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

function v_eadb63(): boolean {

  if (v_326be8.OS === "ios") {
    try {
      return v_51e8dd("PangleModule") != null;
    } catch {
      return false;
    }
  }
  if (v_326be8.OS !== "android") return false;
  try {
    const v_89b3da = v_bfa1d6 as typeof v_bfa1d6 & {
      hasViewManagerConfig?: (name: string) => boolean;
      getViewManagerConfig?: (name: string) => unknown;
    };
    if (typeof v_89b3da.hasViewManagerConfig === "function") {
      return v_89b3da.hasViewManagerConfig(v_ec44be) === true;
    }
    if (typeof v_89b3da.getViewManagerConfig === "function") {
      return v_89b3da.getViewManagerConfig(v_ec44be) != null;
    }
    return (v_89b3da as Record<string, unknown>)[v_ec44be] != null;
  } catch {
    return false;
  }
}

const v_355b08 = v_eadb63();

type NativeBanner = v_a3453e.ComponentType<NativeProps>;
const v_2e931d = globalThis as typeof globalThis & { __pangleBannerNative?: NativeBanner | null };
if (v_2e931d.__pangleBannerNative === undefined) {
  v_2e931d.__pangleBannerNative = !v_355b08
    ? null
    : v_326be8.OS === "ios"
      ? (v_85b8ef("PangleModule") as NativeBanner)
      : (v_027028<NativeProps>(v_ec44be) as unknown as NativeBanner);
}
const v_db6966 = v_2e931d.__pangleBannerNative;

console.log(
  `[PangleBannerAd][module] platform=${v_326be8.OS} nativeAvailable=${v_355b08}`,
);

const v_35934d = globalThis as typeof globalThis & { __pangleBannerDebugSub?: boolean };
if (v_326be8.OS === "android" && !v_35934d.__pangleBannerDebugSub) {
  v_35934d.__pangleBannerDebugSub = true;
  v_18ba07.addListener("PangleBannerDebug", (v_9e86fd) => {
    console.log("[PangleBannerAd][native]", JSON.stringify(v_9e86fd));
  });
}

type BoundaryProps = { fallback: v_4a8ba2; children: v_4a8ba2 };
type BoundaryState = { failed: boolean };

class v_07f4de extends v_b0de9c<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(v_49263d) {
    console.warn("[PangleBannerAd] native render failed → fallback:", v_49263d?.message ?? v_49263d);
  }

  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

function v_ef0f29({ style: v_7fa4e4, label: v_2869c1 }: { style?: v_961e77<v_7e4944>; label?: string }) {
  return (
    <View style={[v_d81136.fallback, v_7fa4e4]}>
      {v_2869c1 ? <Text style={v_d81136.fallbackText}>{v_2869c1}</Text> : null}
    </View>
  );
}

export default function v_fb73af({ adUnitId: v_61418d, style: v_7fa4e4 }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const v_4281e6 = v_8d41d7("chat.adBannerFallback");
  const v_0debf4 = <FallbackBanner style={v_7fa4e4} label={v_4281e6} />;

  const [v_ae4a03, v_7ab0cc] = v_5ab095(false);
  v_c4deb2(() => {
    if (v_326be8.OS !== "android" && v_326be8.OS !== "ios") return;
    if (!v_61418d) return;
    if (!v_355b08) return;
    let v_2008a4 = false;
    let v_cb36b1 = null;
    const v_bc21cd = async (v_f4e98d) => {
      const v_3ed4c3 = await v_f095b0().catch((v_49263d) => {
        console.warn("[PangleBannerAd] init 실패:", (v_49263d as Error)?.message ?? v_49263d);
        return false;
      });
      if (v_2008a4) return;
      if (v_3ed4c3) v_7ab0cc(true);
      else if (v_f4e98d < 3) v_cb36b1 = setTimeout(() => void v_bc21cd(v_f4e98d + 1), 3000);
    };
    void v_bc21cd(1);
    return () => {
      v_2008a4 = true;
      if (v_cb36b1) clearTimeout(v_cb36b1);
    };
  }, [v_61418d]);

  if ((v_326be8.OS !== "android" && v_326be8.OS !== "ios") || !v_db6966 || !v_61418d || !v_ae4a03) {
    return v_0debf4;
  }

  return (
    <BannerErrorBoundary fallback={v_0debf4}>
      <PangleBannerAdNative adUnitId={v_61418d} style={v_7fa4e4} />
    </BannerErrorBoundary>
  );
}

const v_d81136 = v_472849.create({
  fallback: {
    backgroundColor: v_1bfbd0.zinc300,
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  fallbackText: { color: v_1bfbd0.zinc700, fontSize: 15, fontWeight: "600" },
});
