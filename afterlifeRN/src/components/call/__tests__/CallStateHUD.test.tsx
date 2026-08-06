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

  it('stage 이벤트를 단계별 소요시간(델타) 행으로 보여준다', () => {
    const { queryByText: v_480380 } = v_624657(<CallStateHUD />);
    v_be73a0(() => {
      v_d7f7b1('tx', { mode: 'say', seq: 5, text: '그러니까 내가 궁금', eff: 'SAY' });
      v_d7f7b1('stage', { stage: 'llm_done', seq: 5, tMs: 8420, info: 'chars:142' });
      v_d7f7b1('stage', { stage: 'tts_start', seq: 5, tMs: 8420, info: '' });
      v_d7f7b1('stage', { stage: 'tts_done', seq: 5, tMs: 11530, info: 'audio:9200' });
      v_d7f7b1('rx', { sig: 'speech_start', seq: 5, srvSeq: 5 });
    });
    expect(v_480380(/⚙llm_done \+8420ms chars:142/)).toBeTruthy();
    expect(v_480380(/⚙tts \+3110ms audio:9200/)).toBeTruthy();
    expect(v_480380(/stg tts_done @11530ms/)).toBeTruthy(); 
    expect(v_480380(/←start#5/)).toBeTruthy();              
  });

  it('모르는 stage 가 와도 렌더가 깨지지 않는다', () => {
    const { queryByText: v_480380 } = v_624657(<CallStateHUD />);
    v_be73a0(() => {
      v_d7f7b1('stage', { stage: 'brand_new_step', seq: null, tMs: null, info: '' });
    });
    expect(v_480380(/⚙brand_new_step/)).toBeTruthy();
  });

  it('오디오 축 이벤트만으로는 타임라인이 생기지 않는다', () => {
    const { queryByText: v_480380 } = v_624657(<CallStateHUD />);
    v_be73a0(() => { v_d7f7b1('stt_open'); });
    expect(v_480380('—')).toBeTruthy(); 
  });
});
