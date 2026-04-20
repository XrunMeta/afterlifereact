import DefaultVoiceUpload from '../../../src/screens/clone-creation/content/DefaultVoiceUpload';

test('validate: neither sample nor file → fail', () => {
  expect(DefaultVoiceUpload.validate({ interests: [], coownerInvites: [] })).toBe(false);
});
test('validate: sample id → pass', () => {
  expect(
    DefaultVoiceUpload.validate({
      interests: [],
      coownerInvites: [],
      voiceSampleId: 'v1',
    }),
  ).toBe(true);
});
test('validate: custom file → pass', () => {
  expect(
    DefaultVoiceUpload.validate({
      interests: [],
      coownerInvites: [],
      voiceFile: 'file://x.m4a',
    }),
  ).toBe(true);
});
