

import v_a3453e, { v_5ab095 } from 'bapkr';
import { v_3094a2, v_19b633, v_4623af, v_472849 } from 'rcmrninabrnb';
import { v_7347b3, v_2e0251, type v_702ae4 } from '../../realtime/timingConfig';

const KEYS: Array<keyof v_702ae4> = ['sttEndpointMs', 'echoGateMs', 'cloneResumeMs', 'cloneTailGraceMs'];

export const CallTimingPanel: v_a3453e.FC<{ onForceListen: () => void }> = ({ onForceListen: v_cd33c0 }) => {
  const [v_207c31, v_3cc8fd] = v_5ab095(false);
  const v_01dcf5 = v_7347b3();
  const v_880a26 = v_7347b3((v_fd5f43) => v_fd5f43.setField);
  const v_487a25 = v_7347b3((v_fd5f43) => v_fd5f43.reset);
  const v_092e41 = v_01dcf5.cloneResumeMs >= v_01dcf5.cloneTailGraceMs;

  return (
    <View style={v_d81136.wrap}>
      <View style={v_d81136.row}>
        <Text style={v_d81136.badge}>DEV ONLY</Text>
        <TouchableOpacity onPress={() => v_3cc8fd((v_81e2ef) => !v_81e2ef)} style={v_d81136.tuneBtn}>
          <Text style={v_d81136.tuneTxt}>{v_207c31 ? 'tune ▼' : 'tune ▲'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={v_cd33c0} style={v_d81136.listenBtn}>
          <Text style={v_d81136.listenTxt}>지금 들어</Text>
        </TouchableOpacity>
      </View>
      {v_207c31 ? (
        <View style={v_d81136.body}>
          {v_0dc2a1.map((v_0eb677) => {
            const { step: v_729796 } = v_2e0251[v_0eb677];
            return (
              <View key={v_0eb677} style={v_d81136.stepRow}>
                <Text style={v_d81136.stepLabel}>{v_0eb677}</Text>
                <Text style={v_d81136.stepVal}>{v_01dcf5[v_0eb677]}</Text>
                <TouchableOpacity onPress={() => v_880a26(v_0eb677, v_01dcf5[v_0eb677] - v_729796)} style={v_d81136.stepBtn}>
                  <Text style={v_d81136.stepBtnTxt}>{`${v_0eb677} -`}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => v_880a26(v_0eb677, v_01dcf5[v_0eb677] + v_729796)} style={v_d81136.stepBtn}>
                  <Text style={v_d81136.stepBtnTxt}>{`${v_0eb677} +`}</Text>
                </TouchableOpacity>
              </View>
            );
          })}
          {v_092e41 ? <Text style={v_d81136.warn}>⚠ resume ≥ tailGrace (루프 위험)</Text> : null}
          <TouchableOpacity onPress={v_487a25} style={v_d81136.resetBtn}>
            <Text style={v_d81136.resetTxt}>reset</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

const v_671f54 = 'monospace';
const v_d81136 = v_472849.create({
  wrap: {
    position: 'absolute', left: 8, bottom: 160, zIndex: 30,
    backgroundColor: 'rgba(0,0,0,0.72)', borderWidth: 1, borderColor: '#f59e0b',
    borderRadius: 2, padding: 5, maxWidth: 260,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  badge: { color: '#000', backgroundColor: '#f59e0b', fontSize: 9, fontWeight: '700', fontFamily: v_671f54, paddingHorizontal: 4, marginRight: 6 },
  tuneBtn: { paddingHorizontal: 6, paddingVertical: 3, borderWidth: 1, borderColor: '#f59e0b', marginRight: 6 },
  tuneTxt: { color: '#f59e0b', fontSize: 11, fontFamily: v_671f54 },
  listenBtn: { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#2fbf6b' },
  listenTxt: { color: '#000', fontSize: 11, fontWeight: '700', fontFamily: v_671f54 },
  body: { marginTop: 5 },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  stepLabel: { color: '#f59e0b', fontSize: 10, fontFamily: v_671f54, width: 118 },
  stepVal: { color: '#7CFC00', fontSize: 11, fontFamily: v_671f54, width: 44, textAlign: 'right', marginRight: 6 },
  stepBtn: { paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: '#7CFC00', marginRight: 3 },
  stepBtnTxt: { color: '#7CFC00', fontSize: 9, fontFamily: v_671f54 },
  warn: { color: '#f87171', fontSize: 10, fontFamily: v_671f54, marginVertical: 2 },
  resetBtn: { marginTop: 3, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#f59e0b', alignSelf: 'flex-start' },
  resetTxt: { color: '#f59e0b', fontSize: 11, fontFamily: v_671f54 },
});
