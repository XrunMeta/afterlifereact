
import { parseStageMessage, formatStageDetail } from '../stageSignal';

describe('parseStageMessage', () => {
  it('정상 메시지를 그대로 읽는다', () => {
    expect(parseStageMessage({
      type: 'stage', seq: 5, stage: 'llm_done', tMs: 8420, detail: { chars: 142 },
    })).toEqual({ stage: 'llm_done', seq: 5, tMs: 8420, info: 'chars:142' });
  });

  it('알려진 detail 키는 축약 라벨로 표시한다', () => {
    expect(parseStageMessage({ stage: 'tts_done', seq: 1, tMs: 11530, detail: { audio_ms: 9200 } })?.info)
      .toBe('audio:9200');
    expect(parseStageMessage({ stage: 'render_done', seq: 1, tMs: 21410, detail: { frames: 248 } })?.info)
      .toBe('frames:248');
    expect(parseStageMessage({ stage: 'stream_end', seq: 1, tMs: 21650, detail: { queued_ms: 12000 } })?.info)
      .toBe('queued:12000');
  });

  it('모르는 stage 이름·모르는 detail 키도 그대로 통과한다(서버가 단계를 추가해도 안 깨짐)', () => {
    const r = parseStageMessage({ stage: 'brand_new_step', seq: 9, tMs: 10, detail: { whatever: 3 } });
    expect(r?.stage).toBe('brand_new_step');
    expect(r?.info).toBe('whatever:3');
  });

  it('seq/tMs/detail 이 없거나 형이 이상하면 null 필드로 흡수한다', () => {
    expect(parseStageMessage({ stage: 'x' })).toEqual({ stage: 'x', seq: null, tMs: null, info: '' });
    expect(parseStageMessage({ stage: 'x', seq: 'a', tMs: 'b', detail: 7 }))
      .toEqual({ stage: 'x', seq: null, tMs: null, info: '' });
    expect(parseStageMessage({ stage: 'x', tMs: NaN })?.tMs).toBeNull();
  });

  it('stage 이름이 없거나 문자열이 아니면 null(무시)', () => {
    expect(parseStageMessage({ type: 'stage' })).toBeNull();
    expect(parseStageMessage({ stage: '' })).toBeNull();
    expect(parseStageMessage({ stage: 12 })).toBeNull();
    expect(parseStageMessage(null)).toBeNull();
    expect(parseStageMessage('stage')).toBeNull();
  });

  it('아주 긴 이름은 잘라 HUD 폭을 지킨다', () => {
    expect(parseStageMessage({ stage: 'x'.repeat(80) })?.stage.length).toBeLessThanOrEqual(25);
  });
});

describe('formatStageDetail', () => {
  it('객체/배열/null 값은 건너뛰고 원시값만 담는다', () => {
    expect(formatStageDetail({ a: 1, b: { x: 1 }, c: null, d: 'ok', e: true }))
      .toBe('a:1 d:ok e:Y');
  });
  it('키가 많아도 상한(4개)까지만 — 한 줄 폭 방어', () => {
    expect(formatStageDetail({ a: 1, b: 2, c: 3, d: 4, e: 5 }).split(' ')).toHaveLength(4);
  });
  it('detail 이 객체가 아니면 빈 문자열', () => {
    expect(formatStageDetail(undefined)).toBe('');
    expect(formatStageDetail([1, 2])).toBe('');
    expect(formatStageDetail('x')).toBe('');
  });
  it('소수 ms 는 반올림해 표시한다', () => {
    expect(formatStageDetail({ audio_ms: 9200.6 })).toBe('audio:9201');
  });
});
