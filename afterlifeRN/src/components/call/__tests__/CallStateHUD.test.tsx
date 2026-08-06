import v_a3453e from 'bapkr';
import { v_624657, v_be73a0 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import { v_fe1755 } from '../CallStateHUD';
import { v_d7f7b1, v_8c24f4, v_94a663 } from '../../../realtime/timingEvents';

describe('CallStateHUD', () => {
  beforeEach(() => {
    v_94a663(() => 0);
    v_8c24f4();
  });

  it('DEV ONLY 뱃지와 초기 스냅샷을 렌더한다', () => {
    const { getByText: v_2b0f8a, queryByText: v_480380 } = v_624657(<CallStateHUD />);
    expect(v_2b0f8a('DEV ONLY')).toBeTruthy();

    expect(v_480380(/FSM idle/)).toBeTruthy();
    expect(v_480380(/tx:—/)).toBeTruthy(); 
  });

  it('fsm 이벤트를 받으면 스냅샷 phase 가 갱신된다', () => {
    const { queryByText: v_480380 } = v_624657(<CallStateHUD />);
    v_be73a0(() => {
      v_d7f7b1('fsm', {
        from: 'idle', to: 'listening', ev: 'CALL_LIVE', effects: 'START_STT',
        micOn: true, spk: false, aseq: null, nseq: 1, pseq: null, pi: null, pit: 0, greet: 0, gmax: 2,
      });
    });
    expect(v_480380(/FSM listening/)).toBeTruthy();
    expect(v_480380(/det:off/)).toBeTruthy();
  });

  it('tx/rx 를 seq 로 묶어 타임라인에 표시하고 seq_drop 을 남긴다', () => {
    const { queryByText: v_480380 } = v_624657(<CallStateHUD />);
    v_be73a0(() => {
      v_d7f7b1('tx', { mode: 'speak', seq: 3, text: '안녕하세요', eff: 'SAY_INTERRUPT' });
      v_d7f7b1('rx', { sig: 'speech_start', seq: 3, srvSeq: 3 });
      v_d7f7b1('seq_drop', { sig: 'speech_start', got: 3, want: 4 });
    });
    expect(v_480380(/→speak#3/)).toBeTruthy();
    expect(v_480380(/←start#3/)).toBeTruthy();
    expect(v_480380(/✗drop start#3\(want:4\)/)).toBeTruthy();
    expect(v_480380(/drop:1/)).toBeTruthy(); 
  });

  it('오디오 축 이벤트만으로는 타임라인이 생기지 않는다', () => {
    const { queryByText: v_480380 } = v_624657(<CallStateHUD />);
    v_be73a0(() => { v_d7f7b1('stt_open'); });
    expect(v_480380('—')).toBeTruthy(); 
  });
});
