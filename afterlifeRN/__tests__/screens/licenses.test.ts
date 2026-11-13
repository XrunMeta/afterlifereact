

import v_e42213 from '../../package.json';
import {
  v_8bf970,
  v_d2a95e,
  v_681165,
  v_00f7e1,
} from '../../src/screens/my/licenses/licenseData';

const v_48340f = new Set([
  '@expo/metro-runtime',
  'babel-preset-expo',
  'expo-build-properties',
  'jpeg-js',
  'react-dom',
  'react-native-web',
  'react-refresh',
]);

const v_62138a = /\b(A?GPL|LGPL|SSPL|EUPL|MPL|CC-BY-NC|NC-|Non-?Commercial|CPAL|OSL)\b/i;

describe('오픈소스 라이선스 고지 데이터', () => {
  const v_0d60b7 = v_8bf970.filter((v_9e86fd) => v_9e86fd.section === 'app' || v_9e86fd.section === 'native');

  it('앱에 들어가는 구성요소에 copyleft·비상업 라이선스가 없다', () => {
    const v_0af197 = v_0d60b7.filter((v_9e86fd) => v_62138a.test(v_9e86fd.license)).map((v_9e86fd) => `${v_9e86fd.name}@${v_9e86fd.version} ${v_9e86fd.license}`);
    expect(v_0af197).toEqual([]);
  });

  it('제거한 GPL 패키지가 다시 들어오지 않았다', () => {
    const v_77b1ac = new Set(v_8bf970.map((v_9e86fd) => v_9e86fd.name));
    expect(v_77b1ac.has('country-state-city')).toBe(false);
    expect(v_77b1ac.has('@siteed/sherpa-onnx.rn')).toBe(false);
  });

  it('package.json 직접 의존성이 고지 목록에 모두 있다 (재생성 누락 감지)', () => {
    const v_ffafd6 = new Set(v_8bf970.filter((v_9e86fd) => v_9e86fd.section === 'app').map((v_9e86fd) => v_9e86fd.name));
    const v_2e5207 = Object.keys(v_e42213.dependencies).filter((v_f4e98d) => !v_48340f.has(v_f4e98d) && !v_ffafd6.has(v_f4e98d));
    expect(v_2e5207).toEqual([]);
  });

  it('npm 패키지(app·server)는 모두 라이선스 원문이 있다', () => {
    const v_767964 = v_8bf970.filter((v_9e86fd) => (v_9e86fd.section === 'app' || v_9e86fd.section === 'server') && !v_681165(v_9e86fd));
    expect(v_767964.map((v_9e86fd) => v_9e86fd.name)).toEqual([]);
  });

  it('npm 밖 항목은 링크가 있다', () => {
    const v_cd8036 = v_8bf970.filter((v_9e86fd) => !v_9e86fd.textId && !v_9e86fd.url);
    expect(v_cd8036.map((v_9e86fd) => v_9e86fd.name)).toEqual([]);
  });

  it('ODbL 지역 데이터 출처 고지가 들어 있다 (AFL-1092)', () => {
    const v_8539fa = v_8bf970.find((v_9e86fd) => v_9e86fd.section === 'data' && v_9e86fd.license === 'ODbL-1.0');
    expect(v_8539fa?.notice).toMatch(/Open Database License/);
  });

  it('모든 섹션에 항목이 있다', () => {
    const v_d33715 = v_00f7e1('');
    expect(v_d33715.map((v_206b88) => v_206b88.id)).toEqual(v_d2a95e.map((v_fd5f43) => v_fd5f43.id));
  });

  it('검색은 이름·라이선스로 대소문자 무시', () => {
    const v_86df27 = v_00f7e1('REACT-NATIVE-WEBRTC').flatMap((v_206b88) => v_206b88.items);
    expect(v_86df27.some(({ entry: v_2b8338 }) => v_2b8338.name === 'react-native-webrtc')).toBe(true);
    const v_91c5ea = v_00f7e1('odbl').flatMap((v_206b88) => v_206b88.items);
    expect(v_91c5ea).toHaveLength(1);
    expect(v_00f7e1('zzzz-no-such-package')).toEqual([]);
  });

  it('검색 결과 index 는 원래 목록 위치를 가리킨다 (원문 화면 이동용)', () => {
    for (const { index: v_a56041, entry: v_2b8338 } of v_00f7e1('expo').flatMap((v_206b88) => v_206b88.items)) {
      expect(v_8bf970[v_a56041]).toBe(v_2b8338);
    }
  });
});
