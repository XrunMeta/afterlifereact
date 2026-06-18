

import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { HandsFreePhase } from '../../realtime/handsFree';
import { glowColorForPhase } from '../../realtime/callStatusColor';

const GLOW_SIZE = 20; 
const GLOW_ALPHA = 0.3; 

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function CallStatusGlow({ phase, sttActive = true }: { phase: HandsFreePhase; sttActive?: boolean }) {
  const color = glowColorForPhase(phase, sttActive);
  const opacity = useRef(new Animated.Value(color ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: color ? 1 : 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [color, opacity]);

  const c = color ?? '#000000';
  const colorStart = hexToRgba(c, GLOW_ALPHA);
  const colorEnd = 'rgba(0,0,0,0)';

  const { width: W, height: H } = Dimensions.get('window');

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
        {}
        <LinearGradient
          colors={[colorStart, colorEnd]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.side, { top: 0, left: 0, right: 0, height: GLOW_SIZE }]}
        />
        {}
        <LinearGradient
          colors={[colorStart, colorEnd]}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
          style={[styles.side, { bottom: 0, left: 0, right: 0, height: GLOW_SIZE }]}
        />
        {}
        <LinearGradient
          colors={[colorStart, colorEnd]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.side, { top: 0, bottom: 0, left: 0, width: GLOW_SIZE }]}
        />
        {}
        <LinearGradient
          colors={[colorStart, colorEnd]}
          start={{ x: 1, y: 0.5 }}
          end={{ x: 0, y: 0.5 }}
          style={[styles.side, { top: 0, bottom: 0, right: 0, width: GLOW_SIZE }]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  side: {
    position: 'absolute',
  },
});
