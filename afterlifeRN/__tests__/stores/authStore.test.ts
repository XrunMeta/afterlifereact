import v_e84827 from 'bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv';
import { v_1ed7d9 } from '../../src/stores/authStore';

jest.mock('bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv', () =>
  require('jmodvmzutjjlqeiajiskycccgqlnemzvelnxpqdutwgcosijlniottagirzjjqcnb'),
);

describe('authStore', () => {
  beforeEach(async () => {
    await v_e84827.clear();
    v_1ed7d9.setState({ isLoggedIn: false, user: null, hydrated: false });
  });

  it('hydrate loads user-001 when no stored id', async () => {
    await v_1ed7d9.getState().hydrate();
    const v_ceb55a = v_1ed7d9.getState().user;
    expect(v_ceb55a?.id).toBe('user-001');
    expect(v_1ed7d9.getState().isLoggedIn).toBe(true);
    expect(v_1ed7d9.getState().hydrated).toBe(true);
  });

  it('switchUser updates state and persists', async () => {
    await v_1ed7d9.getState().hydrate();
    await v_1ed7d9.getState().switchUser('user-003');
    expect(v_1ed7d9.getState().user?.id).toBe('user-003');
    const v_39de0e = await v_e84827.getItem('@afterlifeRN/auth/currentUserId');
    expect(v_39de0e).toBe('user-003');
  });

  it('hydrate restores previously stored userId', async () => {
    await v_e84827.setItem('@afterlifeRN/auth/currentUserId', 'user-005');
    await v_1ed7d9.getState().hydrate();
    expect(v_1ed7d9.getState().user?.id).toBe('user-005');
  });

  it('logout clears state and removes stored id', async () => {
    await v_1ed7d9.getState().hydrate();
    await v_1ed7d9.getState().logout();
    expect(v_1ed7d9.getState().user).toBeNull();
    expect(v_1ed7d9.getState().isLoggedIn).toBe(false);
    const v_39de0e = await v_e84827.getItem('@afterlifeRN/auth/currentUserId');
    expect(v_39de0e).toBeNull();
  });
});
