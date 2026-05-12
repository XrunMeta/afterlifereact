

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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import SafeScrollView from "../../components/ui/SafeScrollView";
import PageHeader from "../../components/common/PageHeader";
import { COLORS, RADIUS } from "../../components/constants";
import {
  getCurrentPushStatus,
  requestPushPermission,
} from "../../lib/pushNotifications";

type PrefKey =
  | "newFollower"
  | "followingActivity"
  | "reactions"
  | "chat"
  | "promotions";

const PREF_STORAGE_PREFIX = "@notif_pref:";

const PREF_ITEMS: Array<{
  key: PrefKey;
  label: string;
  desc: string;
}> = [
  {
    key: "newFollower",
    label: "새로운 팔로워",
    desc: "나를 팔로우 하는 멤버 안내",
  },
  {
    key: "followingActivity",
    label: "팔로잉하는 멤버 소식",
    desc: "팔로잉 멤버의 새로운 활동 안내",
  },
  {
    key: "reactions",
    label: "반응",
    desc: "좋아요 댓글",
  },
  {
    key: "chat",
    label: "채팅",
    desc: "새로운 메시지",
  },
  {
    key: "promotions",
    label: "혜택정보 수신",
    desc: "개인 맞춤 혜택과 이벤트 소식을 앱 푸시, 문자로 안내",
  },
];

export default function NotificationSettingsScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [granted, setGranted] = useState(false);
  const [loading, setLoading] = useState(true);

  const [prefs, setPrefs] = useState<Record<PrefKey, boolean>>({
    newFollower: true,
    followingActivity: true,
    reactions: true,
    chat: true,
    promotions: true,
  });
  const [prefsLoaded, setPrefsLoaded] = useState(false);

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
    (async () => {
      try {
        const entries = await Promise.all(
          PREF_ITEMS.map(async (it) => {
            const v = await AsyncStorage.getItem(PREF_STORAGE_PREFIX + it.key);
            return [it.key, v === null ? true : v === "1"] as const;
          }),
        );
        const next: Record<PrefKey, boolean> = { ...prefs };
        for (const [k, v] of entries) next[k] = v;
        setPrefs(next);
      } catch (err) {
        console.warn("[notifications] load prefs failed:", err);
      } finally {
        setPrefsLoaded(true);
      }
    })();

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

  const togglePref = async (key: PrefKey, next: boolean) => {
    setPrefs((p) => ({ ...p, [key]: next }));
    try {
      await AsyncStorage.setItem(PREF_STORAGE_PREFIX + key, next ? "1" : "0");
    } catch (err) {
      console.warn("[notifications] save pref failed:", err);
    }
  };

  const subDisabled = !granted;

  return (
    <SafeScrollView backgroundColor={COLORS.white} showBottomBackground={false}>
      <PageHeader
        title={t("settings.notifications.title", { defaultValue: "알림" })}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <View style={s.content}>
        {}
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

        {}
        <View style={s.subCard}>
          {PREF_ITEMS.map((it, i) => (
            <View
              key={it.key}
              style={[s.subRow, i < PREF_ITEMS.length - 1 && s.subRowBorder]}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={[s.subLabel, subDisabled && s.subTextDim]}>
                  {it.label}
                </Text>
                <Text style={[s.subDesc, subDisabled && s.subTextDim]}>
                  {it.desc}
                </Text>
              </View>
              <Switch
                value={prefs[it.key] && granted}
                onValueChange={(v) => togglePref(it.key, v)}
                disabled={!prefsLoaded || subDisabled}
                trackColor={{ false: COLORS.zinc200, true: COLORS.violet600 }}
                thumbColor={COLORS.white}
              />
            </View>
          ))}
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

  subCard: {
    marginTop: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  subRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  subLabel: { fontSize: 15, fontWeight: "500", color: COLORS.zinc900 },
  subDesc: { fontSize: 12, color: COLORS.zinc500, marginTop: 4 },
  subTextDim: { color: COLORS.zinc400 },
});
