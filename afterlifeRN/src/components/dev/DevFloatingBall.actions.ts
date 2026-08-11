import { v_889fad } from "../../stores/dialogStore";
import v_e84827 from 'bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv';
import { v_03e392 } from 'rcmrninabrnb';
import { v_1ed7d9 } from '../../stores/authStore';
import { v_b4902e } from '../../stores/followStore';
import { v_194498 } from '../../stores/cloneStore';
import { v_694b7f } from '../../api/source';
import { v_13dbc7, v_8827ec } from '../../lib/errorReporting/report';
import {
  v_a1a567,
  v_069313,
  v_6036cc,
  v_eab35e,
  v_8b5209,
} from '../../lib/t208SilhouetteScale';
import {
  v_2c25c5,
  v_951fee,
  v_890a60,
} from '../../lib/t208MeasureStore';
import { v_434962 } from '../../stores/devOverlayStore';

export interface DevAction {
  icon: string;
  label: string;
  onPress: () => void | Promise<void>;
}

export function v_407cbf(): DevAction[] {
  return [
    {
      icon: 'eye-off',
      label: '통화 DEV UI',
      onPress: () => {
        v_434962.getState().toggleCallDevUiVisible();
        const v_abacaa = v_434962.getState().callDevUiVisible;
        v_889fad(
          '통화 DEV UI (마스터)',
          v_abacaa
            ? '표시 ON — 텍스트 발화 바가 켜지고, 아래 「통화 HUD」에서 체크한 HUD 만 통화 화면에 보입니다.'
            : '표시 OFF — 통화 화면 DEV 오버레이를 전부 숨깁니다. (기본값)',
        );
      },
    },
    {
      icon: 'user',
      label: '유저 스위치',
      onPress: () => {

      },
    },
    {
      icon: 'refresh-cw',
      label: 'Seed 리셋',
      onPress: async () => {
        await v_e84827.clear();
        await v_1ed7d9.getState().hydrate();
        v_b4902e.setState({ follows: [], hydrated: false });
        await v_b4902e.getState().hydrate();
        v_194498.setState({ localClones: [] });
      },
    },
    {
      icon: 'database',
      label: 'Seed 카운트',
      onPress: () => {
        const v_6ddb32 = {
          users: v_694b7f.users().length,
          clones: v_694b7f.clones().length,
          follows: v_694b7f.follows().length,
          coowners: v_694b7f.coowners().length,
          messages: v_694b7f.messages().length,
          feeds: v_694b7f.feeds().length,
        };
        v_889fad('SEED counts', JSON.stringify(v_6ddb32, null, 2));
      },
    },
    {
      icon: 'alert-triangle',
      label: 'T-220 테스트 에러',
      onPress: () => {
        v_8827ec(new Error('T-220 deliberate test error'), {
          isFatal: false,
          extra: {
            accessToken: 'should-be-redacted',
            transcript: '사용자 발화 테스트',
            route: 'DevFloatingBall',
          },
        });
        const v_27d2ec = v_13dbc7().slice(-8);
        v_889fad(
          'T-220 reportError 호출됨',
          `Metro 콘솔에 [errorReporting] 로그 확인.\n브레드크럼 ${v_27d2ec.length}건.`,
        );
      },
    },
    {
      icon: 'x-octagon',
      label: 'T-220 Boundary 크래시',
      onPress: () => {
        throw new Error('T-220 deliberate ErrorBoundary crash');
      },
    },
    {
      icon: 'crosshair',
      label: 'T-208 실측 모드',
      onPress: () => {
        const v_a448ad = !v_6036cc();
        v_eab35e(v_a448ad);
        if (v_a448ad) {
          v_889fad(
            'T-208 실측 모드 ON',
            [
              '목적: 같은 사진을 배율 3종으로 크롭 → 클론 3개 → 렌더 비교',
              '',
              `지금 배율: ${v_8b5209(v_069313())}`,
              '현황: ' + v_890a60(),
              '',
              '1. 「T-208 배율 변경」또는 크롭 후 자동 전환으로 0.75/0.50/0.40',
              '2. 생성→사진→크롭: 가이드에 얼굴 맞추고 확인(기록됨)',
              '3. 3종 ✓ 후 클론 생성 시 사진 시트에서「T-208 … 불러오기」',
              '4. 음성·페르소나 동일 클론 3개 → 가비아 동일 대사 렌더',
            ].join('\n'),
          );
        } else {
          v_889fad('T-208 실측 모드 OFF', '크롭·카메라 가이드는 제품 기본(0.75)으로 돌아갑니다.');
        }
      },
    },
    {
      icon: 'maximize',
      label: 'T-208 배율 변경',
      onPress: () => {
        if (!v_6036cc()) {
          v_889fad('T-208', '먼저「T-208 실측 모드」를 켜세요.');
          return;
        }
        const v_a448ad = v_a1a567();
        v_889fad(
          'T-208 배율',
          `${v_8b5209(v_a448ad)}\n현황 ${v_890a60()}\n\n생성→사진에서 같은 사진으로 크롭하세요.`,
        );
      },
    },
    {
      icon: 'list',
      label: 'T-208 크롭 현황',
      onPress: () => {
        const v_b1717e = v_951fee();
        v_889fad(
          'T-208 크롭 현황',
          [
            v_890a60(),
            v_b1717e ? '\n✓ 3종 완료 — 클론 3개 생성으로 진행' : '\n미완료 배율이 있습니다.',
            '\n(실측 모드 ' + (v_6036cc() ? 'ON' : 'OFF') + ')',
          ].join('\n'),
        );
      },
    },
    {
      icon: 'trash-2',
      label: 'T-208 크롭 초기화',
      onPress: async () => {
        await v_2c25c5();
        v_889fad('T-208', '기록한 크롭 3종을 비웠습니다.');
      },
    },
  ];
}
