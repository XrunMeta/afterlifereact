import v_a3453e, { v_5ab095, v_c4deb2, v_e662ae } from "bapkr";
import { v_3094a2, v_19b633, v_a2349e, v_472849 } from "rcmrninabrnb";
import { v_772971 } from "jmpfvteuuztnp";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_2b51a5 } from "../../navigation/types";

import v_556baf from "../../components/ui/SafeView";
import v_258c1c from "../../components/common/PageHeader";
import v_3183b2 from "../../components/common/StepIndicator";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../../components/constants";
import { v_194498 } from "../../stores/cloneStore";
import v_f81454 from "../../components/common/MissingAssetsModal";

type Props = {
  navigation: v_390fcc<v_2b51a5, "Step6">;
};

export default function v_baac2f({ navigation: v_c65f5d }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const v_f04727 = v_194498(v_fd5f43 => v_fd5f43.creationDraft);
  const v_03a9b2 =
    v_f04727.cloneType === 'memlow' &&
    (!v_f04727.imageFile || (!v_f04727.voiceFile && (v_f04727.recordDuration ?? 0) < 30));
  const [v_4cd8b2, v_294326] = v_5ab095(v_03a9b2);
  const [v_1d049f, v_558bed] = v_5ab095(!v_03a9b2);

  const [v_a63fde, v_6306c3] = v_5ab095(0);
  const v_e05861 = v_e662ae(new v_a2349e.Value(0)).current;

  v_c4deb2(() => {

    v_a2349e.loop(
      v_a2349e.timing(v_e05861, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  v_c4deb2(() => {
    if (!v_1d049f) return;
    const v_ad1d65 = setInterval(() => {
      v_6306c3(v_e2a85c => (v_e2a85c >= 100 ? 100 : v_e2a85c + 2));
    }, 100);
    return () => clearInterval(v_ad1d65);
  }, [v_1d049f]);

  v_c4deb2(() => {
    if (v_a63fde >= 100) {
      const v_cb36b1 = setTimeout(() => v_c65f5d.navigate("Step7"), 500);
      return () => clearTimeout(v_cb36b1);
    }
  }, [v_a63fde]);

  const v_c75b31 = v_e05861.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <SafeView backgroundColor={v_1bfbd0.white}>
      <PageHeader title="클론 생성" />
      <StepIndicator currentStep={5} totalSteps={6} />

      <View style={v_d81136.center}>
        {}
        <View style={v_d81136.ringContainer}>
          <Animated.View style={[v_d81136.outerRing, { transform: [{ rotate: v_c75b31 }] }]}>
            <View style={v_d81136.outerRingInner} />
          </Animated.View>
          <View style={v_d81136.innerCircle}>
            <Text style={v_d81136.progressText}>{v_a63fde}%</Text>
          </View>
        </View>

        <Text style={v_d81136.title}>페르소나를 생성하고 있어요</Text>
        <Text style={v_d81136.subtitle}>약 2~5분 정도 소요됩니다</Text>

        {}
        <View style={v_d81136.barTrack}>
          <View style={[v_d81136.barFill, { width: `${v_a63fde}%` }]} />
        </View>
      </View>
      <MissingAssetsModal
        visible={v_4cd8b2}
        onAddNow={() => {
          v_294326(false);
          v_558bed(false);
          v_c65f5d.navigate('Step3');
        }}
        onLater={() => {
          v_294326(false);
          v_558bed(true);
        }}
      />
    </SafeView>
  );
}

const v_d81136 = v_472849.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: v_9b1a04.xlarge, gap: 16 },
  ringContainer: { width: 140, height: 140, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  outerRing: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: "transparent",
    borderTopColor: v_1bfbd0.violet500,
    borderRightColor: v_1bfbd0.violet500,
  },
  outerRingInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  innerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: v_1bfbd0.zinc50,
    alignItems: "center",
    justifyContent: "center",
  },
  progressText: { fontSize: 28, fontWeight: "bold", color: v_1bfbd0.violet500 },
  title: { fontSize: 18, fontWeight: "700", color: v_1bfbd0.zinc900 },
  subtitle: { fontSize: 14, color: v_1bfbd0.zinc500 },
  barTrack: {
    width: "80%",
    height: 6,
    backgroundColor: v_1bfbd0.zinc200,
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 8,
  },
  barFill: { height: "100%", backgroundColor: v_1bfbd0.violet500, borderRadius: 3 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  labelText: { fontSize: 12, fontWeight: "600", color: v_1bfbd0.violet500 },
});
