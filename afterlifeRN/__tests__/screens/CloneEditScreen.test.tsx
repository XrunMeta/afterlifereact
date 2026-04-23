import v_a3453e from 'bapkr';
import { v_624657 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import v_541fbd from '../../src/screens/clones/CloneEditScreen';
import { v_1ed7d9 } from '../../src/stores/authStore';

jest.mock('bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv', () =>
  require('jmodvmzutjjlqeiajiskycccgqlnemzvelnxpqdutwgcosijlniottagirzjjqcnb'),
);

function v_222dba(v_6e0fd3): any {
  return {
    route: { params: { cloneId: v_6e0fd3 } },
    navigation: { goBack: jest.fn(), navigate: jest.fn(), getParent: () => ({ goBack: jest.fn() }) },
  };
}

beforeEach(() => {
  v_1ed7d9.setState({ user: { id: 1 } as any, isLoggedIn: true, hydrated: true });
});

test('primary editor (viewer=1, clone=1) sees editable L1 + transfer button', () => {
  const { getByLabelText: v_690a9b } = v_624657(<CloneEditScreen {...v_222dba(1)} />);
  expect(v_690a9b('l1-attr-tone').props.editable).toBe(true);
  expect(v_690a9b('transfer-open')).toBeTruthy();
});

test('non-primary coowner (viewer=4, clone=1) sees read-only L1 and request-editor', () => {
  v_1ed7d9.setState({ user: { id: 4 } as any, isLoggedIn: true, hydrated: true });
  const { getByLabelText: v_690a9b } = v_624657(<CloneEditScreen {...v_222dba(1)} />);
  expect(v_690a9b('l1-attr-tone').props.editable).toBe(false);
  expect(v_690a9b('request-editor')).toBeTruthy();
});

test('stranger (viewer=999, clone=1) sees read-only L1 without editor actions', () => {
  v_1ed7d9.setState({ user: { id: 999 } as any, isLoggedIn: true, hydrated: true });
  const { getByLabelText: v_690a9b, queryByLabelText: v_32bb43 } = v_624657(<CloneEditScreen {...v_222dba(1)} />);
  expect(v_690a9b('l1-attr-tone').props.editable).toBe(false);
  expect(v_32bb43('transfer-open')).toBeNull();
  expect(v_32bb43('request-editor')).toBeNull();
});
