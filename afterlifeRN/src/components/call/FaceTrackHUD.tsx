

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
} from "../../face/faceTrackRoster";

const TICK_MS = 500;

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

  const diagLine =
    d == null
      ? "diag -"
      : `diag ${d.score.toFixed(2)} ${d.verdict} ${d.streak}/3 thr:${d.threshold}`;

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Text style={styles.badge}>DEV ONLY</Text>
      <Text style={styles.title}>{`face/track ${activeCount}/${roster.entries.length}`}</Text>
      <Text style={styles.diag} numberOfLines={1}>{diagLine}</Text>
      <View style={styles.sep} />
      {roster.entries.length === 0 ? (
        <Text style={styles.idle}>no face yet</Text>
      ) : null}
      {roster.entries.map((e) => {
        const active = isTrackActive(e, now);
        return (
          <Text
            key={e.trackingId}
            numberOfLines={1}
            style={[styles.line, active ? styles.active : styles.inactive]}
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

    position: "absolute", top: "55%", right: 6, zIndex: 32,
    backgroundColor: "rgba(0,0,0,0.78)",
    borderWidth: 1, borderColor: "#f472b6",
    borderRadius: 2, paddingHorizontal: 5, paddingVertical: 4, width: 178,
  },
  badge: {
    color: "#000", backgroundColor: "#f472b6", fontSize: 8, fontWeight: "700",
    fontFamily: MONO, paddingHorizontal: 3, alignSelf: "flex-start", marginBottom: 2,
  },
  title: { color: "#f472b6", fontSize: 9, fontFamily: MONO, marginBottom: 1 },
  diag: { color: "#fbbf24", fontSize: 9, fontFamily: MONO, lineHeight: 12 },
  sep: { height: 1, backgroundColor: "#f472b6", opacity: 0.5, marginVertical: 3 },
  idle: { color: "#9ca3af", fontSize: 9, fontFamily: MONO, lineHeight: 12 },
  line: { fontSize: 9, fontFamily: MONO, lineHeight: 12 },
  active: { color: "#7CFC00" },    
  inactive: { color: "#6b7280" },  
});
