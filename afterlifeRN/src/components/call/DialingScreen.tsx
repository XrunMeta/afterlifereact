

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../constants';
import type { LiveAvatarState } from '../../realtime/avatarCall';
import { dialingOutcome, DEFAULT_DIALING_CONFIG } from '../../realtime/dialingTransition';
import { useCallSounds } from '../../realtime/useCallSounds';

const MAX_RETRIES = 2;
const RETRY_GRACE_MS = 1500;

export function DialingScreen(props: {
  liveState: LiveAvatarState;
  personaName: string;
  personaImage: string;
  onConnected: () => void;
  onCancel: () => void;
  onRetry: () => void;

  greetingStarted?: boolean;
}) {
  const { liveState, personaName, personaImage, greetingStarted, onConnected, onCancel, onRetry } = props;
  const { t } = useTranslation();
  const startRef = useRef(Date.now());
  const graceUntilRef = useRef(0);
  const [retryCount, setRetryCount] = useState(0);
  const [now, setNow] = useState(Date.now());
  const sounds = useCallSounds();

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const elapsed = now - startRef.current;

  const inGrace = now < graceUntilRef.current;
  const rawOutcome = dialingOutcome(liveState, elapsed, DEFAULT_DIALING_CONFIG, greetingStarted);

  const outcome = inGrace && rawOutcome !== 'connected' ? 'dialing' : rawOutcome;

  useEffect(() => {
    sounds.startDialingTone();
    return () => sounds.stopDialingTone();

  }, []);

  const connectedRef = useRef(false);
  useEffect(() => {
    if (outcome === 'connected' && !connectedRef.current) {
      connectedRef.current = true;
      sounds.playConnect();
      onConnected();
    }
  }, [outcome, sounds, onConnected]);

  useEffect(() => {
    if (outcome === 'timeout' || outcome === 'error') sounds.stopDialingTone();
  }, [outcome, sounds]);

  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  const failed = outcome === 'timeout' || outcome === 'error';
  const exhausted = !inGrace && failed && retryCount >= MAX_RETRIES; 

  const handleRetry = () => {
    startRef.current = Date.now();
    graceUntilRef.current = Date.now() + RETRY_GRACE_MS;
    connectedRef.current = false;
    setRetryCount((c) => c + 1);
    sounds.startDialingTone();
    onRetry();
  };

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.name}>{personaName}</Text>
        <Text style={styles.sub}>
          {exhausted
            ? t('call.connectExhausted', { defaultValue: '지금은 연결이 어려워요\n잠시 후 다시 시도해 주세요' })
            : outcome === 'error'
            ? t('call.connectFailed', { defaultValue: '연결에 실패했어요' })
            : outcome === 'timeout'
            ? t('call.connectDelayed', { defaultValue: '연결이 지연돼요' })
            : t('call.dialing', { defaultValue: '전화 거는 중...' })}
        </Text>
      </View>

      <View style={styles.avatarWrap}>
        <Animated.View
          style={[styles.ring, { transform: [{ scale: ringScale }], opacity: ringOpacity }]}
        />
        {

}
        <View style={[styles.avatar, styles.avatarFallback]} />
        {personaImage ? (
          <Image
            source={{ uri: personaImage }}
            style={[styles.avatar, styles.avatarOverlay]}
          />
        ) : null}
      </View>

      <View style={styles.actions}>
        {exhausted ? (

          <TouchableOpacity style={[styles.btn, styles.end]} onPress={onCancel}>
            <Feather name="x" size={26} color={COLORS.white} />
          </TouchableOpacity>
        ) : failed ? (
          <>
            <TouchableOpacity style={[styles.btn, styles.retry]} onPress={handleRetry}>
              <Feather name="phone-call" size={26} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.end]} onPress={onCancel}>
              <Feather
                name="phone"
                size={26}
                color={COLORS.white}
                style={{ transform: [{ rotate: '135deg' }] }}
              />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={[styles.btn, styles.end]} onPress={onCancel}>
            <Feather
              name="phone"
              size={28}
              color={COLORS.white}
              style={{ transform: [{ rotate: '135deg' }] }}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.zinc950,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
  },
  info: { position: 'absolute', top: '20%', alignItems: 'center', paddingHorizontal: 24 },
  name: { fontSize: 22, fontWeight: '700', color: COLORS.white, marginBottom: 8 },
  sub: {
    fontSize: 13,
    color: COLORS.zinc300,
    letterSpacing: 1,
    textAlign: 'center',
    lineHeight: 20,
  },
  avatarWrap: { alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 96, height: 96, borderRadius: 48 },

  avatarFallback: { position: 'absolute', backgroundColor: COLORS.zinc700 },
  avatarOverlay: { position: 'absolute' },
  ring: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: 'rgba(120,160,230,0.6)',
  },
  actions: { position: 'absolute', bottom: '14%', flexDirection: 'row', gap: 32 },
  btn: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  end: { backgroundColor: COLORS.error },
  retry: { backgroundColor: COLORS.violet500 },
});
