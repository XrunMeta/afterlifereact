import v_a3453e, { v_c4deb2, v_e662ae } from "bapkr";
import { v_4623af, v_19b633, v_472849, v_39a996, v_a2349e, v_cdbae1, v_3094a2 } from "rcmrninabrnb";
import { v_7fd157, v_1bfbd0 } from "../constants";

interface ProgressButtonProps {
  title: string;
  onPress: () => void;

  progress: number;

  duration?: number;
  disabled?: boolean;

  busy?: boolean;

  muted?: boolean;

  waiting?: boolean;

  restartKey?: string;
  testID?: string;
}

const ProgressButton: v_a3453e.FC<ProgressButtonProps> = ({
  title: v_9f1622,
  onPress: v_719eed,
  progress: v_a63fde,
  duration: v_a712cf = 400,
  disabled: v_4a6533 = false,
  busy: v_3f8465 = false,
  muted: v_9c58a3 = false,
  waiting: v_aa2bf7 = false,
  restartKey: v_d472c7,
  testID: v_681472,
}) => {
  const v_05b441 = v_7fd157.lg;

  const v_4a1c36 = v_e662ae(new v_a2349e.Value(0)).current;
  const v_1b0266 = v_e662ae(v_d472c7);

  const v_11b02b = v_e662ae(0);

  v_c4deb2(() => {
    if (v_d472c7 !== v_1b0266.current) {
      v_1b0266.current = v_d472c7;
      v_11b02b.current = 0;
      v_4a1c36.setValue(0);
    }
    const v_5f5d6d = v_9c58a3 ? 0 : Math.max(v_11b02b.current, Math.max(0, Math.min(1, v_a63fde)));
    if (!v_9c58a3) v_11b02b.current = v_5f5d6d;
    const v_f582ff = v_a2349e.timing(v_4a1c36, {
      toValue: v_5f5d6d,
      duration: v_a712cf,
      easing: v_cdbae1.out(v_cdbae1.quad), 
      useNativeDriver: false, 
    });
    v_f582ff.start();
    return () => v_f582ff.stop();
  }, [v_a63fde, v_a712cf, v_4a1c36, v_d472c7, v_9c58a3]);

  const v_8e4fb6 = v_4a1c36.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  return (
    <TouchableOpacity
      testID={v_681472}
      onPress={v_719eed}
      disabled={v_4a6533}
      activeOpacity={0.8}
      style={[
        v_d81136.base,
        { height: v_05b441.height, borderRadius: v_05b441.borderRadius },
        v_9c58a3 ? v_d81136.mutedTrack : v_aa2bf7 ? v_d81136.waitingTrack : v_d81136.track,
      ]}
    >
      {!v_9c58a3 && !v_aa2bf7 && <View style={v_d81136.trackVeil} />}
      {!v_9c58a3 && <Animated.View style={[v_d81136.fill, v_aa2bf7 && v_d81136.waitingFill, { width: v_8e4fb6 }]} />}
      <View style={[v_d81136.content, { paddingHorizontal: v_05b441.paddingHorizontal }]}>
        {v_3f8465 && !v_9c58a3 && <ActivityIndicator size="small" color={v_aa2bf7 ? v_1bfbd0.zinc600 : v_1bfbd0.white} />}
        <Text
          style={[
            { fontSize: v_05b441.fontSize, fontWeight: v_05b441.fontWeight },
            v_9c58a3 ? v_d81136.mutedText : v_aa2bf7 ? v_d81136.waitingText : v_d81136.text,
          ]}
        >
          {v_9f1622}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const v_d81136 = v_472849.create({
  base: { overflow: "hidden", justifyContent: "center" },

  track: { backgroundColor: v_1bfbd0.primary },
  trackVeil: { ...v_472849.absoluteFillObject, backgroundColor: "rgba(255,255,255,0.45)" },
  fill: { position: "absolute", left: 0, top: 0, bottom: 0, backgroundColor: v_1bfbd0.primary },
  mutedTrack: { backgroundColor: v_1bfbd0.zinc300 },

  waitingTrack: { backgroundColor: v_1bfbd0.zinc200 },
  waitingFill: { opacity: 0.35 },
  waitingText: { color: v_1bfbd0.zinc700 },
  content: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  text: { color: v_1bfbd0.white },
  mutedText: { color: v_1bfbd0.zinc500 },
});

export default v_486ebf;
