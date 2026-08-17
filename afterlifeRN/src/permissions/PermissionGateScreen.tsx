

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import SafeView from '../components/ui/SafeView';
import Button from '../components/ui/Button';
import { COLORS, SIZES, RADIUS } from '../components/constants';
import { useAuthStore } from '../stores/authStore';
import { usePermissionGate } from './usePermissionGate';
import type { PermStatus } from './permissionGate';
import { TID } from '../testIDs';

function statusLabel(t: (k: string) => string, status: PermStatus): string {
  switch (status) {
    case 'granted':
      return t('permissionGate.statusGranted');
    case 'blocked':
      return t('permissionGate.statusBlocked');
    case 'denied':
      return t('permissionGate.statusDenied');
    case 'undetermined':
    default:
      return t('permissionGate.statusUndetermined');
  }
}

function statusColor(status: PermStatus): string {
  switch (status) {
    case 'granted':
      return COLORS.success;
    case 'blocked':
    case 'denied':
      return COLORS.error;
    case 'undetermined':
    default:
      return COLORS.zinc400;
  }
}

function PermRow({ icon, label, status }: { icon: 'camera' | 'mic'; label: string; status: PermStatus }) {
  const { t } = useTranslation();
  return (
    <View style={styles.row} accessibilityRole="text" accessibilityLabel={`${label}: ${statusLabel(t, status)}`}>
      <View style={styles.rowIcon}>
        <Feather name={icon} size={20} color={COLORS.zinc700} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={[styles.badge, { backgroundColor: statusColor(status) }]}>
        <Text style={styles.badgeText}>{statusLabel(t, status)}</Text>
      </View>
    </View>
  );
}

export default function PermissionGateScreen() {
  const { t } = useTranslation();
  const { state, decision, loading, error, request, openSettings, recheck } = usePermissionGate();
  const apiLogout = useAuthStore((s) => s.apiLogout);

  return (
    <SafeView backgroundColor={COLORS.zinc50}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Feather name="video" size={36} color={COLORS.white} />
        </View>
        <Text style={styles.title}>{t('permissionGate.title')}</Text>
        <Text style={styles.desc}>{t('permissionGate.desc')}</Text>

        <View style={styles.card}>
          <PermRow icon="camera" label={t('permissionGate.cameraLabel')} status={state.camera} />
          <View style={styles.divider} />
          <PermRow icon="mic" label={t('permissionGate.micLabel')} status={state.mic} />
        </View>

        {error && (
          <View style={styles.errorBox} accessibilityLiveRegion="assertive">
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingRow} accessibilityLiveRegion="polite">
            <ActivityIndicator color={COLORS.zinc500} />
            <Text style={styles.loadingText}>{t('permissionGate.loading')}</Text>
          </View>
        ) : (
          <View style={styles.actions}>
            {error ? (
              <Button
                title={t('common.retry')}
                onPress={() => void recheck()}
                variant="primary"
                testID={TID.permissionGate.retry}
              />
            ) : (
              decision.canRequest && (
                <Button
                  title={t('permissionGate.requestButton')}
                  onPress={() => void request()}
                  variant="primary"
                  testID={TID.permissionGate.request}
                />
              )
            )}

            {decision.showSettingsHint && (
              <TouchableOpacity
                onPress={openSettings}
                style={styles.settingsLink}
                testID={TID.permissionGate.openSettings}
              >
                <Text style={styles.settingsLinkText}>{t('permissionGate.settingsHint')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {}
        <TouchableOpacity
          onPress={() => void apiLogout()}
          style={styles.logoutLink}
          testID={TID.permissionGate.logout}
        >
          <Text style={styles.logoutLinkText}>{t('permissionGate.logout')}</Text>
        </TouchableOpacity>
      </View>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.xlarge,
    gap: SIZES.medium,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.full ?? 999,
    backgroundColor: COLORS.zinc900,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.small,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.zinc900,
    textAlign: 'center',
  },
  desc: {
    fontSize: 14,
    color: COLORS.zinc600,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SIZES.medium,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SIZES.small,
    paddingHorizontal: SIZES.medium,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.small,
    gap: SIZES.small,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.zinc100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.zinc900,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full ?? 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
  },
  errorBox: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.amber50 ?? '#fffbeb',
    borderRadius: RADIUS.md,
    paddingVertical: SIZES.small,
    paddingHorizontal: SIZES.medium,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.amber800 ?? COLORS.error,
    lineHeight: 18,
  },
  actions: {
    width: '100%',
    maxWidth: 420,
    marginTop: SIZES.medium,
    gap: SIZES.small,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.small,
    marginTop: SIZES.medium,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.zinc500,
  },
  settingsLink: {
    alignItems: 'center',
    paddingVertical: SIZES.small,
  },
  settingsLinkText: {
    fontSize: 13,
    color: COLORS.zinc500,
    textDecorationLine: 'underline',
  },
  logoutLink: {
    marginTop: SIZES.xlarge,
    paddingVertical: SIZES.small,
    paddingHorizontal: SIZES.medium,
  },
  logoutLinkText: {
    fontSize: 13,
    color: COLORS.zinc400,
    textDecorationLine: 'underline',
  },
});
