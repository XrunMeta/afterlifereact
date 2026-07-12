

import v_a3453e, { v_c4deb2, v_5ab095 } from 'bapkr';
import { v_3094a2, v_19b633, v_472849 } from 'rcmrninabrnb';
import { v_2c6b15, v_ad545f, type v_c56f36 } from '../../realtime/timingEvents';

const v_6ac598 = 12; 

export const CallTimingHUD: v_a3453e.FC = () => {
  const [v_bf9904, v_2f3f05] = v_5ab095<v_c56f36[]>([]);
  v_c4deb2(() => v_2c6b15(v_2f3f05), []);
  const v_d1b432 = v_bf9904.slice(Math.max(0, v_bf9904.length - v_6ac598));

  return (
    <View style={v_d81136.wrap} pointerEvents="none">
      <Text style={v_d81136.badge}>DEV ONLY</Text>
      <Text style={v_d81136.title}>timing</Text>
      {v_d1b432.length === 0 ? <Text style={v_d81136.line}>—</Text> : null}
      {v_d1b432.map((v_9e86fd, v_ebec57) => {
        const v_ba2215 = v_ebec57 === 0 ? null : v_d1b432[v_ebec57 - 1];
        return <Text key={`${v_9e86fd.tMs}-${v_ebec57}`} style={v_d81136.line}>{v_ad545f(v_9e86fd, v_ba2215)}</Text>;
      })}
    </View>
  );
};

const v_671f54 = 'monospace';
const v_d81136 = v_472849.create({
  wrap: {
    position: 'absolute', top: '30%', left: 8, zIndex: 30,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderWidth: 1, borderColor: '#f59e0b', 
    borderRadius: 2, paddingHorizontal: 6, paddingVertical: 4, maxWidth: 220,
  },
  badge: {
    color: '#000', backgroundColor: '#f59e0b', fontSize: 9, fontWeight: '700',
    fontFamily: v_671f54, paddingHorizontal: 4, alignSelf: 'flex-start', marginBottom: 3,
  },
  title: { color: '#f59e0b', fontSize: 10, fontFamily: v_671f54, marginBottom: 2 },
  line: { color: '#7CFC00', fontSize: 11, fontFamily: v_671f54, lineHeight: 15 },
});
