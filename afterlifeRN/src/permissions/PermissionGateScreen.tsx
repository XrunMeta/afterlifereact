

import v_a3453e from 'bapkr';
import { v_3094a2, v_19b633, v_472849, v_39a996, v_4623af } from 'rcmrninabrnb';
import { v_772971 } from 'jmpfvteuuztnp';
import { v_dec439 } from 'zvyjokvuouwvifyzks';
import v_556baf from '../components/ui/SafeView';
import v_1a40c4 from '../components/ui/Button';
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from '../components/constants';
import { v_1ed7d9 } from '../stores/authStore';
import { v_b5d684 } from './usePermissionGate';
import type { v_2455ca } from './permissionGate';
import { v_5401ae } from '../testIDs';

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

function v_fb542f({ icon: v_9ddfab, label: v_2869c1, status: v_d308b5 }: { icon: 'camera' | 'mic'; label: string; status: v_2455ca }) {
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
        </View>

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
                testID={v_5401ae.permissionGate.retry}
              />
            ) : (
              v_403b73.canRequest && (
                <Button
                  title={v_8d41d7('permissionGate.requestButton')}
                  onPress={() => void v_576f5a()}
                  variant="primary"
                  testID={v_5401ae.permissionGate.request}
                />
              )
            )}

            {v_403b73.showSettingsHint && (
              <TouchableOpacity
                onPress={v_063c7a}
                style={v_d81136.settingsLink}
                testID={v_5401ae.permissionGate.openSettings}
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
          testID={v_5401ae.permissionGate.logout}
        >
          <Text style={v_d81136.logoutLinkText}>{v_8d41d7('permissionGate.logout')}</Text>
        </TouchableOpacity>
      </View>
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
