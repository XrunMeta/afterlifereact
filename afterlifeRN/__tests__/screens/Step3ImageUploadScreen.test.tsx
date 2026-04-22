import v_a3453e from 'bapkr';
import { v_624657, v_77aa68 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import v_3d9025 from '../../src/screens/clone-creation/Step3ImageUploadScreen';
import { v_194498 } from '../../src/stores/cloneStore';

const v_7b8db1 = jest.fn();
const v_3c9f12 = { navigation: { navigate: v_7b8db1, goBack: jest.fn() } };

beforeEach(() => {
  v_194498.getState().resetCreationDraft();
  v_7b8db1.mockClear();
});

test('shows entry banner by default and hides after dismiss', () => {
  v_194498.getState().setCreationDraft({ cloneType: 'friend' });
  const { getByLabelText: v_690a9b, queryByText: v_480380 } = v_624657(<Step3ImageUploadScreen {...v_3c9f12} />);
  expect(v_480380(/타입·관계는 수정할 수 없어요/)).toBeTruthy();
  v_77aa68.press(v_690a9b('배너 닫기'));
  expect(v_480380(/타입·관계는 수정할 수 없어요/)).toBeNull();
});

test('renders MemlowImageUpload (skip hint) when cloneType=memlow', () => {
  v_194498.getState().setCreationDraft({ cloneType: 'memlow' });
  const { getByText: v_2b0f8a } = v_624657(<Step3ImageUploadScreen {...v_3c9f12} />);
  expect(v_2b0f8a(/사진을 선택하거나 건너뛸 수 있어요/)).toBeTruthy();
});

test('renders DefaultImageUpload (guide section) when cloneType=friend', () => {
  v_194498.getState().setCreationDraft({ cloneType: 'friend' });
  const { getByText: v_2b0f8a } = v_624657(<Step3ImageUploadScreen {...v_3c9f12} />);
  expect(v_2b0f8a('가이드')).toBeTruthy();
});

test('memlow with no image → next enabled (skip allowed)', () => {
  v_194498.getState().setCreationDraft({ cloneType: 'memlow' });
  const { getByText: v_2b0f8a } = v_624657(<Step3ImageUploadScreen {...v_3c9f12} />);
  v_77aa68.press(v_2b0f8a('다음 단계로 이동'));
  expect(v_7b8db1).toHaveBeenCalledWith('Step4');
});

test('default with no image → next disabled', () => {
  v_194498.getState().setCreationDraft({ cloneType: 'friend' });
  const { getByText: v_2b0f8a } = v_624657(<Step3ImageUploadScreen {...v_3c9f12} />);
  v_77aa68.press(v_2b0f8a('다음 단계로 이동'));
  expect(v_7b8db1).not.toHaveBeenCalled();
});
