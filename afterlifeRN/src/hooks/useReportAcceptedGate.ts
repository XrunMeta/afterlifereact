

import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "../stores/authStore";
import { showAlert } from "../stores/dialogStore";
import { getMyReportsReceived } from "../api/reports";

const SEEN_KEY = "afterlife.reports.received.lastSeenReviewedAt";

let checkedForAccessToken: string | null = null;

function toEpochMs(value: string): number {
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? ts : NaN;
}

export function useReportAcceptedGate() {
  const navigation = useNavigation<any>();
  const accessToken = useAuthStore((s) => s.accessToken);
  const { t } = useTranslation();

  useEffect(() => {
    if (!accessToken || checkedForAccessToken === accessToken) return;
    checkedForAccessToken = accessToken;

    (async () => {
      try {
        const res = await getMyReportsReceived(accessToken);

        let latestRaw: string | null = null;
        let latestTs = -Infinity;
        for (const it of res.items) {
          if (!it.reviewedAt) continue;
          const ts = toEpochMs(it.reviewedAt);
          if (!Number.isFinite(ts)) continue; 
          if (ts > latestTs) {
            latestTs = ts;
            latestRaw = it.reviewedAt;
          }
        }
        if (latestRaw === null) return;

        const lastSeenRaw = await AsyncStorage.getItem(SEEN_KEY);
        const lastSeenTs = lastSeenRaw ? toEpochMs(lastSeenRaw) : NaN;

        if (Number.isFinite(lastSeenTs) && latestTs <= lastSeenTs) return;

        try {
          await AsyncStorage.setItem(SEEN_KEY, latestRaw);
        } catch (e) {

          console.warn("[useReportAcceptedGate] failed to persist lastSeenReviewedAt", e);
        }

        showAlert(
          t("reports.acceptedAlertTitle", { defaultValue: "신고를 받았습니다" }),
          t("reports.acceptedAlertDesc", { defaultValue: "신고 내용을 확인해주세요." }),
          [
            {
              text: t("common.ok", { defaultValue: "확인" }),
              onPress: () => {
                navigation.navigate("MyTab", {
                  screen: "Reports",
                  params: { tab: "received" },
                });
              },
            },
          ],
        );
      } catch {

        if (checkedForAccessToken === accessToken) {
          checkedForAccessToken = null;
        }
      }
    })();
  }, [accessToken, navigation, t]);
}

export function __resetReportAcceptedGateForTests(): void {
  checkedForAccessToken = null;
}
