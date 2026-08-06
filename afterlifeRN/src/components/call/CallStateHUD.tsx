

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { subscribeTimingEvents, type TimingEvent } from '../../realtime/timingEvents';
import {
  initCallStateModel, foldTimingEvent, foldAll, formatStateLines,
  type CallStateModel, type RowTone,
} from '../../realtime/callStateSnapshot';

const VISIBLE_ROWS = 12;   
const TICK_MS = 250;       

const TONE_COLOR: Record<RowTone, string> = {
  tx: '#7CFC00',    
  rx: '#38bdf8',    
  done: '#a78bfa',  
  warn: '#f87171',  
  info: '#fbbf24',  
  dim: '#9ca3af',   
};

export const CallStateHUD: React.FC = () => {
  const [model, setModel] = useState<CallStateModel>(initCallStateModel);
  const [now, setNow] = useState(() => Date.now());
  const modelRef = useRef(model);
  modelRef.current = model;

  useEffect(() => {
    let first = true;
    return subscribeTimingEvents((events: TimingEvent[]) => {
      if (first) {

        first = false;
        const warm = foldAll(initCallStateModel(), events, Date.now());
        modelRef.current = warm;
        setModel(warm);
        return;
      }
      const e = events[events.length - 1];
      if (!e) return; 
      const next = foldTimingEvent(modelRef.current, e, Date.now());
      if (next === modelRef.current) return; 
      modelRef.current = next;
      setModel(next);
    });
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const stateLines = useMemo(() => formatStateLines(model, now), [model, now]);
  const rows = model.rows.slice(Math.max(0, model.rows.length - VISIBLE_ROWS));

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Text style={styles.badge}>DEV ONLY</Text>
      <Text style={styles.title}>fsm/io</Text>
      {stateLines.map((l, i) => (
        <Text key={`s${i}`} style={styles.stateLine} numberOfLines={1}>{l}</Text>
      ))}
      <View style={styles.sep} />
      {rows.length === 0 ? <Text style={styles.rowLine}>—</Text> : null}
      {rows.map((r) => (
        <Text
          key={r.id}
          numberOfLines={1}
          style={[styles.rowLine, { color: TONE_COLOR[r.tone] }, r.indent ? styles.indent : null]}
        >
          {r.text}
        </Text>
      ))}
    </View>
  );
};

const MONO = 'monospace';
const styles = StyleSheet.create({
  wrap: {

    position: 'absolute', top: '8%', right: 6, zIndex: 31,
    backgroundColor: 'rgba(0,0,0,0.78)',
    borderWidth: 1, borderColor: '#22d3ee',
    borderRadius: 2, paddingHorizontal: 5, paddingVertical: 4, width: 176,
  },
  badge: {
    color: '#000', backgroundColor: '#22d3ee', fontSize: 8, fontWeight: '700',
    fontFamily: MONO, paddingHorizontal: 3, alignSelf: 'flex-start', marginBottom: 2,
  },
  title: { color: '#22d3ee', fontSize: 9, fontFamily: MONO, marginBottom: 2 },
  stateLine: { color: '#e5e7eb', fontSize: 9, fontFamily: MONO, lineHeight: 12 },
  sep: { height: 1, backgroundColor: '#22d3ee', opacity: 0.5, marginVertical: 3 },
  rowLine: { fontSize: 9, fontFamily: MONO, lineHeight: 12, color: '#7CFC00' },
  indent: { paddingLeft: 6 },
});
