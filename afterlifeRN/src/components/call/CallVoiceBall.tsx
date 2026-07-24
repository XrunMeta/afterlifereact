

import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import type { HandsFreePhase } from '../../realtime/handsFree';
import {
  BALL_SIZE,
  BALL_ORBIT,
  BALL_TUNING,
  BALL_THINK,
  ballVisualForPhase,
  radiusForLevel,
} from '../../realtime/voiceBall';

export interface CallVoiceBallProps {
  phase: HandsFreePhase;

  micLevel: number;

  cloneLevel: number;

  sttActive?: boolean;
}

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

const BALL_MAX_RADIUS = BALL_SIZE.max / 2; 

const ORBIT_TRACK_RADIUS = BALL_ORBIT.trackRadius; 
const STAGE = Math.max(BALL_SIZE.max, (ORBIT_TRACK_RADIUS + BALL_ORBIT.dotRadius) * 2); 
const CENTER = STAGE / 2; 

export function CallVoiceBall({ phase, micLevel, cloneLevel, sttActive = true }: CallVoiceBallProps) {
  const visual = useMemo(() => ballVisualForPhase(phase, sttActive), [phase, sttActive]);
  const idle = phase === 'idle';

  const isUserTurn = phase === 'listening' || phase === 'confirming';
  const slideAnim = useRef(new Animated.Value(isUserTurn ? 0 : 1)).current; 
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isUserTurn ? 0 : 1,
      duration: 260,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [isUserTurn, slideAnim]);
  const slideTranslateY = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 96] });
  const slideOpacity = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  const targetDiameter = useMemo(() => {
    if (visual.pulseSource === 'mic') return radiusForLevel(micLevel, BALL_SIZE, false);
    if (visual.pulseSource === 'clone') return radiusForLevel(cloneLevel, BALL_SIZE, false);

    if (visual.pulseSource === 'think') return BALL_SIZE.base * BALL_THINK.scaleBase;

    return idle ? radiusForLevel(0, BALL_SIZE, true) : BALL_SIZE.base;
  }, [visual.pulseSource, micLevel, cloneLevel, idle]);

  const scaleAnim = useRef(new Animated.Value(targetDiameter / BALL_SIZE.max)).current;
  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: targetDiameter / BALL_SIZE.max,
      duration: BALL_TUNING.smoothMs,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [targetDiameter, scaleAnim]);

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);
  useEffect(() => {
    if (visual.orbit) {
      loopRef.current = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: BALL_ORBIT.periodMs,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      loopRef.current.start();
    } else {
      loopRef.current?.stop();
      loopRef.current = null;
    }
    return () => {
      loopRef.current?.stop();
      loopRef.current = null;
    };
  }, [visual.orbit, rotateAnim]);

  const rotateDeg = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const thinkPulseAnim = useRef(new Animated.Value(1)).current;
  const thinkLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const isThinking = visual.pulseSource === 'think';
  useEffect(() => {
    if (isThinking) {
      thinkLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(thinkPulseAnim, {
            toValue: 1 + BALL_THINK.ampScale,
            duration: BALL_THINK.periodMs / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(thinkPulseAnim, {
            toValue: 1 - BALL_THINK.ampScale,
            duration: BALL_THINK.periodMs / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );
      thinkLoopRef.current.start();
    } else {
      thinkLoopRef.current?.stop();
      thinkLoopRef.current = null;
      thinkPulseAnim.setValue(1);
    }
    return () => {
      thinkLoopRef.current?.stop();
      thinkLoopRef.current = null;
    };
  }, [isThinking, thinkPulseAnim]);

  const combinedScale = Animated.multiply(scaleAnim, thinkPulseAnim);

  return (
    <Animated.View
      style={[styles.stage, { opacity: slideOpacity, transform: [{ translateY: slideTranslateY }] }]}
      pointerEvents="none"
    >
      <View style={[styles.center, { width: STAGE, height: STAGE }]}>
        {}
        {visual.orbit ? (
          <Animated.View
            style={[
              styles.orbitWrap,
              { width: STAGE, height: STAGE, opacity: BALL_ORBIT.opacity, transform: [{ rotate: rotateDeg }] },
            ]}
          >
            <View
              style={[
                styles.orbitDot,
                {
                  width: BALL_ORBIT.dotRadius * 2,
                  height: BALL_ORBIT.dotRadius * 2,
                  borderRadius: BALL_ORBIT.dotRadius,
                  backgroundColor: BALL_ORBIT.color,
                  left: CENTER - BALL_ORBIT.dotRadius,
                  top: CENTER - ORBIT_TRACK_RADIUS - BALL_ORBIT.dotRadius,
                },
              ]}
            />
          </Animated.View>
        ) : null}

        {}
        <AnimatedSvg
          width={STAGE}
          height={STAGE}
          style={[styles.svgLayer, { transform: [{ scale: combinedScale }] }]}
        >
          <Circle cx={CENTER} cy={CENTER} r={BALL_MAX_RADIUS} fill={visual.color} />
        </AnimatedSvg>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
