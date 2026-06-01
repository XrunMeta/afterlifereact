import v_a3453e from 'bapkr';
import { v_624657, v_53746a, v_be73a0 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import v_def15b from '../../src/screens/clones/MyClonesDashboardScreen';
import { v_1ed7d9 } from '../../src/stores/authStore';
import { v_b4902e } from '../../src/stores/followStore';
import { v_194498 } from '../../src/stores/cloneStore';
import { v_35d5ed } from '../../src/mocks/seedIndex';

jest.mock('bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv', () =>
  require('jmodvmzutjjlqeiajiskycccgqlnemzvelnxpqdutwgcosijlniottagirzjjqcnb'),
);

jest.mock('ixigazcpvfldbecwtbvavtbi', () => ({
  useNavigation: () => ({ navigate: jest.fn(), dispatch: jest.fn() }),
  useFocusEffect: jest.fn(),
  CommonActions: { navigate: jest.fn() },
}));

jest.mock('../../src/api/clones', () => ({
  ...jest.requireActual('../../src/api/clones'),
  listMyClones: jest.fn().mockResolvedValue({ items: [] }),
  listSystemClones: jest.fn().mockResolvedValue({
    items: [{ id: 999, username: 'halbae', name: '할배' }],
  }),
}));

beforeEach(async () => {
  await v_1ed7d9.getState().hydrate();
  v_b4902e.setState({ follows: [], hydrated: false });
  await v_b4902e.getState().hydrate();
  v_194498.setState({ localClones: [] });
});

test('shows halbae system clone as callable entry', async () => {

  v_1ed7d9.setState({ accessToken: 'test-token' });
  v_624657(<MyClonesDashboardScreen />);
  expect(await v_53746a.findByText('할배')).toBeTruthy();
});

test('renders at least one owned clone card', () => {
  v_624657(<MyClonesDashboardScreen />);
  const v_2461e1 = v_35d5ed.clones.filter((v_3f4e2e) => v_3f4e2e.ownerId === 1);
  expect(v_2461e1.length).toBeGreaterThan(0);
  expect(v_53746a.getByText(v_2461e1[0].displayName)).toBeTruthy();
});

test('shows follower count badge on owned clones', () => {
  const { getByTestId: v_f177b5 } = v_624657(<MyClonesDashboardScreen />);
  const v_e5db34 = v_35d5ed.clones.find((v_3f4e2e) => v_3f4e2e.ownerId === 1)!;
  const v_aab306 = v_f177b5(`follower-count-${v_e5db34.id}`);
  expect(v_aab306).toBeTruthy();
  expect(v_aab306.props.children.join('')).toMatch(/팔로워/);
});

test('shows coowner badge for memlow clones with approved coowners', () => {
  v_624657(<MyClonesDashboardScreen />);
  const v_f043f6 = v_35d5ed.clones.find(
    (v_3f4e2e) =>
      v_3f4e2e.ownerId === 1 &&
      v_3f4e2e.cloneType === 'memlow' &&
      v_35d5ed.coowners.some(
        (v_c4a45b) => v_c4a45b.cloneId === v_3f4e2e.id && v_c4a45b.status === 'approved',
      ),
  );
  expect(v_f043f6).toBeTruthy();
  expect(v_53746a.getAllByText(/공동관리자.*명/).length).toBeGreaterThan(0);
});
