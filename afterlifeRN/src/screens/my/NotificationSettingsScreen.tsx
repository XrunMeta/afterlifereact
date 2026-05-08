import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import * as Clipboard from "expo-clipboard";
import { Feather } from "@expo/vector-icons";
import SafeScrollView from "../../components/ui/SafeScrollView";
import PageHeader from "../../components/common/PageHeader";
import { COLORS, RADIUS } from "../../components/constants";
import { getCurrentPushStatus } from "../../lib/pushNotifications";

interface PushState {
  granted: boolean;
  token: string | null;
  supported: boolean; 
  loading: boolean;
}

export default function NotificationSettingsScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [state, setState] = useState<PushState>({
    granted: false,
    token: null,
    supported: true,
    loading: true,
  });

  const refresh = React.useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const res = await getCurrentPushStatus();
      console.log("[PUSH-STATUS]", res);

      setState({
        granted: res.granted,
        token: res.token,
        supported: true,
        loading: false,
      });
    } catch (err) {
      console.warn("[PUSH-STATUS] failed:", err);
      setState({ granted: false, token: null, supported: true, loading: false });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const handleOpenSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (err) {
      console.warn("[PUSH-STATUS] openSettings failed:", err);
    }
  };

  const handleCopyToken = async () => {
    if (!state.token) return;
    try {
      await Clipboard.setStringAsync(state.token);
      Alert.alert("알림", t("settings.notifications.copied"));
    } catch (err) {
      console.warn("[PUSH-STATUS] copy failed:", err);
    }
  };

  return (
    <SafeScrollView backgroundColor={COLORS.white} showBottomBackground={false}>
      <PageHeader
        title={t("settings.notifications.title")}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <View style={s.content}>
        {}
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.rowLabel}>{t("settings.notifications.push")}</Text>
            {state.loading ? (
              <ActivityIndicator color={COLORS.zinc500} />
            ) : (
              <View
                style={[
                  s.badge,
                  state.granted ? s.badgeGranted : s.badgeDenied,
                ]}
              >
                <Feather
                  name={state.granted ? "check-circle" : "x-circle"}
                  size={14}
                  color={state.granted ? COLORS.success : COLORS.error}
                />
                <Text
                  style={[
                    s.badgeText,
                    state.granted ? s.badgeTextGranted : s.badgeTextDenied,
                  ]}
                >
                  {state.granted
                    ? t("settings.notifications.statusGranted")
                    : t("settings.notifications.statusDenied")}
                </Text>
              </View>
            )}
          </View>

          {!state.loading && !state.granted && (
            <>
              <View style={s.divider} />
              <View style={s.deniedSection}>
                <Text style={s.deniedHint}>
                  {t("settings.notifications.deniedHint")}
                </Text>
                <TouchableOpacity style={s.openBtn} onPress={handleOpenSettings}>
                  <Feather name="external-link" size={14} color={COLORS.white} />
                  <Text style={s.openBtnText}>
                    {t("settings.notifications.openSettings")}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {}
        {state.granted && (
          <View style={[s.card, { marginTop: 16 }]}>
            <View style={s.tokenSection}>
              <Text style={s.tokenLabel}>
                {t("settings.notifications.tokenLabel")}
              </Text>
              {state.loading ? (
                <Text style={s.tokenValueMuted}>
                  {t("settings.notifications.tokenLoading")}
                </Text>
              ) : state.token ? (
                <>
                  <Text style={s.tokenValue} selectable>
                    {state.token}
                  </Text>
                  <TouchableOpacity style={s.copyBtn} onPress={handleCopyToken}>
                    <Feather name="copy" size={14} color={COLORS.zinc700} />
                    <Text style={s.copyBtnText}>
                      {t("settings.notifications.copyToken")}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={s.tokenValueMuted}>
                  {t("settings.notifications.tokenNone")}
                </Text>
              )}
            </View>
          </View>
        )}
      </View>
    </SafeScrollView>
  );
}

const s = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    maxWidth: 780,
    alignSelf: "center",
    width: "100%",
  },
  card: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  rowLabel: { fontSize: 15, fontWeight: "500", color: COLORS.zinc900 },
  divider: { height: 1, backgroundColor: COLORS.zinc100, marginLeft: 20 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full ?? 999,
    borderWidth: 1,
  },
  badgeGranted: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  badgeDenied: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  badgeText: { fontSize: 12, fontWeight: "600" },
  badgeTextGranted: { color: COLORS.success },
  badgeTextDenied: { color: COLORS.error },
  deniedSection: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
  },
  deniedHint: {
    fontSize: 13,
    color: COLORS.zinc600,
    lineHeight: 18,
  },
  openBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.zinc900,
  },
  openBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.white,
  },
  tokenSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
  },
  tokenLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.zinc500,
  },
  tokenValue: {
    fontSize: 12,
    color: COLORS.zinc900,
    fontFamily: "monospace",
    lineHeight: 18,
  },
  tokenValueMuted: {
    fontSize: 13,
    color: COLORS.zinc400,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.zinc100,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.zinc700,
  },
});
