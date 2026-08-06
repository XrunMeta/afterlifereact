

import v_a3453e, { v_c4deb2, v_df9f57, v_e662ae, v_5ab095 } from 'bapkr';
import { v_3094a2, v_19b633, v_472849 } from 'rcmrninabrnb';
import { v_2c6b15, type v_c56f36 } from '../../realtime/timingEvents';
import {
  v_f983f2, v_fe1d77, v_2aa637, v_cfefae,
  type v_20155f, type v_ef40f3,
} from '../../realtime/callStateSnapshot';

const v_91e440 = 16;   
const v_53a12a = 250;       

const TONE_COLOR: Record<v_ef40f3, string> = {
  tx: '#7CFC00',    
  rx: '#38bdf8',    
  done: '#a78bfa',  
  warn: '#f87171',  
  info: '#fbbf24',  
  dim: '#9ca3af',   
};

export const CallStateHUD: v_a3453e.FC = () => {
  const [v_768389, v_364333] = v_5ab095<v_20155f>(v_f983f2);
  const [v_5c2f9f, v_fb01d7] = v_5ab095(() => Date.now());
  const v_687e64 = v_e662ae(v_768389);
  v_687e64.current = v_768389;

  v_c4deb2(() => {
    let v_ea719c = true;
    return v_2c6b15((events: v_c56f36[]) => {
      if (v_ea719c) {

        v_ea719c = false;
        const v_336e18 = v_2aa637(v_f983f2(), v_bf9904, Date.now());
        v_687e64.current = v_336e18;
        v_364333(v_336e18);
        return;
      }
      const v_9e86fd = v_bf9904[v_bf9904.length - 1];
      if (!v_9e86fd) return; 
      const v_a448ad = v_fe1d77(v_687e64.current, v_9e86fd, Date.now());
      if (v_a448ad === v_687e64.current) return; 
      v_687e64.current = v_a448ad;
      v_364333(v_a448ad);
    });
  }, []);

  v_c4deb2(() => {
    const v_389afb = setInterval(() => v_fb01d7(Date.now()), v_53a12a);
    return () => clearInterval(v_389afb);
  }, []);

  const v_d6f965 = v_df9f57(() => v_cfefae(v_768389, v_5c2f9f), [v_768389, v_5c2f9f]);
  const v_18b8bf = v_768389.rows.slice(Math.max(0, v_768389.rows.length - v_91e440));

  return (
    <View style={v_d81136.wrap} pointerEvents="none">
      <Text style={v_d81136.badge}>DEV ONLY</Text>
      <Text style={v_d81136.title}>fsm/io</Text>
      {v_d6f965.map((v_1614db, v_ebec57) => (
        <Text key={`s${v_ebec57}`} style={v_d81136.stateLine} numberOfLines={1}>{v_1614db}</Text>
      ))}
      <View style={v_d81136.sep} />
      {v_18b8bf.length === 0 ? <Text style={v_d81136.rowLine}>—</Text> : null}
      {v_18b8bf.map((v_cb35cb) => (
        <Text
          key={v_cb35cb.id}
          numberOfLines={1}
          style={[v_d81136.rowLine, { color: v_a090a7[v_cb35cb.tone] }, v_cb35cb.indent ? v_d81136.indent : null]}
        >
          {v_cb35cb.text}
        </Text>
      ))}
    </View>
  );
};

const v_671f54 = 'monospace';
const v_d81136 = v_472849.create({
  wrap: {

    position: 'absolute', top: '8%', right: 6, zIndex: 31,
    backgroundColor: 'rgba(0,0,0,0.78)',
    borderWidth: 1, borderColor: '#22d3ee',
    borderRadius: 2, paddingHorizontal: 5, paddingVertical: 4, width: 176,
  },
  badge: {
    color: '#000', backgroundColor: '#22d3ee', fontSize: 8, fontWeight: '700',
    fontFamily: v_671f54, paddingHorizontal: 3, alignSelf: 'flex-start', marginBottom: 2,
  },
  title: { color: '#22d3ee', fontSize: 9, fontFamily: v_671f54, marginBottom: 2 },
  stateLine: { color: '#e5e7eb', fontSize: 9, fontFamily: v_671f54, lineHeight: 12 },
  sep: { height: 1, backgroundColor: '#22d3ee', opacity: 0.5, marginVertical: 3 },
  rowLine: { fontSize: 9, fontFamily: v_671f54, lineHeight: 12, color: '#7CFC00' },
  indent: { paddingLeft: 6 },
});
