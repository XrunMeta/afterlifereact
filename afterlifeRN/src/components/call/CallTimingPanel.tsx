

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useTimingConfigStore, TIMING_BOUNDS, formatTimingEnv, type TimingConfig } from '../../realtime/timingConfig';

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
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
  }, []);

  const handleCopyEnv = () => {
    const str = formatTimingEnv({
      sttEndpointMs: cfg.sttEndpointMs,
      echoGateMs: cfg.echoGateMs,
      cloneResumeMs: cfg.cloneResumeMs,
      cloneTailGraceMs: cfg.cloneTailGraceMs,
      responseDoneTimeoutMs: cfg.responseDoneTimeoutMs,
    });

    console.log('[timing-env]\n' + str);
    Clipboard.setStringAsync(str);
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 2000);
  };

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
          <View style={styles.stepRow}>
            <TouchableOpacity onPress={reset} style={styles.resetBtn}>
              <Text style={styles.resetTxt}>reset</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCopyEnv} style={styles.copyBtn}>
              <Text style={styles.copyTxt}>[copy env]</Text>
            </TouchableOpacity>
            {copied ? <Text style={styles.copiedTxt}>copied ✓</Text> : null}
          </View>
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
  copyBtn: { marginTop: 3, marginLeft: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#38bdf8', alignSelf: 'flex-start' },
  copyTxt: { color: '#38bdf8', fontSize: 11, fontFamily: MONO },
  copiedTxt: { marginTop: 3, marginLeft: 6, color: '#7CFC00', fontSize: 11, fontFamily: MONO, alignSelf: 'center' },
});
