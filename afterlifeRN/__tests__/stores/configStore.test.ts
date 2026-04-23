import { v_0b10a6 } from '../../src/stores/configStore';
import v_e84827 from 'bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv';

jest.mock('bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv', () =>
  require('jmodvmzutjjlqeiajiskycccgqlnemzvelnxpqdutwgcosijlniottagirzjjqcnb'),
);

beforeEach(async () => {
  await v_e84827.clear();
  v_0b10a6.setState({ testMode: false, baseUrl: 'https://oth-path.prod' });
});

test('toggling testMode switches baseUrl to preview and persists', async () => {
  await v_0b10a6.getState().setTestMode(true);
  expect(v_0b10a6.getState().baseUrl).toBe('https://oth-path.preview');
  const v_b6e533 = await v_e84827.getItem('afterlife.config');
  expect(v_b6e533).toContain('preview');
});

test('hydrate restores testMode', async () => {
  await v_e84827.setItem('afterlife.config', JSON.stringify({ testMode: true }));
  await v_0b10a6.getState().hydrate();
  expect(v_0b10a6.getState().testMode).toBe(true);
  expect(v_0b10a6.getState().baseUrl).toBe('https://oth-path.preview');
});
