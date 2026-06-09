

import v_a3453e, { v_c4deb2, v_e662ae } from 'bapkr';
import { v_a2349e, v_472849, v_3094a2 } from 'rcmrninabrnb';
import type { v_3f42e4 } from '../../realtime/handsFree';
import { v_972fad } from '../../realtime/callStatusColor';

const v_527247 = 'rgba(120,120,140,0.25)';

export function v_8bbe5d({ phase: v_ab4803 }: { phase: v_3f42e4 }) {
  const v_3c2a3a = v_972fad(v_ab4803);

  const v_df9f11 = v_e662ae(new v_a2349e.Value(v_3c2a3a ? 1 : 0)).current;
  v_c4deb2(() => {
    v_a2349e.timing(v_df9f11, {
      toValue: v_3c2a3a ? 1 : 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [v_3c2a3a, v_df9f11]);

  const v_3f4e2e = v_3c2a3a ?? 'rgba(0,0,0,0)';

  return (
    <View pointerEvents="none" style={v_472849.absoluteFill}>
      {}
      <View style={[v_472849.absoluteFill, v_d81136.idleBorder]} />
      {}
      <Animated.View
        style={[
          v_472849.absoluteFill,
          v_d81136.glow,
          { borderColor: v_3f4e2e, shadowColor: v_3f4e2e, opacity: v_df9f11 },
        ]}
      />
    </View>
  );
}

const v_d81136 = v_472849.create({
  idleBorder: {
    borderWidth: 2,
    borderColor: v_527247,
  },
  glow: {
    borderWidth: 3,

    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 18,
  },
});
