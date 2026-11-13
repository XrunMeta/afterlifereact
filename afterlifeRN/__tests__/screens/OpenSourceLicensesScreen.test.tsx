
import v_a3453e from 'bapkr';
import { v_624657, v_53746a, v_77aa68 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import { v_f2c756 } from 'rcmrninabrnb';

const v_7b8db1 = jest.fn();
let v_95b46a;

jest.mock('ixigazcpvfldbecwtbvavtbi', () => ({
  useNavigation: () => ({ goBack: jest.fn(), navigate: v_7b8db1 }),
  useRoute: () => ({ params: v_95b46a }),
}));

jest.mock('zvyjokvuouwvifyzks', () => ({ Feather: 'Feather' }));

jest.mock('jmpfvteuuztnp', () => ({
  useTranslation: () => ({
    t: (v_b24339, v_328259) => {
      const v_694b25 = (v_328259?.defaultValue as string | undefined) ?? v_b24339;
      return Object.entries(v_328259 ?? {}).reduce((v_fd5f43, [v_0eb677, v_81e2ef]) => v_fd5f43.replace(`{{${v_0eb677}}}`, String(v_81e2ef)), v_694b25);
    },
    i18n: { language: 'ko' },
  }),
}));

import v_e44da0 from '../../src/screens/my/licenses/OpenSourceLicensesScreen';
import v_14cf10 from '../../src/screens/my/licenses/OpenSourceLicenseDetailScreen';
import { v_8bf970, v_681165 } from '../../src/screens/my/licenses/licenseData';

describe('OpenSourceLicensesScreen', () => {
  beforeEach(() => v_7b8db1.mockClear());

  it('섹션 제목과 전체 개수를 보여준다', () => {
    v_624657(<OpenSourceLicensesScreen />);
    expect(v_53746a.getByText(new RegExp(`${v_8bf970.length}개`))).toBeTruthy();
    expect(v_53746a.getByText(/^앱에 포함된 오픈소스 · \d+$/)).toBeTruthy();
    expect(v_53746a.getByText(/^서버 AI 모델·구성요소 · \d+$/)).toBeTruthy();
  });

  it('항목을 누르면 원문 화면으로 index 를 넘긴다', () => {
    v_624657(<OpenSourceLicensesScreen />);
    v_77aa68.press(v_53746a.getByTestId('oss-license-row-0'));
    expect(v_7b8db1).toHaveBeenCalledWith('OpenSourceLicenseDetail', { index: 0 });
  });

  it('검색하면 걸러지고, 없으면 빈 안내', () => {
    v_624657(<OpenSourceLicensesScreen />);
    v_77aa68.changeText(v_53746a.getByTestId('oss-licenses-search'), 'odbl');
    expect(v_53746a.getByText('Countries States Cities Database')).toBeTruthy();
    expect(v_53746a.queryByText('react-native-webrtc')).toBeNull();
    v_77aa68.changeText(v_53746a.getByTestId('oss-licenses-search'), 'zzzz-no-such');
    expect(v_53746a.getByText('검색 결과가 없어요')).toBeTruthy();
  });
});

describe('OpenSourceLicenseDetailScreen', () => {
  it('npm 패키지는 라이선스 원문을 보여준다', () => {
    const v_a56041 = v_8bf970.findIndex((v_9e86fd) => v_9e86fd.name === 'react-native-webrtc');
    v_95b46a = { index: v_a56041 };
    v_624657(<OpenSourceLicenseDetailScreen />);
    const v_9b6134 = v_681165(v_8bf970[v_a56041]!)!;
    expect(v_53746a.getByText(v_9b6134)).toBeTruthy();
  });

  it('npm 밖 항목은 고지 문구와 링크', () => {
    const v_a56041 = v_8bf970.findIndex((v_9e86fd) => v_9e86fd.section === 'data');
    v_95b46a = { index: v_a56041 };
    const v_207c31 = jest.spyOn(v_f2c756, 'openURL').mockResolvedValue(true);
    v_624657(<OpenSourceLicenseDetailScreen />);
    expect(v_53746a.getByText(/Open Database License v1\.0/)).toBeTruthy();
    expect(v_53746a.getByText('이 항목의 라이선스 원문은 위 링크에서 확인할 수 있어요.')).toBeTruthy();
    v_77aa68.press(v_53746a.getByTestId('oss-license-link'));
    expect(v_207c31).toHaveBeenCalledWith('https://github.com/dr5hn/countries-states-cities-database');
  });

  it('없는 index 면 빈 화면(크래시 없음)', () => {
    v_95b46a = { index: 99999 };
    v_624657(<OpenSourceLicenseDetailScreen />);
    expect(v_53746a.queryByTestId('oss-license-link')).toBeNull();
  });
});
