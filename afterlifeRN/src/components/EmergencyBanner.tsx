

import { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  AppState,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { API_BASE } from "../config/apiBase";

interface EmergencyNotice {
  id: number;
  title: string;
  description: string | null;
  link: string | null;
  severity_level: number;
}

const SEVERITY_ICON_COLOR: Record<number, string> = {
  1: "#3b82f6", 
  2: "#f59e0b", 
  3: "#ef4444", 
  4: "#dc2626", 
};
const DEFAULT_ICON_COLOR = SEVERITY_ICON_COLOR[2];

const POLL_MS = 60 * 1000;

async function fetchActive(signal: AbortSignal): Promise<EmergencyNotice | null> {
  try {
    const res = await fetch(`${API_BASE}/oth-path`, { signal });
    if (!res.ok) return null;
    const body = (await res.json()) as { notice?: EmergencyNotice | null };
    return body.notice ?? null;
  } catch {

    return null;
  }
}

export default function EmergencyBanner() {
  const { t } = useTranslation();
  const [notice, setNotice] = useState<EmergencyNotice | null>(null);

  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {

    let cancelled = false;
    let ctrl = new AbortController();

    const tick = async () => {
      const n = await fetchActive(ctrl.signal);
      if (!cancelled) setNotice(n);
    };

    void tick();
    const id = setInterval(() => { void tick(); }, POLL_MS);

    const sub = AppState.addEventListener("change", (next) => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      if (prev.match(/inactive|background/) && next === "active") {

        ctrl.abort();
        ctrl = new AbortController();
        void tick();
      }
    });

    return () => {
      cancelled = true;
      ctrl.abort();
      clearInterval(id);
      sub.remove();
    };
  }, []);

  if (!notice) return null;

  const iconColor = SEVERITY_ICON_COLOR[notice.severity_level] ?? DEFAULT_ICON_COLOR;

  const handleLinkPress = () => {
    if (!notice.link) return;

    if (notice.link.startsWith("http://") || notice.link.startsWith("https://")) {
      Linking.openURL(notice.link).catch((err) => {
        console.error("[EmergencyBanner] failed to open URL:", err);
      });
    } else {
      console.warn("[EmergencyBanner] non-http link ignored:", notice.link);
    }
  };

  return (
    <Modal
      visible
      animationType="slide"

      onRequestClose={() => {  }}
      presentationStyle="fullScreen"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {t("common.emergencyStop.title", { defaultValue: "긴급 공지" })}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.body}>
          <View style={styles.iconContainer}>
            <Ionicons name="warning" size={64} color={iconColor} />
          </View>
          <Text style={styles.headline}>{notice.title}</Text>
          {notice.description ? (
            <Text style={styles.message}>{notice.description}</Text>
          ) : null}
          {notice.link ? (
            <TouchableOpacity
              style={styles.linkButton}
              onPress={handleLinkPress}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>
                {t("common.emergencyStop.viewDetails", { defaultValue: "자세히 보기" })}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#4c4e55" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: "700",
    color: "#121212",
    textAlign: "center",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#e4e4e4",
    marginBottom: 32,
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  iconContainer: {
    marginBottom: 32,
  },
  headline: {
    fontSize: 18,
    fontWeight: "700",
    color: "#121212",
    lineHeight: 26,
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: "#4c4e55",
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 32,
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    width: "100%",
    maxWidth: 400,
  },
  linkText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#4c4e55",
  },
});
