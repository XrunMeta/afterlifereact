import { v_d8a22b } from '../../src/realtime/avatarCall';

describe('classifyTrack', () => {
  it('kind=video → "video"', () => {
    expect(v_d8a22b({ kind: 'video' }, { getVideoTracks: () => [] })).toBe('video');
  });
  it('kind=audio → "audio"', () => {
    expect(v_d8a22b({ kind: 'audio' }, { getVideoTracks: () => [{}] })).toBe('audio');
  });
  it('kind 불명 + video track 보유 → "video"', () => {
    expect(v_d8a22b({}, { getVideoTracks: () => [{}] })).toBe('video');
  });
  it('kind 불명 + video track 없음 → "audio"', () => {
    expect(v_d8a22b({}, { getVideoTracks: () => [] })).toBe('audio');
  });
});
