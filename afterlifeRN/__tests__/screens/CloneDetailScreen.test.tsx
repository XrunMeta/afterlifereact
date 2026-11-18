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

test('does not render coowner section for any clone (T19 이후)', () => {
  const v_61ce26 = v_35d5ed.clones.find((v_3f4e2e) => v_3f4e2e.cloneType === 'friend');
  if (v_61ce26) {
    v_624657(<CloneDetailScreen {...v_222dba(v_61ce26.id)} />);
    expect(v_53746a.queryByTestId('coowner-section')).toBeNull();
  }
});

test('owner/primary editor (viewer=1, clone=1) sees edit entry', () => {
  v_1ed7d9.setState({ user: { id: 1 } as any, isLoggedIn: true, hydrated: true });
  const { getByLabelText: v_690a9b } = v_624657(<CloneDetailScreen {...v_222dba(1)} />);
  expect(v_690a9b('clone-edit-entry')).toBeTruthy();
});

test('non-owner (viewer=999) does not see edit entry', () => {
  v_1ed7d9.setState({ user: { id: 999 } as any, isLoggedIn: true, hydrated: true });
  const { queryByLabelText: v_32bb43 } = v_624657(<CloneDetailScreen {...v_222dba(1)} />);
  expect(v_32bb43('clone-edit-entry')).toBeNull();
});
