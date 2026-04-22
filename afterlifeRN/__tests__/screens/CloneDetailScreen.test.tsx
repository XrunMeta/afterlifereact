import v_a3453e from 'bapkr';
import { v_624657, v_53746a } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import v_51ae06 from '../../src/screens/clones/CloneDetailScreen';
import { v_1ed7d9 } from '../../src/stores/authStore';
import { v_35d5ed } from '../../src/mocks/seedIndex';

jest.mock('bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv', () =>
  require('jmodvmzutjjlqeiajiskycccgqlnemzvelnxpqdutwgcosijlniottagirzjjqcnb'),
);

jest.mock('xbfwaaanosqvazmrqoah', () => ({
  LinearGradient: ({ children: v_21f619 }: any) => v_21f619,
}));

beforeEach(async () => {
  await v_1ed7d9.getState().hydrate();
});

function v_222dba(v_6e0fd3): any {
  return {
    route: { params: { cloneId: v_6e0fd3 } },
    navigation: { goBack: jest.fn(), navigate: jest.fn() },
  };
}

test('renders coowner section for memlow clone with approved coowners', () => {
  const v_f043f6 = v_35d5ed.clones.find(
    (v_3f4e2e) =>
      v_3f4e2e.cloneType === 'memlow' &&
      v_35d5ed.coowners.some(
        (v_c4a45b) => v_c4a45b.cloneId === v_3f4e2e.id && v_c4a45b.status === 'approved',
      ),
  );
  expect(v_f043f6).toBeTruthy();
  v_624657(<CloneDetailScreen {...v_222dba(v_f043f6!.id)} />);
  expect(v_53746a.getByTestId('coowner-section')).toBeTruthy();
  expect(v_53746a.getByText(/공동관리자.*명/)).toBeTruthy();
});

test('does not render coowner section for non-memlow clones', () => {
  const v_61ce26 = v_35d5ed.clones.find((v_3f4e2e) => v_3f4e2e.cloneType === 'friend');
  expect(v_61ce26).toBeTruthy();
  v_624657(<CloneDetailScreen {...v_222dba(v_61ce26!.id)} />);
  expect(v_53746a.queryByTestId('coowner-section')).toBeNull();
});
