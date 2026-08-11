import { showAlert } from "../../stores/dialogStore";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { useFollowStore } from '../../stores/followStore';
import { useCloneStore } from '../../stores/cloneStore';
import { seedSource } from '../../api/source';
import { getBreadcrumbs, reportError } from '../../lib/errorReporting/report';
import {
  cycleSilhouetteScale,
  getSilhouetteScale,
  isT208MeasureMode,
  setT208MeasureMode,
  silhouetteScaleLabel,
} from '../../lib/t208SilhouetteScale';
import {
  clearT208Crops,
  t208AllCropsReady,
  t208CropsSummary,
} from '../../lib/t208MeasureStore';
import { useDevOverlayStore } from '../../stores/devOverlayStore';

export interface DevAction {
  icon: string;
  label: string;
  onPress: () => void | Promise<void>;
}

export function defaultDevActions(): DevAction[] {
  return [
    {
      icon: 'eye-off',
      label: '통화 DEV UI',
      onPress: () => {
        useDevOverlayStore.getState().toggleCallDevUiVisible();
        const on = useDevOverlayStore.getState().callDevUiVisible;
        showAlert(
          '통화 DEV UI (마스터)',
          on
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
        await AsyncStorage.clear();
        await useAuthStore.getState().hydrate();
        useFollowStore.setState({ follows: [], hydrated: false });
        await useFollowStore.getState().hydrate();
        useCloneStore.setState({ localClones: [] });
      },
    },
    {
      icon: 'database',
      label: 'Seed 카운트',
      onPress: () => {
        const counts = {
          users: seedSource.users().length,
          clones: seedSource.clones().length,
          follows: seedSource.follows().length,
          coowners: seedSource.coowners().length,
          messages: seedSource.messages().length,
          feeds: seedSource.feeds().length,
        };
        showAlert('SEED counts', JSON.stringify(counts, null, 2));
      },
    },
    {
      icon: 'alert-triangle',
      label: 'T-220 테스트 에러',
      onPress: () => {
        reportError(new Error('T-220 deliberate test error'), {
          isFatal: false,
          extra: {
            accessToken: 'should-be-redacted',
            transcript: '사용자 발화 테스트',
            route: 'DevFloatingBall',
          },
        });
        const crumbs = getBreadcrumbs().slice(-8);
        showAlert(
          'T-220 reportError 호출됨',
          `Metro 콘솔에 [errorReporting] 로그 확인.\n브레드크럼 ${crumbs.length}건.`,
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
        const next = !isT208MeasureMode();
        setT208MeasureMode(next);
        if (next) {
          showAlert(
            'T-208 실측 모드 ON',
            [
              '목적: 같은 사진을 배율 3종으로 크롭 → 클론 3개 → 렌더 비교',
              '',
              `지금 배율: ${silhouetteScaleLabel(getSilhouetteScale())}`,
              '현황: ' + t208CropsSummary(),
              '',
              '1. 「T-208 배율 변경」또는 크롭 후 자동 전환으로 0.75/0.50/0.40',
              '2. 생성→사진→크롭: 가이드에 얼굴 맞추고 확인(기록됨)',
              '3. 3종 ✓ 후 클론 생성 시 사진 시트에서「T-208 … 불러오기」',
              '4. 음성·페르소나 동일 클론 3개 → 가비아 동일 대사 렌더',
            ].join('\n'),
          );
        } else {
          showAlert('T-208 실측 모드 OFF', '크롭·카메라 가이드는 제품 기본(0.75)으로 돌아갑니다.');
        }
      },
    },
    {
      icon: 'maximize',
      label: 'T-208 배율 변경',
      onPress: () => {
        if (!isT208MeasureMode()) {
          showAlert('T-208', '먼저「T-208 실측 모드」를 켜세요.');
          return;
        }
        const next = cycleSilhouetteScale();
        showAlert(
          'T-208 배율',
          `${silhouetteScaleLabel(next)}\n현황 ${t208CropsSummary()}\n\n생성→사진에서 같은 사진으로 크롭하세요.`,
        );
      },
    },
    {
      icon: 'list',
      label: 'T-208 크롭 현황',
      onPress: () => {
        const ready = t208AllCropsReady();
        showAlert(
          'T-208 크롭 현황',
          [
            t208CropsSummary(),
            ready ? '\n✓ 3종 완료 — 클론 3개 생성으로 진행' : '\n미완료 배율이 있습니다.',
            '\n(실측 모드 ' + (isT208MeasureMode() ? 'ON' : 'OFF') + ')',
          ].join('\n'),
        );
      },
    },
    {
      icon: 'trash-2',
      label: 'T-208 크롭 초기화',
      onPress: async () => {
        await clearT208Crops();
        showAlert('T-208', '기록한 크롭 3종을 비웠습니다.');
      },
    },
  ];
}
