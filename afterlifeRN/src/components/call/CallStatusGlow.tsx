

import v_a3453e, { v_c4deb2, v_e662ae } from 'bapkr';
import { v_a2349e, v_700696, v_472849, v_3094a2 } from 'rcmrninabrnb';
import { v_5ade23 } from 'xbfwaaanosqvazmrqoah';
import type { v_3f42e4 } from '../../realtime/handsFree';
import { v_972fad } from '../../realtime/callStatusColor';

const v_f97188 = 20; 
const v_1d26fe = 0.3; 

function v_b2c6eb(v_993b31, v_6d68e5): string {
  const v_65a2cd = v_993b31.replace('#', '');
  const v_cb35cb = parseInt(v_65a2cd.substring(0, 2), 16);
  const v_206b88 = parseInt(v_65a2cd.substring(2, 4), 16);
  const v_148ff6 = parseInt(v_65a2cd.substring(4, 6), 16);
  return `rgba(${v_cb35cb},${v_206b88},${v_148ff6},${v_6d68e5})`;
}

export function v_8bbe5d({
  phase: v_ab4803,
  sttActive: v_b3ae82 = true,
  suppressed: v_e43075 = false,
}: {
  phase: v_3f42e4;
  sttActive?: boolean;
  suppressed?: boolean;
}) {
  const v_3c2a3a = v_972fad(v_ab4803, v_b3ae82, v_e43075);
  const v_df9f11 = v_e662ae(new v_a2349e.Value(v_3c2a3a ? 1 : 0)).current;

  v_c4deb2(() => {
    v_a2349e.timing(v_df9f11, {
      toValue: v_3c2a3a ? 1 : 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [v_3c2a3a, v_df9f11]);

  const v_3f4e2e = v_3c2a3a ?? '#000000';
  const v_577606 = v_b2c6eb(v_3f4e2e, v_1d26fe);
  const v_6ce415 = 'rgba(0,0,0,0)';

  const { width: v_956afe, height: v_65f6fa } = v_700696.get('window');

  return (
    <View pointerEvents="none" style={v_472849.absoluteFill}>
      <Animated.View style={[v_472849.absoluteFill, { opacity: v_df9f11 }]}>
        {}
        <LinearGradient
          colors={[v_577606, v_6ce415]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[v_d81136.side, { top: 0, left: 0, right: 0, height: v_f97188 }]}
        />
        {}
        <LinearGradient
          colors={[v_577606, v_6ce415]}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
          style={[v_d81136.side, { bottom: 0, left: 0, right: 0, height: v_f97188 }]}
        />
        {}
        <LinearGradient
          colors={[v_577606, v_6ce415]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[v_d81136.side, { top: 0, bottom: 0, left: 0, width: v_f97188 }]}
        />
        {}
        <LinearGradient
          colors={[v_577606, v_6ce415]}
          start={{ x: 1, y: 0.5 }}
          end={{ x: 0, y: 0.5 }}
          style={[v_d81136.side, { top: 0, bottom: 0, right: 0, width: v_f97188 }]}
        />
      </Animated.View>
    </View>
  );
}

const v_d81136 = v_472849.create({
  side: {
    position: 'absolute',
  },
});
