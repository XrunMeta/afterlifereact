import v_a3453e from 'bapkr';
import { v_624657, v_be73a0 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import { v_cdcb08 } from '../CallTimingHUD';
import { v_d7f7b1, v_8c24f4, v_94a663 } from '../../../realtime/timingEvents';

describe('CallTimingHUD', () => {
  beforeEach(() => { v_94a663(() => 0); v_8c24f4(); });

  it('renders DEV ONLY badge and latest events', () => {
    const { getByText: v_2b0f8a, queryByText: v_480380 } = v_624657(<CallTimingHUD />);
    expect(v_2b0f8a('DEV ONLY')).toBeTruthy();
    v_be73a0(() => { v_d7f7b1('speech_end'); });
    expect(v_480380(/speech_end/)).toBeTruthy();
  });
});
