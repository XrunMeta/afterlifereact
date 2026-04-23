import { useConfigStore } from '../../src/stores/configStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

beforeEach(async () => {
  await AsyncStorage.clear();
  useConfigStore.setState({ testMode: false, baseUrl: 'https://oth-path.prod' });
});

test('toggling testMode switches baseUrl to preview and persists', async () => {
  await useConfigStore.getState().setTestMode(true);
  expect(useConfigStore.getState().baseUrl).toBe('https://oth-path.preview');
  const state = await AsyncStorage.getItem('afterlife.config');
  expect(state).toContain('preview');
});

test('hydrate restores testMode', async () => {
  await AsyncStorage.setItem('afterlife.config', JSON.stringify({ testMode: true }));
  await useConfigStore.getState().hydrate();
  expect(useConfigStore.getState().testMode).toBe(true);
  expect(useConfigStore.getState().baseUrl).toBe('https://oth-path.preview');
});
