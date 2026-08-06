import React from 'react';
import { render, act } from '@testing-library/react-native';
import { CallStateHUD } from '../CallStateHUD';
import { emitTimingEvent, clearTimingEvents, __setTimingClock } from '../../../realtime/timingEvents';

describe('CallStateHUD', () => {
  beforeEach(() => {
    __setTimingClock(() => 0);
    clearTimingEvents();
  });

  it('DEV ONLY 뱃지와 초기 스냅샷을 렌더한다', () => {
    const { getByText, queryByText } = render(<CallStateHUD />);
    expect(getByText('DEV ONLY')).toBeTruthy();

    expect(queryByText(/FSM idle/)).toBeTruthy();
    expect(queryByText(/tx:—/)).toBeTruthy(); 
  });

  it('fsm 이벤트를 받으면 스냅샷 phase 가 갱신된다', () => {
    const { queryByText } = render(<CallStateHUD />);
    act(() => {
      emitTimingEvent('fsm', {
        from: 'idle', to: 'listening', ev: 'CALL_LIVE', effects: 'START_STT',
        micOn: true, spk: false, aseq: null, nseq: 1, pseq: null, pi: null, pit: 0, greet: 0, gmax: 2,
      });
    });
    expect(queryByText(/FSM listening/)).toBeTruthy();
    expect(queryByText(/det:off/)).toBeTruthy();
  });

  it('tx/rx 를 seq 로 묶어 타임라인에 표시하고 seq_drop 을 남긴다', () => {
    const { queryByText } = render(<CallStateHUD />);
    act(() => {
      emitTimingEvent('tx', { mode: 'speak', seq: 3, text: '안녕하세요', eff: 'SAY_INTERRUPT' });
      emitTimingEvent('rx', { sig: 'speech_start', seq: 3, srvSeq: 3 });
      emitTimingEvent('seq_drop', { sig: 'speech_start', got: 3, want: 4 });
    });
    expect(queryByText(/→speak#3/)).toBeTruthy();
    expect(queryByText(/←start#3/)).toBeTruthy();
    expect(queryByText(/✗drop start#3\(want:4\)/)).toBeTruthy();
    expect(queryByText(/drop:1/)).toBeTruthy(); 
  });

  it('stage 이벤트를 단계별 소요시간(델타) 행으로 보여준다', () => {
    const { queryByText } = render(<CallStateHUD />);
    act(() => {
      emitTimingEvent('tx', { mode: 'say', seq: 5, text: '그러니까 내가 궁금', eff: 'SAY' });
      emitTimingEvent('stage', { stage: 'llm_done', seq: 5, tMs: 8420, info: 'chars:142' });
      emitTimingEvent('stage', { stage: 'tts_start', seq: 5, tMs: 8420, info: '' });
      emitTimingEvent('stage', { stage: 'tts_done', seq: 5, tMs: 11530, info: 'audio:9200' });
      emitTimingEvent('rx', { sig: 'speech_start', seq: 5, srvSeq: 5 });
    });
    expect(queryByText(/⚙llm_done \+8420ms chars:142/)).toBeTruthy();
    expect(queryByText(/⚙tts \+3110ms audio:9200/)).toBeTruthy();
    expect(queryByText(/stg tts_done @11530ms/)).toBeTruthy(); 
    expect(queryByText(/←start#5/)).toBeTruthy();              
  });

  it('모르는 stage 가 와도 렌더가 깨지지 않는다', () => {
    const { queryByText } = render(<CallStateHUD />);
    act(() => {
      emitTimingEvent('stage', { stage: 'brand_new_step', seq: null, tMs: null, info: '' });
    });
    expect(queryByText(/⚙brand_new_step/)).toBeTruthy();
  });

  it('오디오 축 이벤트만으로는 타임라인이 생기지 않는다', () => {
    const { queryByText } = render(<CallStateHUD />);
    act(() => { emitTimingEvent('stt_open'); });
    expect(queryByText('—')).toBeTruthy(); 
  });
});
