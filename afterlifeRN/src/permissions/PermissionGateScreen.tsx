

import v_a3453e, { v_de06a3, v_c4deb2, v_df9f57, v_5ab095 } from 'bapkr';
import { v_3094a2, v_19b633, v_472849, v_39a996, v_4623af } from 'rcmrninabrnb';
import { v_772971 } from 'jmpfvteuuztnp';
import { v_dec439 } from 'zvyjokvuouwvifyzks';
import v_556baf from '../components/ui/SafeView';
import v_1a40c4 from '../components/ui/Button';
import v_c0caa9, { type v_3ac6ea } from '../components/common/TermsModal';
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from '../components/constants';
import { v_1ed7d9 } from '../stores/authStore';
import {
  v_b14b3b,
  v_0f8436,
  v_7f847d,
  v_421733,
  type v_6a3f07,
  type v_f8228d,
} from '../api/consent';
import { v_b5d684 } from './usePermissionGate';
import type { v_2455ca } from './permissionGate';

function v_c4180e(v_8d41d7, status: v_2455ca): string {
  switch (v_d308b5) {
    case 'granted':
      return v_8d41d7('permissionGate.statusGranted');
    case 'blocked':
      return v_8d41d7('permissionGate.statusBlocked');
    case 'denied':
      return v_8d41d7('permissionGate.statusDenied');
    case 'undetermined':
    default:
      return v_8d41d7('permissionGate.statusUndetermined');
  }
}

function v_dd5e8b(status: v_2455ca): string {
  switch (v_d308b5) {
    case 'granted':
      return v_1bfbd0.success;
    case 'blocked':
    case 'denied':
      return v_1bfbd0.error;
    case 'undetermined':
    default:
      return v_1bfbd0.zinc400;
  }
}

function v_fb542f({ icon: v_9ddfab, label: v_2869c1, status: v_d308b5 }: { icon: 'camera' | 'mic' | 'map-pin'; label: string; status: v_2455ca }) {
  const { t: v_8d41d7 } = v_772971();
  return (
    <View style={v_d81136.row} accessibilityRole="text" accessibilityLabel={`${v_2869c1}: ${v_c4180e(v_8d41d7, v_d308b5)}`}>
      <View style={v_d81136.rowIcon}>
        <Feather name={v_9ddfab} size={20} color={v_1bfbd0.zinc700} />
      </View>
      <Text style={v_d81136.rowLabel}>{v_2869c1}</Text>
      <View style={[v_d81136.badge, { backgroundColor: v_dd5e8b(v_d308b5) }]}>
        <Text style={v_d81136.badgeText}>{v_c4180e(v_8d41d7, v_d308b5)}</Text>
      </View>
    </View>
  );
}

export default function v_6d377c() {
  const { t: v_8d41d7 } = v_772971();
  const { state: v_b6e533, decision: v_403b73, loading: v_683210, error: v_5e9bfe, request: v_576f5a, openSettings: v_063c7a, recheck: v_f3f9e8 } = v_b5d684();
  const v_9b51bc = v_1ed7d9((v_fd5f43) => v_fd5f43.apiLogout);
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);

  const [v_bbb3d3, v_346016] = v_5ab095<v_f8228d | null>(null);
  const [v_2c3180, v_9cd603] = v_5ab095<v_6a3f07 | null>(null);

  const [v_c7afb2, v_645639] = v_5ab095(true);
  const [v_f5d2c6, v_d7aae4] = v_5ab095(true);

  const [v_71f413, v_64ef22] = v_5ab095(false);

  const [v_d39271, v_fe0d62] = v_5ab095<v_3ac6ea | null>(null);

  v_c4deb2(() => {
    if (!v_2ca7e0) return;
    let v_2008a4 = false;
    (async () => {
      try {
        const [v_7d769d, v_51c3d2] = await Promise.all([
          v_0f8436(v_2ca7e0),
          v_b14b3b(v_2ca7e0),
        ]);
        if (v_2008a4) return;
        v_346016(v_7d769d.state);
        v_9cd603(v_51c3d2);
      } catch (v_49263d) {
        console.warn('[PermissionGateScreen] consent fetch failed:', v_49263d);
        if (!v_2008a4) {
          v_346016('granted'); 
          v_9cd603('granted');
        }
      }
    })();
    return () => { v_2008a4 = true; };
  }, [v_2ca7e0]);

  const v_73a08a = v_bbb3d3 !== null && v_bbb3d3 !== 'granted';
  const v_02cb13 = v_2c3180 !== null && v_2c3180 !== 'granted';
  const v_a8c580 = v_73a08a || v_02cb13;

  const v_0577ff = v_de06a3(async () => {
    if (!v_2ca7e0 || !v_a8c580) {
      void v_576f5a();
      return;
    }
    v_64ef22(true);
    try {
      const v_cc6696 = [];
      if (v_73a08a) {
        v_cc6696.push(
          v_421733(v_2ca7e0, v_c7afb2 ? 'granted' : 'revoked', {
            channel: 'settings',
          }).then((v_8f00b9) => {
            v_346016(v_8f00b9.state as v_f8228d);
          }).catch((v_49263d) => {
            console.warn('[PermissionGateScreen] saveFaceBiometricConsent failed:', v_49263d);
          }),
        );
      }
      if (v_02cb13) {
        v_cc6696.push(
          v_7f847d(v_2ca7e0, v_f5d2c6 ? 'granted' : 'revoked', {
            channel: 'settings',
          }).then((v_8f00b9) => {
            v_9cd603(v_8f00b9.state as v_6a3f07);
          }).catch((v_49263d) => {
            console.warn('[PermissionGateScreen] saveCallLearningConsent failed:', v_49263d);
          }),
        );
      }
      await Promise.all(v_cc6696);
    } finally {
      v_64ef22(false);
    }
    await v_576f5a();
  }, [v_2ca7e0, v_a8c580, v_73a08a, v_02cb13, v_c7afb2, v_f5d2c6, v_576f5a]);

  const v_9ddd1d = v_683210 || v_71f413;

  const v_7e21bd = v_df9f57(() => {
    if (!v_a8c580) return null;
    return (
      <View style={v_d81136.consentCard}>
        <Text style={v_d81136.consentIntro}>{v_8d41d7('permissionGate.consentIntro', { defaultValue: '통화 전에 아래 동의를 확인해 주세요.' })}</Text>
        {v_02cb13 && (
          <View style={v_d81136.checkRow}>
            <TouchableOpacity onPress={() => v_d7aae4(!v_f5d2c6)} hitSlop={8}>
              <View style={[v_d81136.checkbox, v_f5d2c6 && v_d81136.checkboxChecked]}>
                {v_f5d2c6 && <Feather name="check" size={14} color={v_1bfbd0.white} />}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={v_d81136.termTextWrap}
              onPress={() => v_fe0d62(5)}
              activeOpacity={0.7}
            >
              <Text style={[v_d81136.termText, v_d81136.termLink]}>
                {v_8d41d7('permissionGate.callLearningConsent', { defaultValue: '(선택) 통화 대화 학습에 동의합니다' })}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {v_73a08a && (
          <View style={v_d81136.checkRow}>
            <TouchableOpacity onPress={() => v_645639(!v_c7afb2)} hitSlop={8}>
              <View style={[v_d81136.checkbox, v_c7afb2 && v_d81136.checkboxChecked]}>
                {v_c7afb2 && <Feather name="check" size={14} color={v_1bfbd0.white} />}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={v_d81136.termTextWrap}
              onPress={() => v_fe0d62(4)}
              activeOpacity={0.7}
            >
              <Text style={[v_d81136.termText, v_d81136.termLink]}>
                {v_8d41d7('permissionGate.faceBiometricConsent', { defaultValue: '(선택) 얼굴 인식(생체정보) 활용에 동의합니다' })}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }, [v_a8c580, v_02cb13, v_73a08a, v_f5d2c6, v_c7afb2, v_8d41d7]);

  return (
    <SafeView backgroundColor={v_1bfbd0.zinc50}>
      <View style={v_d81136.content}>
        <View style={v_d81136.iconWrap}>
          <Feather name="video" size={36} color={v_1bfbd0.white} />
        </View>
        <Text style={v_d81136.title}>{v_8d41d7('permissionGate.title')}</Text>
        <Text style={v_d81136.desc}>{v_8d41d7('permissionGate.desc')}</Text>

        <View style={v_d81136.card}>
          <PermRow icon="camera" label={v_8d41d7('permissionGate.cameraLabel')} status={v_b6e533.camera} />
          <View style={v_d81136.divider} />
          <PermRow icon="mic" label={v_8d41d7('permissionGate.micLabel')} status={v_b6e533.mic} />
          <View style={v_d81136.divider} />
          {}
          <PermRow icon="map-pin" label={v_8d41d7('permissionGate.locationLabel')} status={v_b6e533.location} />
        </View>

        {v_7e21bd}

        {v_5e9bfe && (
          <View style={v_d81136.errorBox} accessibilityLiveRegion="assertive">
            <Text style={v_d81136.errorText}>{v_5e9bfe}</Text>
          </View>
        )}

        {v_683210 ? (
          <View style={v_d81136.loadingRow} accessibilityLiveRegion="polite">
            <ActivityIndicator color={v_1bfbd0.zinc500} />
            <Text style={v_d81136.loadingText}>{v_8d41d7('permissionGate.loading')}</Text>
          </View>
        ) : (
          <View style={v_d81136.actions}>
            {v_5e9bfe ? (
              <Button
                title={v_8d41d7('common.retry')}
                onPress={() => void v_f3f9e8()}
                variant="primary"
                testID="permission-gate-retry"
              />
            ) : (
              v_403b73.canRequest && (
                <Button
                  title={v_8d41d7('permissionGate.requestButton')}
                  onPress={() => void v_0577ff()}
                  variant="primary"
                  disabled={v_9ddd1d}
                  testID="permission-gate-request"
                />
              )
            )}

            {v_403b73.showSettingsHint && (
              <TouchableOpacity
                onPress={v_063c7a}
                style={v_d81136.settingsLink}
                testID="permission-gate-open-settings"
              >
                <Text style={v_d81136.settingsLinkText}>{v_8d41d7('permissionGate.settingsHint')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {}
        <TouchableOpacity
          onPress={() => void v_9b51bc()}
          style={v_d81136.logoutLink}
          testID="permission-gate-logout"
        >
          <Text style={v_d81136.logoutLinkText}>{v_8d41d7('permissionGate.logout')}</Text>
        </TouchableOpacity>
      </View>

      <TermsModal
        visible={v_d39271 !== null}
        type={v_d39271}
        onClose={() => v_fe0d62(null)}
        onAgree={() => {
          if (v_d39271 === 4) v_645639(true);
          else if (v_d39271 === 5) v_d7aae4(true);
          v_fe0d62(null);
        }}
      />
    </SafeView>
  );
}

const v_d81136 = v_472849.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: v_9b1a04.xlarge,
    gap: v_9b1a04.medium,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: v_8b0c90.full ?? 999,
    backgroundColor: v_1bfbd0.zinc900,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: v_9b1a04.small,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: v_1bfbd0.zinc900,
    textAlign: 'center',
  },
  desc: {
    fontSize: 14,
    color: v_1bfbd0.zinc600,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: v_9b1a04.medium,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: v_1bfbd0.white,
    borderRadius: v_8b0c90.lg,
    borderWidth: 1,
    borderColor: v_1bfbd0.border,
    paddingVertical: v_9b1a04.small,
    paddingHorizontal: v_9b1a04.medium,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: v_9b1a04.small,
    gap: v_9b1a04.small,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: v_8b0c90.md,
    backgroundColor: v_1bfbd0.zinc100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: v_1bfbd0.zinc900,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: v_8b0c90.full ?? 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: v_1bfbd0.white,
  },
  divider: {
    height: 1,
    backgroundColor: v_1bfbd0.divider,
  },
  consentCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: v_1bfbd0.white,
    borderRadius: v_8b0c90.lg,
    borderWidth: 1,
    borderColor: v_1bfbd0.border,
    paddingVertical: v_9b1a04.small,
    paddingHorizontal: v_9b1a04.medium,
    gap: v_9b1a04.small,
  },
  consentIntro: {
    fontSize: 13,
    color: v_1bfbd0.zinc600,
    lineHeight: 18,
    paddingVertical: 4,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: v_9b1a04.small,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: v_1bfbd0.zinc400,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: v_1bfbd0.white,
  },
  checkboxChecked: {
    backgroundColor: v_1bfbd0.zinc900,
    borderColor: v_1bfbd0.zinc900,
  },
  termTextWrap: {
    flex: 1,
  },
  termText: {
    fontSize: 13,
    color: v_1bfbd0.zinc700,
    lineHeight: 18,
  },
  termLink: {
    textDecorationLine: 'underline',
  },
  errorBox: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: v_1bfbd0.amber50 ?? '#fffbeb',
    borderRadius: v_8b0c90.md,
    paddingVertical: v_9b1a04.small,
    paddingHorizontal: v_9b1a04.medium,
  },
  errorText: {
    fontSize: 13,
    color: v_1bfbd0.amber800 ?? v_1bfbd0.error,
    lineHeight: 18,
  },
  actions: {
    width: '100%',
    maxWidth: 420,
    marginTop: v_9b1a04.medium,
    gap: v_9b1a04.small,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: v_9b1a04.small,
    marginTop: v_9b1a04.medium,
  },
  loadingText: {
    fontSize: 14,
    color: v_1bfbd0.zinc500,
  },
  settingsLink: {
    alignItems: 'center',
    paddingVertical: v_9b1a04.small,
  },
  settingsLinkText: {
    fontSize: 13,
    color: v_1bfbd0.zinc500,
    textDecorationLine: 'underline',
  },
  logoutLink: {
    marginTop: v_9b1a04.xlarge,
    paddingVertical: v_9b1a04.small,
    paddingHorizontal: v_9b1a04.medium,
  },
  logoutLinkText: {
    fontSize: 13,
    color: v_1bfbd0.zinc400,
    textDecorationLine: 'underline',
  },
});
