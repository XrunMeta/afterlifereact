import v_a3453e from 'bapkr';
import { v_624657 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import v_02d653 from '../../src/screens/clone-interaction/ChatScreen';
import { v_1ed7d9 } from '../../src/stores/authStore';
import { v_35d5ed } from '../../src/mocks/seedIndex';

jest.mock('bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv', () =>
  require('jmodvmzutjjlqeiajiskycccgqlnemzvelnxpqdutwgcosijlniottagirzjjqcnb'),
);

beforeEach(async () => {
  await v_1ed7d9.getState().hydrate();
});

function v_222dba(v_6e0fd3): any {
  return {
    route: { params: { cloneId: v_6e0fd3 } },
    navigation: { goBack: jest.fn() },
  };
}

test('Chat renders only messages belonging to this clone + current user', () => {
  const v_518617 = v_35d5ed.clones.find((v_3f4e2e) =>
    v_35d5ed.messages.some((v_35f85c) => v_35f85c.cloneId === v_3f4e2e.id && v_35f85c.userId === 'user-001'),
  );
  expect(v_518617).toBeTruthy();

  const { queryByText: v_480380 } = v_624657(
    <ChatScreen {...v_222dba(v_518617!.id)} />,
  );

  const v_505a6d = v_35d5ed.messages.filter(
    (v_35f85c) => v_35f85c.cloneId === v_518617!.id && v_35f85c.userId === 'user-001',
  );

  expect(v_480380(v_505a6d[0].text)).toBeTruthy();

  const v_e116ee = v_35d5ed.messages.find(
    (v_35f85c) => v_35f85c.cloneId !== v_518617!.id && v_35f85c.userId === 'user-001',
  );
  if (v_e116ee) {
    expect(v_480380(v_e116ee.text)).toBeNull();
  }
});
