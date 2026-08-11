

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  subscribeFaceRoster,
  getFaceRoster,
} from "../../face/faceTrackRosterStore";
import {
  formatTrackLine,
  isTrackActive,
  type FaceRosterState,
  type FaceTrackMatch,
} from "../../face/faceTrackRoster";
import type { FaceVerdict } from "../../config/faceDiag";

const TICK_MS = 500;

const MAX_VISIBLE_LINES = 4;

function verdictColor(v: FaceVerdict | null): string {
  switch (v) {
    case "confirmed":
      return "#7CFC00";
    case "candidate":
      return "#fbbf24";
    case "unknown":
      return "#f87171";
    default:
      return "#9ca3af";
  }
}

function shortVerdict(v: FaceVerdict | null): string {
  return v == null ? "none" : v.slice(0, 4);
}

export function pickPrimaryIdentity(
  roster: FaceRosterState,
  nowMs: number,
): FaceTrackMatch | null {
  let best: { match: FaceTrackMatch; lastSeenMs: number } | null = null;
  for (const e of roster.entries) {
    if (!isTrackActive(e, nowMs) || e.match == null) continue;
    if (best == null || e.lastSeenMs > best.lastSeenMs) {
      best = { match: e.match, lastSeenMs: e.lastSeenMs };
    }
  }
  if (best) return best.match;
  const d = roster.lastDiag;
  if (d == null) return null;
  return {
    personId: d.personId,
    displayName: d.displayName,
    score: d.score,
    verdict: d.verdict,
    streak: d.streak,
  };
}

export function primaryWhoLabel(match: FaceTrackMatch | null): string {
  if (match == null) return "미인식";
  if (match.displayName) return match.displayName;
  if (match.personId != null) return `#${match.personId}`;
  return "미인식";
}

export const FaceTrackHUD: React.FC = () => {
  const [roster, setRoster] = useState<FaceRosterState>(getFaceRoster);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => subscribeFaceRoster(setRoster), []);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const activeCount = roster.entries.filter((e) => isTrackActive(e, now)).length;
  const d = roster.lastDiag;
  const primary = pickPrimaryIdentity(roster, now);
  const who = primaryWhoLabel(primary);
  const color = verdictColor(primary?.verdict ?? null);

  const diagLine =
    d == null
      ? "diag -"
      : `diag ${d.score.toFixed(2)} ${d.verdict} ${d.streak}/3 thr:${d.threshold}`;

  const lines = roster.entries.slice(-MAX_VISIBLE_LINES);

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Text style={styles.badge}>DEV · 얼굴</Text>

      {}
      <Text style={[styles.who, { color }]} numberOfLines={1}>
        {who}
      </Text>
      <View style={styles.verdictRow}>
        <Text style={[styles.verdictChip, { backgroundColor: color }]}>
          {shortVerdict(primary?.verdict ?? null)}
        </Text>
        <Text style={styles.verdictMeta} numberOfLines={1}>
          {primary
            ? `${primary.score.toFixed(2)} · ${primary.streak}/3`
            : "판정 없음"}
        </Text>
      </View>

      <View style={styles.sep} />

      {}
      <Text style={styles.small} numberOfLines={1}>
        {`track ${activeCount}/${roster.entries.length}`}
      </Text>
      <Text style={styles.smallDiag} numberOfLines={1}>
        {diagLine}
      </Text>
      {roster.entries.length === 0 ? (
        <Text style={styles.idle}>no face yet</Text>
      ) : null}
      {lines.map((e) => {
        const active = isTrackActive(e, now);
        return (
          <Text
            key={e.trackingId}
            numberOfLines={1}
            style={[styles.small, active ? styles.active : styles.inactive]}
          >
            {formatTrackLine(e, active)}
          </Text>
        );
      })}
    </View>
  );
};

const MONO = "monospace";
const styles = StyleSheet.create({
  wrap: {

    position: "absolute", top: "36%", right: 6, zIndex: 32,
    backgroundColor: "rgba(0,0,0,0.82)",
    borderWidth: 1, borderColor: "#f472b6",
    borderRadius: 4, paddingHorizontal: 7, paddingVertical: 5, width: 202,
  },
  badge: {
    color: "#000", backgroundColor: "#f472b6", fontSize: 9, fontWeight: "700",
    fontFamily: MONO, paddingHorizontal: 4, alignSelf: "flex-start", marginBottom: 3,
  },

  who: { fontSize: 22, fontWeight: "800", lineHeight: 26 },
  verdictRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  verdictChip: {
    color: "#000", fontSize: 12, fontWeight: "800", fontFamily: MONO,
    paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3, overflow: "hidden",
  },
  verdictMeta: { color: "#e5e7eb", fontSize: 13, fontFamily: MONO, flexShrink: 1 },
  sep: { height: 1, backgroundColor: "#f472b6", opacity: 0.5, marginVertical: 4 },

  small: { fontSize: 10, fontFamily: MONO, lineHeight: 13, color: "#d1d5db" },
  smallDiag: { color: "#fbbf24", fontSize: 10, fontFamily: MONO, lineHeight: 13 },
  idle: { color: "#9ca3af", fontSize: 10, fontFamily: MONO, lineHeight: 13 },
  active: { color: "#7CFC00" },    
  inactive: { color: "#6b7280" },  
});
