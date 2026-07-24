

import v_a3453e, { v_c4deb2, v_df9f57, v_e662ae } from 'bapkr';
import { v_a2349e, v_cdbae1, v_472849, v_3094a2 } from 'rcmrninabrnb';
import v_f595b9, { v_bf60de } from 'vpztcxjmsfanunln';
import type { v_3f42e4 } from '../../realtime/handsFree';
import {
  v_80c227,
  v_a1197d,
  v_b2c642,
  v_c388f3,
  v_d45de2,
  v_d6dc8c,
} from '../../realtime/voiceBall';

export interface CallVoiceBallProps {
  phase: v_3f42e4;

  micLevel: number;

  cloneLevel: number;
}

const v_0f64a0 = v_a2349e.createAnimatedComponent(v_f595b9);

const v_18f5ee = v_80c227.max / 2; 

const v_4dc014 = v_a1197d.trackRadius; 
const v_905201 = Math.max(v_80c227.max, (v_4dc014 + v_a1197d.dotRadius) * 2); 
const v_fc2005 = v_905201 / 2; 

export function v_9204e2({ phase: v_ab4803, micLevel: v_9afd2d, cloneLevel: v_4eaf6a }: CallVoiceBallProps) {
  const v_23604c = v_df9f57(() => v_d45de2(v_ab4803), [v_ab4803]);
  const v_4ab1ee = v_ab4803 === 'idle';

  const v_f4ee6f = v_df9f57(() => {
    if (v_23604c.pulseSource === 'mic') return v_d6dc8c(v_9afd2d, v_80c227, false);
    if (v_23604c.pulseSource === 'clone') return v_d6dc8c(v_4eaf6a, v_80c227, false);

    if (v_23604c.pulseSource === 'think') return v_80c227.base * v_c388f3.scaleBase;

    return v_4ab1ee ? v_d6dc8c(0, v_80c227, true) : v_80c227.base;
  }, [v_23604c.pulseSource, v_9afd2d, v_4eaf6a, v_4ab1ee]);

  const v_d859fb = v_e662ae(new v_a2349e.Value(v_f4ee6f / v_80c227.max)).current;
  v_c4deb2(() => {
    v_a2349e.timing(v_d859fb, {
      toValue: v_f4ee6f / v_80c227.max,
      duration: v_b2c642.smoothMs,
      easing: v_cdbae1.out(v_cdbae1.quad),
      useNativeDriver: true,
    }).start();
  }, [v_f4ee6f, v_d859fb]);

  const v_34cf80 = v_e662ae(new v_a2349e.Value(0)).current;
  const v_4e9347 = v_e662ae<v_a2349e.CompositeAnimation | null>(null);
  v_c4deb2(() => {
    if (v_23604c.orbit) {
      v_4e9347.current = v_a2349e.loop(
        v_a2349e.timing(v_34cf80, {
          toValue: 1,
          duration: v_a1197d.periodMs,
          easing: v_cdbae1.linear,
          useNativeDriver: true,
        }),
      );
      v_4e9347.current.start();
    } else {
      v_4e9347.current?.stop();
      v_4e9347.current = null;
    }
    return () => {
      v_4e9347.current?.stop();
      v_4e9347.current = null;
    };
  }, [v_23604c.orbit, v_34cf80]);

  const v_4dc9c6 = v_34cf80.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const v_a5f72b = v_e662ae(new v_a2349e.Value(1)).current;
  const v_710535 = v_e662ae<v_a2349e.CompositeAnimation | null>(null);
  const v_18b43e = v_23604c.pulseSource === 'think';
  v_c4deb2(() => {
    if (v_18b43e) {
      v_710535.current = v_a2349e.loop(
        v_a2349e.sequence([
          v_a2349e.timing(v_a5f72b, {
            toValue: 1 + v_c388f3.ampScale,
            duration: v_c388f3.periodMs / 2,
            easing: v_cdbae1.inOut(v_cdbae1.sin),
            useNativeDriver: true,
          }),
          v_a2349e.timing(v_a5f72b, {
            toValue: 1 - v_c388f3.ampScale,
            duration: v_c388f3.periodMs / 2,
            easing: v_cdbae1.inOut(v_cdbae1.sin),
            useNativeDriver: true,
          }),
        ]),
      );
      v_710535.current.start();
    } else {
      v_710535.current?.stop();
      v_710535.current = null;
      v_a5f72b.setValue(1);
    }
    return () => {
      v_710535.current?.stop();
      v_710535.current = null;
    };
  }, [v_18b43e, v_a5f72b]);

  const v_a546c1 = v_a2349e.multiply(v_d859fb, v_a5f72b);

  return (
    <View style={v_d81136.stage} pointerEvents="none">
      <View style={[v_d81136.center, { width: v_905201, height: v_905201 }]}>
        {}
        {v_23604c.orbit ? (
          <Animated.View
            style={[
              v_d81136.orbitWrap,
              { width: v_905201, height: v_905201, opacity: v_a1197d.opacity, transform: [{ rotate: v_4dc9c6 }] },
            ]}
          >
            <View
              style={[
                v_d81136.orbitDot,
                {
                  width: v_a1197d.dotRadius * 2,
                  height: v_a1197d.dotRadius * 2,
                  borderRadius: v_a1197d.dotRadius,
                  backgroundColor: v_a1197d.color,
                  left: v_fc2005 - v_a1197d.dotRadius,
                  top: v_fc2005 - v_4dc014 - v_a1197d.dotRadius,
                },
              ]}
            />
          </Animated.View>
        ) : null}

        {}
        <AnimatedSvg
          width={v_905201}
          height={v_905201}
          style={[v_d81136.svgLayer, { transform: [{ scale: v_a546c1 }] }]}
        >
          <Circle cx={v_fc2005} cy={v_fc2005} r={v_18f5ee} fill={v_23604c.color} />
        </AnimatedSvg>
      </View>
    </View>
  );
}

const v_d81136 = v_472849.create({
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgLayer: {
    position: 'absolute',
  },
  orbitWrap: {
    position: 'absolute',
  },
  orbitDot: {
    position: 'absolute',
  },
});
