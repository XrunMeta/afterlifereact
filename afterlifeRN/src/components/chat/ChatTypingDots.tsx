
import v_a3453e, { v_c4deb2, v_e662ae } from "bapkr";
import { v_a2349e, v_cdbae1, v_472849, v_3094a2 } from "rcmrninabrnb";
import { v_1bfbd0 } from "../constants";

const v_3c2d3d = 7;
const v_e9884a = 900;

type Props = {
  color?: string;
  size?: number;
};

export default function v_992d42({
  color: v_3c2a3a = v_1bfbd0.secondary,
  size: v_05b441 = v_3c2d3d,
}: Props) {
  const v_55780c = v_e662ae(new v_a2349e.Value(0)).current;
  const v_6a1bfb = v_e662ae(new v_a2349e.Value(0)).current;
  const v_aab094 = v_e662ae(new v_a2349e.Value(0)).current;

  v_c4deb2(() => {
    const v_021858 = (v: v_a2349e.Value, v_4b24d2) =>
      v_a2349e.loop(
        v_a2349e.sequence([
          v_a2349e.delay(v_4b24d2),
          v_a2349e.timing(v_81e2ef, {
            toValue: 1,
            duration: v_e9884a / 3,
            easing: v_cdbae1.out(v_cdbae1.quad),
            useNativeDriver: true,
          }),
          v_a2349e.timing(v_81e2ef, {
            toValue: 0,
            duration: v_e9884a / 3,
            easing: v_cdbae1.in(v_cdbae1.quad),
            useNativeDriver: true,
          }),
          v_a2349e.delay(v_e9884a / 3),
        ]),
      );

    const v_506870 = [
      v_021858(v_55780c, 0),
      v_021858(v_6a1bfb, v_e9884a / 6),
      v_021858(v_aab094, v_e9884a / 3),
    ];
    v_506870.forEach((v_1614db) => v_1614db.start());
    return () => v_506870.forEach((v_1614db) => v_1614db.stop());
  }, [v_55780c, v_6a1bfb, v_aab094]);

  const v_55ba94 = (v: v_a2349e.Value) => ({
    width: v_05b441,
    height: v_05b441,
    borderRadius: v_05b441 / 2,
    backgroundColor: v_3c2a3a,
    opacity: v_81e2ef.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
    transform: [
      {
        translateY: v_81e2ef.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -3],
        }),
      },
      {
        scale: v_81e2ef.interpolate({
          inputRange: [0, 1],
          outputRange: [0.85, 1.05],
        }),
      },
    ],
  });

  return (
    <View style={v_d81136.row} accessibilityLabel="typing">
      <Animated.View style={v_55ba94(v_55780c)} />
      <Animated.View style={v_55ba94(v_6a1bfb)} />
      <Animated.View style={v_55ba94(v_aab094)} />
    </View>
  );
}

const v_d81136 = v_472849.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 4,
    paddingVertical: 2,
    minHeight: 18,
  },
});
