import { v_6920f0, v_3075fa } from '../handsFree';

const v_bb280b = () => v_6920f0(v_3075fa(), { type: 'CALL_LIVE' }).state;

describe('seq 매칭', () => {
  it('FINAL_RESULT(즉발) 는 activeSeq 를 발급하고 saySeq 로 알린다', () => {
    const v_ca01e0 = v_bb280b();
    const v_cb35cb = v_6920f0(v_ca01e0, { type: 'FINAL_RESULT', text: '안녕' });
    expect(v_cb35cb.state.phase).toBe('sending');
    expect(v_cb35cb.state.activeSeq).toBe(1);
    expect(v_cb35cb.saySeq).toBe(1);
  });

  it('seq 가 일치하는 SPEECH_START 만 speaking 으로 전이한다', () => {
    const v_3f6eae = v_6920f0(v_bb280b(), { type: 'FINAL_RESULT', text: '안녕' }).state;
    expect(v_6920f0(v_3f6eae, { type: 'SPEECH_START', seq: 99 }).state.phase).toBe('sending');
    expect(v_6920f0(v_3f6eae, { type: 'SPEECH_START', seq: 1 }).state.phase).toBe('speaking');
  });

  it('seq 가 다른 RESPONSE_DONE 은 무시된다', () => {
    const v_3f6eae = v_6920f0(v_bb280b(), { type: 'FINAL_RESULT', text: '안녕' }).state;
    const v_3756c2 = v_6920f0(v_3f6eae, { type: 'SPEECH_START', seq: 1 }).state;
    expect(v_6920f0(v_3756c2, { type: 'RESPONSE_DONE', seq: 2 }).state.phase).toBe('speaking');
  });

  it('seq 없는 RESPONSE_DONE 은 강제 복구로 항상 수용한다', () => {
    const v_3f6eae = v_6920f0(v_bb280b(), { type: 'FINAL_RESULT', text: '안녕' }).state;
    const v_cb35cb = v_6920f0(v_3f6eae, { type: 'RESPONSE_DONE' });
    expect(v_cb35cb.state.phase).toBe('listening');
    expect(v_cb35cb.state.activeSeq).toBeNull();
  });
});
