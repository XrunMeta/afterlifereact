

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import type { HandsFreePhase } from '../../realtime/handsFree';
import { glowColorForPhase } from '../../realtime/callStatusColor';

const IDLE_BORDER = 'rgba(120,120,140,0.25)';

export function CallStatusGlow({ phase }: { phase: HandsFreePhase }) {
  const color = glowColorForPhase(phase);

  const opacity = useRef(new Animated.Value(color ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: color ? 1 : 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [color, opacity]);

  const c = color ?? 'rgba(0,0,0,0)';

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {}
      <View style={[StyleSheet.absoluteFill, styles.idleBorder]} />
      {}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.glow,
          { borderColor: c, shadowColor: c, opacity },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  idleBorder: {
    borderWidth: 2,
    borderColor: IDLE_BORDER,
  },
  glow: {
    borderWidth: 3,

    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 18,
  },
});
