import v_a3453e from 'bapkr';
import { v_624657, v_53746a } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import v_ed02a5 from '../../src/screens/my/MyScreen';
import { v_1ed7d9 } from '../../src/stores/authStore';
import { v_b4902e } from '../../src/stores/followStore';
import { v_35d5ed } from '../../src/mocks/seedIndex';

jest.mock('bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv', () =>
  require('jmodvmzutjjlqeiajiskycccgqlnemzvelnxpqdutwgcosijlniottagirzjjqcnb'),
);

jest.mock('ixigazcpvfldbecwtbvavtbi', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

beforeEach(async () => {
  await v_1ed7d9.getState().hydrate();
  v_b4902e.setState({ follows: [], hydrated: false });
  await v_b4902e.getState().hydrate();
});

test('MyScreen renders current user displayName + handle', () => {
  v_624657(<MyScreen />);
  const v_d546f3 = v_35d5ed.users.find((v_ceb55a) => v_ceb55a.id === 1);
  expect(v_d546f3).toBeTruthy();
  expect(v_53746a.getByText(v_d546f3!.displayName)).toBeTruthy();
  expect(v_53746a.getByText(v_d546f3!.handle)).toBeTruthy();
});

test('MyScreen shows 팔로우 중 and 내 페르소나 counts', () => {
  v_624657(<MyScreen />);
  expect(v_53746a.getByText('팔로우 중')).toBeTruthy();
  expect(v_53746a.getByText('내 클론')).toBeTruthy();
});

test('myClones count equals SEED.clones owned by user id 1', () => {
  v_624657(<MyScreen />);
  const v_2461e1 = v_35d5ed.clones.filter((v_3f4e2e) => v_3f4e2e.ownerId === 1).length;
  expect(v_53746a.getByText(String(v_2461e1))).toBeTruthy();
});
