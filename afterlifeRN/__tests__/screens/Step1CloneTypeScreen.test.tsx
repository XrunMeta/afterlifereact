import v_a3453e from 'bapkr';
import { v_624657, v_77aa68 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import v_84d7a5 from '../../src/screens/clone-creation/Step1CloneTypeScreen';
import { v_194498 } from '../../src/stores/cloneStore';

const v_7b8db1 = jest.fn();
const v_7f4924 = { navigation: { navigate: v_7b8db1, getParent: () => ({ navigate: jest.fn() }) } } as any;

beforeEach(() => {
  v_194498.getState().resetCreationDraft();
  v_7b8db1.mockClear();
});

test('renders 2 cloneType cards (memlow / 일반) with labels', () => {

  const { getByText: v_2b0f8a, queryByText: v_480380 } = v_624657(<Step1CloneTypeScreen {...v_7f4924} />);
  expect(v_2b0f8a('떠난 소중한 이')).toBeTruthy();
  expect(v_2b0f8a('일반')).toBeTruthy();

  expect(v_480380('전문 멘토')).toBeNull();
  expect(v_480380('유명인')).toBeNull();
});

test('next button disabled until a type is selected', () => {
  const { getByText: v_2b0f8a } = v_624657(<Step1CloneTypeScreen {...v_7f4924} />);
  v_77aa68.press(v_2b0f8a('다음'));
  expect(v_7b8db1).not.toHaveBeenCalled();
});

test('selecting memlow and pressing next saves cloneType and navigates to Step2', () => {
  const { getByText: v_2b0f8a } = v_624657(<Step1CloneTypeScreen {...v_7f4924} />);
  v_77aa68.press(v_2b0f8a('떠난 소중한 이'));
  v_77aa68.press(v_2b0f8a('다음'));
  expect(v_194498.getState().creationDraft.cloneType).toBe('memlow');
  expect(v_7b8db1).toHaveBeenCalledWith('Step2');
});

test('Step1 does not render category/interests UI', () => {
  const { queryByText: v_480380 } = v_624657(<Step1CloneTypeScreen {...v_7f4924} />);
  expect(v_480380('카테고리 선택')).toBeNull();
  expect(v_480380('관심사 선택')).toBeNull();
});
