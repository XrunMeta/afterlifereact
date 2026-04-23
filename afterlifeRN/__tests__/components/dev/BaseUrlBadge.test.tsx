import v_a3453e from 'bapkr';
import { v_624657 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import { v_d0625e } from '../../../src/components/dev/BaseUrlBadge';
import { v_0b10a6 } from '../../../src/stores/configStore';

jest.mock('bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv', () =>
  require('jmodvmzutjjlqeiajiskycccgqlnemzvelnxpqdutwgcosijlniottagirzjjqcnb'),
);

test('renders nothing in prod', () => {
  v_0b10a6.setState({ testMode: false, baseUrl: 'https://oth-path.prod' } as any);
  const { toJSON: v_21dbe2 } = v_624657(<BaseUrlBadge />);
  expect(v_21dbe2()).toBeNull();
});

test('renders PREVIEW badge in test mode', () => {
  v_0b10a6.setState({ testMode: true, baseUrl: 'https://oth-path.preview' } as any);
  const { getByText: v_2b0f8a } = v_624657(<BaseUrlBadge />);
  expect(v_2b0f8a('PREVIEW')).toBeTruthy();
});
