

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { subscribeTimingEvents, formatTimingLine, type TimingEvent, type TimingEventType } from '../../realtime/timingEvents';
import { useTimingConfigStore } from '../../realtime/timingConfig';

const VISIBLE = 12; 
const KEEP = 60;    

const AUDIO_TYPES: readonly TimingEventType[] = [
  'speech_start', 'speech_end', 'stt_open', 'stt_close',
  'suppress_on', 'suppress_off', 'vad_endpoint', 'dev_listen_now',
];
const isAudio = (e: TimingEvent): boolean => AUDIO_TYPES.includes(e.type);

export const CallTimingHUD: React.FC = () => {

  const [events, setEvents] = useState<TimingEvent[]>([]);
  const accRef = useRef<TimingEvent[]>([]);
  useEffect(() => {
    let first = true;
    return subscribeTimingEvents((evs: TimingEvent[]) => {
      if (evs.length === 0) { 
        first = false;
        accRef.current = [];
        setEvents([]);
        return;
      }

      const incoming = first ? evs.filter(isAudio) : (isAudio(evs[evs.length - 1]) ? [evs[evs.length - 1]] : []);
      first = false;
      if (incoming.length === 0) return; 
      const next = accRef.current.concat(incoming).slice(-KEEP);
      accRef.current = next;
      setEvents(next);
    });
  }, []);
  const shown = events.slice(Math.max(0, events.length - VISIBLE));
  const sttEndpointMs = useTimingConfigStore((s) => s.sttEndpointMs);
  const echoGateMs = useTimingConfigStore((s) => s.echoGateMs);
  const cloneResumeMs = useTimingConfigStore((s) => s.cloneResumeMs);
  const cloneTailGraceMs = useTimingConfigStore((s) => s.cloneTailGraceMs);

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Text style={styles.badge}>DEV ONLY</Text>
      <Text style={styles.title}>timing</Text>
      <Text style={styles.cfgLine}>
        {`stt:${sttEndpointMs} echo:${echoGateMs} res:${cloneResumeMs} tail:${cloneTailGraceMs}`}
      </Text>
      {shown.length === 0 ? <Text style={styles.line}>—</Text> : null}
      {shown.map((e, i) => {
        const prev = i === 0 ? null : shown[i - 1];
        return <Text key={`${e.tMs}-${i}`} style={styles.line}>{formatTimingLine(e, prev)}</Text>;
      })}
    </View>
  );
};

const MONO = 'monospace';
const styles = StyleSheet.create({
  wrap: {
    position: 'absolute', top: '30%', left: 8, zIndex: 30,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderWidth: 1, borderColor: '#f59e0b', 
    borderRadius: 2, paddingHorizontal: 6, paddingVertical: 4, maxWidth: 220,
  },
  badge: {
    color: '#000', backgroundColor: '#f59e0b', fontSize: 9, fontWeight: '700',
    fontFamily: MONO, paddingHorizontal: 4, alignSelf: 'flex-start', marginBottom: 3,
  },
  title: { color: '#f59e0b', fontSize: 10, fontFamily: MONO, marginBottom: 2 },
  cfgLine: { color: '#38bdf8', fontSize: 10, fontFamily: MONO, marginBottom: 3 },
  line: { color: '#7CFC00', fontSize: 11, fontFamily: MONO, lineHeight: 15 },
});
