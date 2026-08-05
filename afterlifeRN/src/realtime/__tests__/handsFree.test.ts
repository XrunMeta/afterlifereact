import { handsFreeReducer, initHandsFreeState } from '../handsFree';

const live = () => handsFreeReducer(initHandsFreeState(), { type: 'CALL_LIVE' }).state;

describe('seq 매칭', () => {
  it('FINAL_RESULT(즉발) 는 activeSeq 를 발급하고 saySeq 로 알린다', () => {
    const s0 = live();
    const r = handsFreeReducer(s0, { type: 'FINAL_RESULT', text: '안녕' });
    expect(r.state.phase).toBe('sending');
    expect(r.state.activeSeq).toBe(1);
    expect(r.saySeq).toBe(1);
  });

  it('seq 가 일치하는 SPEECH_START 만 speaking 으로 전이한다', () => {
    const s1 = handsFreeReducer(live(), { type: 'FINAL_RESULT', text: '안녕' }).state;
    expect(handsFreeReducer(s1, { type: 'SPEECH_START', seq: 99 }).state.phase).toBe('sending');
    expect(handsFreeReducer(s1, { type: 'SPEECH_START', seq: 1 }).state.phase).toBe('speaking');
  });

  it('seq 가 다른 RESPONSE_DONE 은 무시된다', () => {
    const s1 = handsFreeReducer(live(), { type: 'FINAL_RESULT', text: '안녕' }).state;
    const s2 = handsFreeReducer(s1, { type: 'SPEECH_START', seq: 1 }).state;
    expect(handsFreeReducer(s2, { type: 'RESPONSE_DONE', seq: 2 }).state.phase).toBe('speaking');
  });

  it('seq 없는 RESPONSE_DONE 은 강제 복구로 항상 수용한다', () => {
    const s1 = handsFreeReducer(live(), { type: 'FINAL_RESULT', text: '안녕' }).state;
    const r = handsFreeReducer(s1, { type: 'RESPONSE_DONE' });
    expect(r.state.phase).toBe('listening');
    expect(r.state.activeSeq).toBeNull();
  });
});
