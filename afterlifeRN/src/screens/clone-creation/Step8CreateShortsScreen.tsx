import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CreateStackParamList } from '../../navigation/types';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../stores/authStore';
import type { ShortStatus } from '../../types/domain';

type Props = NativeStackScreenProps<CreateStackParamList, 'Step8'>;

export default function Step8CreateShortsScreen({ route, navigation }: Props) {
  const cloneId = route.params.cloneId;
  const viewerId = useAuthStore((s) => s.user?.id) ?? 1;
  const [status, setStatus] = useState<ShortStatus>('queued');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [shortId, setShortId] = useState<number | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    setStatus('queued');
    setMediaUrl(null);
    setForbidden(false);
    apiClient
      .generateShort(cloneId, viewerId)
      .then(({ shortId: id }) => setShortId(id))
      .catch((e) => {
        if (String(e?.message ?? '').includes('Forbidden')) {
          setForbidden(true);
        } else {
          setStatus('failed');
        }
      });
  };

  useEffect(() => {
    start();

  }, [cloneId, viewerId]);

  useEffect(() => {
    if (shortId == null) return;
    const tick = async () => {
      try {
        const s = await apiClient.getShort(shortId);
        setStatus(s.status);
        setMediaUrl(s.mediaUrl);
        if ((s.status === 'ready' || s.status === 'failed') && timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } catch {
        setStatus('failed');
      }
    };
    timerRef.current = setInterval(tick, 250);
    tick();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [shortId]);

  const goHome = () => {
    navigation
      .getParent()
      ?.dispatch(CommonActions.navigate({ name: 'HomeTab' }));
  };

  if (forbidden) {
    return (
      <View style={styles.root}>
        <Text style={styles.title}>소개 영상</Text>
        <View accessibilityLabel="step8-forbidden" style={styles.center}>
          <Text style={styles.muted}>이 클론의 소유자만 영상을 만들 수 있어요.</Text>
        </View>
        <TouchableOpacity
          accessibilityLabel="step8-skip"
          onPress={goHome}
          style={styles.btn}
        >
          <Text>홈으로</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>소개 영상</Text>
      {status === 'ready' ? (
        <View accessibilityLabel="step8-preview" style={styles.center}>
          <Text style={styles.muted}>{mediaUrl ?? '(preview)'}</Text>
        </View>
      ) : (
        <View accessibilityLabel="step8-progress" style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.muted}>생성 중… ({status})</Text>
        </View>
      )}
      <View style={styles.row}>
        <TouchableOpacity
          accessibilityLabel="step8-skip"
          onPress={goHome}
          style={styles.btn}
        >
          <Text>건너뛰기</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel="step8-retry"
          onPress={start}
          style={styles.btn}
        >
          <Text>다시 생성</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel="step8-done"
          disabled={status !== 'ready'}
          onPress={goHome}
          style={[styles.btn, status !== 'ready' && styles.btnDisabled]}
        >
          <Text>완료</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 24 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: '#6b7280' },
  row: { flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  btn: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
});
