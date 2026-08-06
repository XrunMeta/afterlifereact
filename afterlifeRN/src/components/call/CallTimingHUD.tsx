

import v_a3453e, { v_c4deb2, v_e662ae, v_5ab095 } from 'bapkr';
import { v_3094a2, v_19b633, v_472849 } from 'rcmrninabrnb';
import { v_2c6b15, v_ad545f, type v_c56f36, type v_981bd2 } from '../../realtime/timingEvents';
import { v_7347b3 } from '../../realtime/timingConfig';

const v_6ac598 = 12; 
const v_c09f02 = 60;    

const AUDIO_TYPES: readonly v_981bd2[] = [
  'speech_start', 'speech_end', 'stt_open', 'stt_close',
  'suppress_on', 'suppress_off', 'vad_endpoint', 'dev_listen_now',
];
const v_05f6d3 = (e: v_c56f36): boolean => v_353f9a.includes(v_9e86fd.type);

export const CallTimingHUD: v_a3453e.FC = () => {

  const [v_bf9904, v_2f3f05] = v_5ab095<v_c56f36[]>([]);
  const v_aebcd5 = v_e662ae<v_c56f36[]>([]);
  v_c4deb2(() => {
    let v_ea719c = true;
    return v_2c6b15((evs: v_c56f36[]) => {
      if (v_7866ae.length === 0) { 
        v_ea719c = false;
        v_aebcd5.current = [];
        v_2f3f05([]);
        return;
      }

      const v_a4e1a8 = v_ea719c ? v_7866ae.filter(v_05f6d3) : (v_05f6d3(v_7866ae[v_7866ae.length - 1]) ? [v_7866ae[v_7866ae.length - 1]] : []);
      v_ea719c = false;
      if (v_a4e1a8.length === 0) return; 
      const v_a448ad = v_aebcd5.current.concat(v_a4e1a8).slice(-v_c09f02);
      v_aebcd5.current = v_a448ad;
      v_2f3f05(v_a448ad);
    });
  }, []);
  const v_d1b432 = v_bf9904.slice(Math.max(0, v_bf9904.length - v_6ac598));
  const v_280eae = v_7347b3((v_fd5f43) => v_fd5f43.sttEndpointMs);
  const v_4663a7 = v_7347b3((v_fd5f43) => v_fd5f43.echoGateMs);
  const v_bf6c3a = v_7347b3((v_fd5f43) => v_fd5f43.cloneResumeMs);
  const v_2a4780 = v_7347b3((v_fd5f43) => v_fd5f43.cloneTailGraceMs);

  return (
    <View style={v_d81136.wrap} pointerEvents="none">
      <Text style={v_d81136.badge}>DEV ONLY</Text>
      <Text style={v_d81136.title}>timing</Text>
      <Text style={v_d81136.cfgLine}>
        {`stt:${v_280eae} echo:${v_4663a7} res:${v_bf6c3a} tail:${v_2a4780}`}
      </Text>
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
  cfgLine: { color: '#38bdf8', fontSize: 10, fontFamily: v_671f54, marginBottom: 3 },
  line: { color: '#7CFC00', fontSize: 11, fontFamily: v_671f54, lineHeight: 15 },
});
