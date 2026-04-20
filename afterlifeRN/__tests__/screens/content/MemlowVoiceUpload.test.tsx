import v_a3453e from 'bapkr';
import { v_624657, v_77aa68 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import v_95a2dd from '../../../src/screens/clone-creation/content/MemlowVoiceUpload';
import type { v_c2a674 } from '../../../src/types/clone';

const base: v_c2a674 = { interests: [], coownerInvites: [] };

test('validate: no voice → fail', () => {
  expect(v_95a2dd.validate(v_694b25)).toBe(false);
});
test('validate: recordDuration=29 alone → fail', () => {
  expect(v_95a2dd.validate({ ...v_694b25, recordDuration: 29 })).toBe(false);
});
test('validate: recordDuration=30 → pass', () => {
  expect(v_95a2dd.validate({ ...v_694b25, recordDuration: 30 })).toBe(true);
});
test('validate: voiceFile alone → pass', () => {
  expect(v_95a2dd.validate({ ...v_694b25, voiceFile: 'file://x.m4a' })).toBe(true);
});
test('renders 3 letter script cards', () => {
  const { getByText: v_2b0f8a } = v_624657(<MemlowVoiceUpload draft={v_694b25} onChange={jest.fn()} />);
  expect(v_2b0f8a(/편지 1/)).toBeTruthy();
  expect(v_2b0f8a(/편지 2/)).toBeTruthy();
  expect(v_2b0f8a(/편지 3/)).toBeTruthy();
});
test('picking a script fires onChange with voiceScriptId', () => {
  const v_b187d9 = jest.fn();
  const { getByText: v_2b0f8a } = v_624657(<MemlowVoiceUpload draft={v_694b25} onChange={v_b187d9} />);
  v_77aa68.press(v_2b0f8a(/편지 1/));
  expect(v_b187d9).toHaveBeenCalledWith({ voiceScriptId: 's1' });
});
