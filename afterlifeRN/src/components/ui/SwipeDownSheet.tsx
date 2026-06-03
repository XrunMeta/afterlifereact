

import v_a3453e, { v_e662ae } from "bapkr";
import { v_a2349e, v_f6c856, v_472849, v_3094a2, type v_7e4944 } from "rcmrninabrnb";

interface Props {
  onClose: () => void;
  style?: v_7e4944 | v_7e4944[];
  children: v_a3453e.ReactNode;

  handleZoneHeight?: number;

  closeThreshold?: number;

  keyboardOffset?: number;
}

export default function v_8e7ad4({
  onClose: v_0890f8,
  style: v_7fa4e4,
  children: v_21f619,
  handleZoneHeight: v_0b30e9 = 48,
  closeThreshold: v_1f95e5 = 60,
  keyboardOffset: v_f92037 = 0,
}: Props) {
  const v_5aac04 = v_e662ae(new v_a2349e.Value(0)).current;

  const v_153714 = v_a2349e.subtract(v_5aac04, v_f92037);

  const v_e7cf0f = v_e662ae(
    v_f6c856.create({

      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,

      onMoveShouldSetPanResponder: (v_37eab7, v_206b88) =>
        v_206b88.dy > 4 && Math.abs(v_206b88.dy) > Math.abs(v_206b88.dx),
      onMoveShouldSetPanResponderCapture: (v_37eab7, v_206b88) =>
        v_206b88.dy > 4 && Math.abs(v_206b88.dy) > Math.abs(v_206b88.dx),
      onPanResponderMove: (v_37eab7, v_206b88) => {
        if (v_206b88.dy > 0) v_5aac04.setValue(v_206b88.dy);
      },
      onPanResponderRelease: (v_37eab7, v_206b88) => {
        if (v_206b88.dy > v_1f95e5 || v_206b88.vy > 0.5) {

          v_a2349e.timing(v_5aac04, {
            toValue: 600,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            v_5aac04.setValue(0);
            v_0890f8();
          });
        } else {

          v_a2349e.spring(v_5aac04, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        v_a2349e.spring(v_5aac04, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 4,
        }).start();
      },

      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  return (
    <Animated.View
      style={[
        Array.isArray(v_7fa4e4) ? v_7fa4e4 : v_7fa4e4 ? [v_7fa4e4] : [],

        { transform: [{ translateY: v_153714 }] },
      ]}

      onStartShouldSetResponder={() => true}
    >
      {}
      <View
        {...v_e7cf0f.panHandlers}
        style={[v_d81136.handleZone, { height: v_0b30e9 }]}
      />
      {v_21f619}
    </Animated.View>
  );
}

const v_d81136 = v_472849.create({

  handleZone: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
});
