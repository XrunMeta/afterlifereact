

import { useEffect, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "../stores/authStore";
import { showAlert } from "../stores/dialogStore";
import { getMyReportsReceived } from "../api/reports";

const SEEN_KEY = "afterlife.reports.received.lastSeenReviewedAt";

export function useReportAcceptedGate() {
  const navigation = useNavigation<any>();
  const accessToken = useAuthStore((s) => s.accessToken);

  const ranRef = useRef(false);

  useEffect(() => {
    if (!accessToken || ranRef.current) return;
    ranRef.current = true;

    (async () => {
      try {
        const res = await getMyReportsReceived(accessToken);

        const reviewedAts = res.items
          .map((it) => it.reviewedAt)
          .filter((v): v is string => !!v)
          .sort();
        const latest = reviewedAts[reviewedAts.length - 1];
        if (!latest) return;

        const lastSeen = await AsyncStorage.getItem(SEEN_KEY);

        if (lastSeen && latest <= lastSeen) return;

        await AsyncStorage.setItem(SEEN_KEY, latest);
        showAlert("신고를 받았습니다", "신고 내용을 확인해주세요.", [
          {
            text: "확인",
            onPress: () => {
              navigation.navigate("MyTab", {
                screen: "Reports",
                params: { tab: "received" },
              });
            },
          },
        ]);
      } catch {

      }
    })();
  }, [accessToken, navigation]);
}
