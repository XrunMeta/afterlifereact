import v_a3453e from 'bapkr';
import { v_624657, v_77aa68 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import v_710783 from '../../src/screens/clone-creation/Step4VoiceUploadScreen';
import { v_194498 } from '../../src/stores/cloneStore';

const v_7b8db1 = jest.fn();
const v_3c9f12 = { navigation: { navigate: v_7b8db1, goBack: jest.fn() } };

beforeEach(() => {
  v_194498.getState().resetCreationDraft();
  v_7b8db1.mockClear();
});

test('renders DefaultVoiceUpload (sample cards) when cloneType=friend', () => {
  v_194498.getState().setCreationDraft({ cloneType: 'friend' });
  const { getByText: v_2b0f8a } = v_624657(<Step4VoiceUploadScreen {...v_3c9f12} />);
  expect(v_2b0f8a('Nova')).toBeTruthy();
});

test('renders MemlowVoiceUpload (letter scripts) when cloneType=memlow', () => {
  v_194498.getState().setCreationDraft({ cloneType: 'memlow' });
  const { getByText: v_2b0f8a } = v_624657(<Step4VoiceUploadScreen {...v_3c9f12} />);
  expect(v_2b0f8a(/편지 1/)).toBeTruthy();
});

test('default with no voice → next disabled', () => {
  v_194498.getState().setCreationDraft({ cloneType: 'friend' });
  const { getByText: v_2b0f8a } = v_624657(<Step4VoiceUploadScreen {...v_3c9f12} />);
  v_77aa68.press(v_2b0f8a('다음 단계로 이동'));
  expect(v_7b8db1).not.toHaveBeenCalled();
});

test('default with voiceSampleId → next enabled', () => {
  v_194498.getState().setCreationDraft({ cloneType: 'friend', voiceSampleId: 'v1' });
  const { getByText: v_2b0f8a } = v_624657(<Step4VoiceUploadScreen {...v_3c9f12} />);
  v_77aa68.press(v_2b0f8a('다음 단계로 이동'));
  expect(v_7b8db1).toHaveBeenCalledWith('Step5');
});

test('memlow with voiceFile → next enabled', () => {
  v_194498.getState().setCreationDraft({
    cloneType: 'memlow',
    voiceFile: 'file://x.m4a',
  });
  const { getByText: v_2b0f8a } = v_624657(<Step4VoiceUploadScreen {...v_3c9f12} />);
  v_77aa68.press(v_2b0f8a('다음 단계로 이동'));
  expect(v_7b8db1).toHaveBeenCalledWith('Step5');
});
