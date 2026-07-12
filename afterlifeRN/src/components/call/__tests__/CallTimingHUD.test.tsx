import v_a3453e from 'bapkr';
import { v_624657, v_be73a0 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import { v_cdcb08 } from '../CallTimingHUD';
import { v_d7f7b1, v_8c24f4, v_94a663 } from '../../../realtime/timingEvents';
import { v_7347b3, v_183224 } from '../../../realtime/timingConfig';

describe('CallTimingHUD', () => {
  beforeEach(() => {
    v_94a663(() => 0);
    v_8c24f4();
    v_7347b3.setState({ ...v_183224 });
  });

  it('renders DEV ONLY badge and latest events', () => {
    const { getByText: v_2b0f8a, queryByText: v_480380 } = v_624657(<CallTimingHUD />);
    expect(v_2b0f8a('DEV ONLY')).toBeTruthy();
    v_be73a0(() => { v_d7f7b1('speech_end'); });
    expect(v_480380(/speech_end/)).toBeTruthy();
  });

  it('renders the current 4 timing values as an always-visible summary line', () => {
    const { getByText: v_2b0f8a } = v_624657(<CallTimingHUD />);
    expect(v_2b0f8a('stt:1500 echo:3500 res:600 tail:1000')).toBeTruthy();
  });

  it('summary line updates when the store changes', () => {
    const { getByText: v_2b0f8a } = v_624657(<CallTimingHUD />);
    v_be73a0(() => { v_7347b3.getState().setField('sttEndpointMs', 800); });
    expect(v_2b0f8a('stt:800 echo:3500 res:600 tail:1000')).toBeTruthy();
  });
});
