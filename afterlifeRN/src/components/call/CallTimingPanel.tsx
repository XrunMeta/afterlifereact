

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { useTimingConfigStore, TIMING_BOUNDS, type TimingConfig } from '../../realtime/timingConfig';

const KEYS: Array<keyof TimingConfig> = ['sttEndpointMs', 'echoGateMs', 'cloneResumeMs', 'cloneTailGraceMs'];

export const CallTimingPanel: React.FC<{
  onForceListen: () => void;

  micOn: boolean;

  onToggleMic: () => void;
}> = ({ onForceListen, micOn, onToggleMic }) => {
  const [open, setOpen] = useState(false);
  const cfg = useTimingConfigStore();
  const setField = useTimingConfigStore((s) => s.setField);
  const reset = useTimingConfigStore((s) => s.reset);
  const confirmGateEnabled = useTimingConfigStore((s) => s.confirmGateEnabled);
  const setConfirmGateEnabled = useTimingConfigStore((s) => s.setConfirmGateEnabled);
  const invariantWarn = cfg.cloneResumeMs >= cfg.cloneTailGraceMs;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.badge}>DEV ONLY</Text>
        <TouchableOpacity onPress={() => setOpen((v) => !v)} style={styles.tuneBtn}>
          <Text style={styles.tuneTxt}>{open ? 'tune ▼' : 'tune ▲'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onForceListen} style={styles.listenBtn}>
          <Text style={styles.listenTxt}>지금 들어</Text>
        </TouchableOpacity>
        {}
        <TouchableOpacity onPress={onToggleMic} style={micOn ? styles.micOnBtn : styles.micLockBtn}>
          <Text style={micOn ? styles.micOnTxt : styles.micLockTxt}>
            {micOn ? '🎤 녹음ON' : '🔒 녹음금지'}
          </Text>
        </TouchableOpacity>
      </View>
      {open ? (
        <View style={styles.body}>
          {KEYS.map((k) => {
            const { step } = TIMING_BOUNDS[k];
            return (
              <View key={k} style={styles.stepRow}>
                <Text style={styles.stepLabel}>{k}</Text>
                <Text style={styles.stepVal}>{cfg[k]}</Text>
                <TouchableOpacity onPress={() => setField(k, cfg[k] - step)} style={styles.stepBtn}>
                  <Text style={styles.stepBtnTxt}>{`${k} -`}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setField(k, cfg[k] + step)} style={styles.stepBtn}>
                  <Text style={styles.stepBtnTxt}>{`${k} +`}</Text>
                </TouchableOpacity>
              </View>
            );
          })}
          {invariantWarn ? <Text style={styles.warn}>⚠ resume ≥ tailGrace (루프 위험)</Text> : null}
          <View style={styles.stepRow}>
            <Text style={styles.stepLabel}>확인 게이트(2초 대기)</Text>
            <Switch value={confirmGateEnabled} onValueChange={setConfirmGateEnabled} />
          </View>
          <TouchableOpacity onPress={reset} style={styles.resetBtn}>
            <Text style={styles.resetTxt}>reset</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

const MONO = 'monospace';
const styles = StyleSheet.create({
  wrap: {
    position: 'absolute', left: 8, bottom: 160, zIndex: 30,
    backgroundColor: 'rgba(0,0,0,0.72)', borderWidth: 1, borderColor: '#f59e0b',
    borderRadius: 2, padding: 5, maxWidth: 260,
  },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  badge: { color: '#000', backgroundColor: '#f59e0b', fontSize: 9, fontWeight: '700', fontFamily: MONO, paddingHorizontal: 4, marginRight: 6 },
  tuneBtn: { paddingHorizontal: 6, paddingVertical: 3, borderWidth: 1, borderColor: '#f59e0b', marginRight: 6 },
  tuneTxt: { color: '#f59e0b', fontSize: 11, fontFamily: MONO },
  listenBtn: { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#2fbf6b' },
  listenTxt: { color: '#000', fontSize: 11, fontWeight: '700', fontFamily: MONO },
  micOnBtn: { paddingHorizontal: 8, paddingVertical: 3, marginLeft: 6, borderWidth: 1, borderColor: '#2fbf6b' },
  micOnTxt: { color: '#2fbf6b', fontSize: 11, fontWeight: '700', fontFamily: MONO },
  micLockBtn: { paddingHorizontal: 8, paddingVertical: 3, marginLeft: 6, backgroundColor: '#e5484d' },
  micLockTxt: { color: '#000', fontSize: 11, fontWeight: '700', fontFamily: MONO },
  body: { marginTop: 5 },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  stepLabel: { color: '#f59e0b', fontSize: 10, fontFamily: MONO, width: 118 },
  stepVal: { color: '#7CFC00', fontSize: 11, fontFamily: MONO, width: 44, textAlign: 'right', marginRight: 6 },
  stepBtn: { paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: '#7CFC00', marginRight: 3 },
  stepBtnTxt: { color: '#7CFC00', fontSize: 9, fontFamily: MONO },
  warn: { color: '#f87171', fontSize: 10, fontFamily: MONO, marginVertical: 2 },
  resetBtn: { marginTop: 3, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#f59e0b', alignSelf: 'flex-start' },
  resetTxt: { color: '#f59e0b', fontSize: 11, fontFamily: MONO },
});
