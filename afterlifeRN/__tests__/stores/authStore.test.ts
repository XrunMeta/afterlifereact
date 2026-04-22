import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../src/stores/authStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('authStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useAuthStore.setState({ isLoggedIn: false, user: null, hydrated: false });
  });

  it('hydrate loads user id 1 when no stored id', async () => {
    await useAuthStore.getState().hydrate();
    const u = useAuthStore.getState().user;
    expect(u?.id).toBe(1);
    expect(useAuthStore.getState().isLoggedIn).toBe(true);
    expect(useAuthStore.getState().hydrated).toBe(true);
  });

  it('switchUser updates state and persists', async () => {
    await useAuthStore.getState().hydrate();
    await useAuthStore.getState().switchUser(3);
    expect(useAuthStore.getState().user?.id).toBe(3);
    const saved = await AsyncStorage.getItem('@afterlifeRN/auth/currentUserId');
    expect(saved).toBe('3');
  });

  it('hydrate restores previously stored userId', async () => {
    await AsyncStorage.setItem('@afterlifeRN/auth/currentUserId', '5');
    await useAuthStore.getState().hydrate();
    expect(useAuthStore.getState().user?.id).toBe(5);
  });

  it('logout clears state and removes stored id', async () => {
    await useAuthStore.getState().hydrate();
    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isLoggedIn).toBe(false);
    const saved = await AsyncStorage.getItem('@afterlifeRN/auth/currentUserId');
    expect(saved).toBeNull();
  });
});
