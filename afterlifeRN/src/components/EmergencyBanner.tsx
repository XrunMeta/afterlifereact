

import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_BASE } from "../config/apiBase";
import { useAuthStore } from "../stores/authStore";

interface EmergencyNotice {
  id: number;
  title: string;
  description: string | null;
  link: string | null;
  severity_level: number;
}

const SEVERITY_BG: Record<number, string> = {
  1: "#3b82f6", 
  2: "#f59e0b", 
  3: "#ef4444", 
  4: "#dc2626", 
};
const DEFAULT_BG = SEVERITY_BG[2];

const POLL_MS = 5 * 60 * 1000; 

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
  const insets = useSafeAreaInsets();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [notice, setNotice] = useState<EmergencyNotice | null>(null);

  useEffect(() => {

    if (!isLoggedIn) {
      setNotice(null);
      return;
    }
    let cancelled = false;
    const ctrl = new AbortController();

    const tick = async () => {
      const n = await fetchActive(ctrl.signal);
      if (!cancelled) setNotice(n);
    };

    void tick();
    const id = setInterval(() => { void tick(); }, POLL_MS);

    return () => {
      cancelled = true;
      ctrl.abort();
      clearInterval(id);
    };
  }, [isLoggedIn]);

  if (!isLoggedIn || !notice) return null;

  const bg = SEVERITY_BG[notice.severity_level] ?? DEFAULT_BG;

  const handlePress = () => {
    if (!notice.link) return;
    void Linking.openURL(notice.link).catch(() => {

    });
  };

  const inner = (
    <View style={styles.inner}>
      <Text style={styles.title} numberOfLines={2}>
        {notice.title}
      </Text>
      {notice.description ? (
        <Text style={styles.description} numberOfLines={3}>
          {notice.description}
        </Text>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: bg }]}>
      {notice.link ? (
        <TouchableOpacity activeOpacity={0.8} onPress={handlePress}>
          {inner}
        </TouchableOpacity>
      ) : (
        inner
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  inner: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  title: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  description: {
    color: "#ffffff",
    fontSize: 12,
    marginTop: 2,
    opacity: 0.95,
  },
});
