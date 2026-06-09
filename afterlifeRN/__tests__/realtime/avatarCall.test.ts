import { classifyTrack } from '../../src/realtime/avatarCall';

describe('classifyTrack', () => {
  it('kind=video → "video"', () => {
    expect(classifyTrack({ kind: 'video' }, { getVideoTracks: () => [] })).toBe('video');
  });
  it('kind=audio → "audio"', () => {
    expect(classifyTrack({ kind: 'audio' }, { getVideoTracks: () => [{}] })).toBe('audio');
  });
  it('kind 불명 + video track 보유 → "video"', () => {
    expect(classifyTrack({}, { getVideoTracks: () => [{}] })).toBe('video');
  });
  it('kind 불명 + video track 없음 → "audio"', () => {
    expect(classifyTrack({}, { getVideoTracks: () => [] })).toBe('audio');
  });
});
