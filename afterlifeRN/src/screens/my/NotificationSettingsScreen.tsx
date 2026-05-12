

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import SafeScrollView from "../../components/ui/SafeScrollView";
import PageHeader from "../../components/common/PageHeader";
import { COLORS, RADIUS } from "../../components/constants";
import {
  getCurrentPushStatus,
  requestPushPermission,
} from "../../lib/pushNotifications";

export default function NotificationSettingsScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [granted, setGranted] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCurrentPushStatus();
      setGranted(res.granted);
    } catch (err) {
      console.warn("[notifications] status failed:", err);
      setGranted(false);
    } finally {
      setLoading(false);
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

  const handleToggle = async (next: boolean) => {
    if (next) {

      try {
        const reg = await requestPushPermission();
        if (reg.granted) {
          setGranted(true);
        } else {
          Alert.alert(
            t("settings.notifications.permTitle", { defaultValue: "권한 필요" }),
            t("settings.notifications.deniedHint", {
              defaultValue:
                "OS 설정에서 알림을 허용해주세요.",
            }),
            [
              { text: t("common.cancel", { defaultValue: "취소" }), style: "cancel" },
              {
                text: t("settings.notifications.openSettings", {
                  defaultValue: "설정 열기",
                }),
                onPress: () => Linking.openSettings(),
              },
            ],
          );
        }
      } catch (err) {
        console.warn("[notifications] toggle on failed:", err);
      }
    } else {

      Alert.alert(
        t("settings.notifications.offTitle", { defaultValue: "알림 끄기" }),
        t("settings.notifications.offHint", {
          defaultValue: "알림을 끄려면 OS 설정에서 변경해주세요.",
        }),
        [
          { text: t("common.cancel", { defaultValue: "취소" }), style: "cancel" },
          {
            text: t("settings.notifications.openSettings", {
              defaultValue: "설정 열기",
            }),
            onPress: () => Linking.openSettings(),
          },
        ],
      );
    }
  };

  return (
    <SafeScrollView backgroundColor={COLORS.white} showBottomBackground={false}>
      <PageHeader
        title={t("settings.notifications.title", { defaultValue: "알림" })}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <View style={s.content}>
        <View style={s.row}>
          <Text style={s.rowLabel}>
            {t("settings.notifications.alarm", { defaultValue: "알람" })}
          </Text>
          {loading ? (
            <ActivityIndicator color={COLORS.zinc500} />
          ) : (
            <Switch
              value={granted}
              onValueChange={handleToggle}
              trackColor={{ false: COLORS.zinc200, true: COLORS.violet600 }}
              thumbColor={COLORS.white}
            />
          )}
        </View>
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    borderRadius: RADIUS.lg,
  },
  rowLabel: { fontSize: 15, fontWeight: "500", color: COLORS.zinc900 },
});
