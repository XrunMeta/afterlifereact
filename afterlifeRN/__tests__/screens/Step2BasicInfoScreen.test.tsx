import v_a3453e from 'bapkr';
import { v_624657, v_77aa68 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import v_afe4c8 from '../../src/screens/clone-creation/Step2BasicInfoScreen';
import { v_194498 } from '../../src/stores/cloneStore';

const v_7b8db1 = jest.fn();
const v_3c9f12 = { navigation: { navigate: v_7b8db1, goBack: jest.fn() } };

beforeEach(() => {
  v_194498.getState().resetCreationDraft();
  v_7b8db1.mockClear();
});

test('renders MemlowBasicInfo when cloneType=memlow', () => {
  v_194498.getState().setCreationDraft({ cloneType: 'memlow' });
  const { getByText: v_2b0f8a } = v_624657(<Step2BasicInfoScreen {...v_3c9f12} />);
  expect(v_2b0f8a('고인과의 관계')).toBeTruthy();
});

test('renders DefaultBasicInfo when cloneType=friend', () => {
  v_194498.getState().setCreationDraft({ cloneType: 'friend' });
  const { queryByText: v_480380, getByText: v_2b0f8a } = v_624657(<Step2BasicInfoScreen {...v_3c9f12} />);
  expect(v_480380('고인과의 관계')).toBeNull();
  expect(v_2b0f8a('카테고리')).toBeTruthy();
});

test('next button disabled until content validates', () => {
  v_194498.getState().setCreationDraft({ cloneType: 'friend' });
  const { getByText: v_2b0f8a } = v_624657(<Step2BasicInfoScreen {...v_3c9f12} />);
  v_77aa68.press(v_2b0f8a('다음 단계로 이동'));
  expect(v_7b8db1).not.toHaveBeenCalled();
});
