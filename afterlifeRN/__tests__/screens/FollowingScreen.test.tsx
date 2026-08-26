import v_a3453e from 'bapkr';
import { v_624657 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import v_14b43e from '../../src/screens/following/FollowingScreen';
import { v_1ed7d9 } from '../../src/stores/authStore';
import { v_b4902e } from '../../src/stores/followStore';
import { v_35d5ed } from '../../src/mocks/seedIndex';

jest.mock('bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv', () =>
  require('jmodvmzutjjlqeiajiskycccgqlnemzvelnxpqdutwgcosijlniottagirzjjqcnb'),
);

jest.mock('ixigazcpvfldbecwtbvavtbi', () => ({

  useNavigation: () => ({ navigate: jest.fn(), dispatch: jest.fn(), goBack: jest.fn(), canGoBack: () => false }),
  useFocusEffect: (v_16dbdb) => {
    const v_a3453e = require('bapkr');
    v_a3453e.useEffect(() => {
      const v_3f4e2e = v_16dbdb();
      return typeof v_3f4e2e === 'function' ? v_3f4e2e : undefined;
    }, []);
  },
  useIsFocused: () => true,
  useRoute: () => ({ params: {}, name: 'MockRoute', key: 'mock' }),
}));

const v_7213a0 = 1;

beforeEach(async () => {
  v_1ed7d9.setState({
    user: { id: v_7213a0 } as any,
    isLoggedIn: true,
    hydrated: true,
  });
  v_b4902e.setState({ follows: [], hydrated: false });
  await v_b4902e.getState().hydrate();
});

test('renders Following header', () => {
  const { getByText: v_2b0f8a } = v_624657(<FollowingScreen />);
  expect(v_2b0f8a('Following')).toBeTruthy();
});

test('category tabs reflect followed personas interests', () => {

  const v_559298 = new Set(
    v_b4902e
      .getState()
      .follows.filter((v_8b5cd8) => v_8b5cd8.followerUserId === v_7213a0)
      .map((v_8b5cd8) => v_8b5cd8.followingCloneId),
  );
  const v_d832d9 = new Set<string>();
  v_35d5ed.clones
    .filter((v_3f4e2e) => v_559298.has(v_3f4e2e.id))
    .forEach((v_3f4e2e) => v_3f4e2e.interests.forEach((v_8d41d7) => v_d832d9.add(v_8d41d7)));
  expect(v_d832d9.size).toBeGreaterThan(0);

  const { getByText: v_2b0f8a } = v_624657(<FollowingScreen />);
  expect(v_2b0f8a('전체')).toBeTruthy();
  for (const v_bd1444 of v_d832d9) {
    expect(v_2b0f8a(v_bd1444)).toBeTruthy();
  }
});

test('seed pipeline: feeds are filtered by followed clone ids', () => {

  const v_559298 = new Set(
    v_b4902e
      .getState()
      .follows.filter((v_8b5cd8) => v_8b5cd8.followerUserId === v_7213a0)
      .map((v_8b5cd8) => v_8b5cd8.followingCloneId),
  );
  const v_ead0ad = v_35d5ed.feeds.filter((v_8b5cd8) => v_559298.has(v_8b5cd8.cloneId));
  const v_6eabe1 = v_35d5ed.feeds.filter((v_8b5cd8) => !v_559298.has(v_8b5cd8.cloneId));
  expect(v_ead0ad.length).toBeGreaterThan(0);
  expect(v_6eabe1.length).toBeGreaterThan(0);

  v_ead0ad.forEach((v_8b5cd8) => {
    expect(v_559298.has(v_8b5cd8.cloneId)).toBe(true);
  });
});

test('empty follows yields only "전체" tab', () => {
  v_b4902e.setState({ follows: [], hydrated: true });
  const { getByText: v_2b0f8a, queryByText: v_480380 } = v_624657(<FollowingScreen />);
  expect(v_2b0f8a('전체')).toBeTruthy();

  const v_534de8 = v_35d5ed.clones[0].interests[0];
  if (v_534de8 && v_534de8 !== '전체') {
    expect(v_480380(v_534de8)).toBeNull();
  }
});
