import v_a3453e from 'bapkr';
import { v_624657, v_53746a } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import { v_8c6c0b, v_88b4fc } from '../../../src/components/call/EmotionHUD';

describe('emotionDisplay', () => {
  it('6종을 한국어 라벨로', () => {
    expect(v_88b4fc('neutral').label).toBe('평소');
    expect(v_88b4fc('calm').label).toBe('차분');
    expect(v_88b4fc('happy').label).toBe('기쁨');
    expect(v_88b4fc('sad').label).toBe('슬픔');
    expect(v_88b4fc('angry').label).toBe('화남');
    expect(v_88b4fc('warm').label).toBe('다정');
  });

  it('모르는 값은 원문 그대로 · 없으면 대기 표시', () => {
    expect(v_88b4fc('excited').label).toBe('excited');
    expect(v_88b4fc(null).label).toBe('—');
  });
});

describe('EmotionHUD', () => {
  it('감정 값과 라벨을 함께 보여 준다', () => {
    v_624657(<EmotionHUD emotion="sad" top={40} />);
    expect(v_53746a.getByLabelText('dev-emotion-hud')).toBeTruthy();
    expect(v_53746a.getByText(/슬픔/)).toBeTruthy();
    expect(v_53746a.getByText(/sad/)).toBeTruthy();
  });

  it('아직 감정이 없으면 대기 표시', () => {
    v_624657(<EmotionHUD emotion={null} top={40} />);
    expect(v_53746a.getByText(/—/)).toBeTruthy();
  });
});
