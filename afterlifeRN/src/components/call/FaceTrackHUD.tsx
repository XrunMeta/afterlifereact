

import v_a3453e, { v_c4deb2, v_5ab095 } from "bapkr";
import { v_3094a2, v_19b633, v_472849 } from "rcmrninabrnb";
import {
  v_60d2d9,
  v_8d4e3c,
} from "../../face/faceTrackRosterStore";
import {
  v_204d2e,
  v_772beb,
  type v_2f9753,
  type v_d8add2,
} from "../../face/faceTrackRoster";
import type { v_71bfaa } from "../../config/faceDiag";

const v_53a12a = 500;

const v_8c37fb = 4;

function v_973801(v: v_71bfaa | null): string {
  switch (v_81e2ef) {
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

function v_8eb7ca(v: v_71bfaa | null): string {
  return v_81e2ef == null ? "none" : v_81e2ef.slice(0, 4);
}

export function v_5bbe11(
  roster: v_2f9753,
  v_67e77e,
): v_d8add2 | null {
  let best: { match: v_d8add2; lastSeenMs: number } | null = null;
  for (const v_9e86fd of v_3e6465.entries) {
    if (!v_772beb(v_9e86fd, v_67e77e) || v_9e86fd.match == null) continue;
    if (v_643757 == null || v_9e86fd.lastSeenMs > v_643757.lastSeenMs) {
      v_643757 = { match: v_9e86fd.match, lastSeenMs: v_9e86fd.lastSeenMs };
    }
  }
  if (v_643757) return v_643757.match;
  const v_d5dda0 = v_3e6465.lastDiag;
  if (v_d5dda0 == null) return null;
  return {
    personId: v_d5dda0.personId,
    displayName: v_d5dda0.displayName,
    score: v_d5dda0.score,
    verdict: v_d5dda0.verdict,
    streak: v_d5dda0.streak,
  };
}

export function v_56cb5e(match: v_d8add2 | null): string {
  if (v_a63110 == null) return "미인식";
  if (v_a63110.displayName) return v_a63110.displayName;
  if (v_a63110.personId != null) return `#${v_a63110.personId}`;
  return "미인식";
}

export const FaceTrackHUD: v_a3453e.FC = () => {
  const [v_3e6465, v_f6eb56] = v_5ab095<v_2f9753>(v_8d4e3c);
  const [v_5c2f9f, v_fb01d7] = v_5ab095(() => Date.now());

  v_c4deb2(() => v_60d2d9(v_f6eb56), []);
  v_c4deb2(() => {
    const v_389afb = setInterval(() => v_fb01d7(Date.now()), v_53a12a);
    return () => clearInterval(v_389afb);
  }, []);

  const v_2ba0d1 = v_3e6465.entries.filter((v_9e86fd) => v_772beb(v_9e86fd, v_5c2f9f)).length;
  const v_d5dda0 = v_3e6465.lastDiag;
  const v_127e92 = v_5bbe11(v_3e6465, v_5c2f9f);
  const v_97d2e9 = v_56cb5e(v_127e92);
  const v_3c2a3a = v_973801(v_127e92?.verdict ?? null);

  const v_76d5cb =
    v_d5dda0 == null
      ? "diag -"
      : `diag ${v_d5dda0.score.toFixed(2)} ${v_d5dda0.verdict} ${v_d5dda0.streak}/3 thr:${v_d5dda0.threshold}`;

  const v_a52412 = v_3e6465.entries.slice(-v_8c37fb);

  return (
    <View style={v_d81136.wrap} pointerEvents="none">
      <Text style={v_d81136.badge}>DEV · 얼굴</Text>

      {}
      <Text style={[v_d81136.who, { color: v_3c2a3a }]} numberOfLines={1}>
        {v_97d2e9}
      </Text>
      <View style={v_d81136.verdictRow}>
        <Text style={[v_d81136.verdictChip, { backgroundColor: v_3c2a3a }]}>
          {v_8eb7ca(v_127e92?.verdict ?? null)}
        </Text>
        <Text style={v_d81136.verdictMeta} numberOfLines={1}>
          {v_127e92
            ? `${v_127e92.score.toFixed(2)} · ${v_127e92.streak}/3`
            : "판정 없음"}
        </Text>
      </View>

      <View style={v_d81136.sep} />

      {}
      <Text style={v_d81136.small} numberOfLines={1}>
        {`track ${v_2ba0d1}/${v_3e6465.entries.length}`}
      </Text>
      <Text style={v_d81136.smallDiag} numberOfLines={1}>
        {v_76d5cb}
      </Text>
      {v_3e6465.entries.length === 0 ? (
        <Text style={v_d81136.idle}>no face yet</Text>
      ) : null}
      {v_a52412.map((v_9e86fd) => {
        const v_f8b770 = v_772beb(v_9e86fd, v_5c2f9f);
        return (
          <Text
            key={v_9e86fd.trackingId}
            numberOfLines={1}
            style={[v_d81136.small, v_f8b770 ? v_d81136.active : v_d81136.inactive]}
          >
            {v_204d2e(v_9e86fd, v_f8b770)}
          </Text>
        );
      })}
    </View>
  );
};

const v_671f54 = "monospace";
const v_d81136 = v_472849.create({
  wrap: {

    position: "absolute", top: "36%", right: 6, zIndex: 32,
    backgroundColor: "rgba(0,0,0,0.82)",
    borderWidth: 1, borderColor: "#f472b6",
    borderRadius: 4, paddingHorizontal: 7, paddingVertical: 5, width: 202,
  },
  badge: {
    color: "#000", backgroundColor: "#f472b6", fontSize: 9, fontWeight: "700",
    fontFamily: v_671f54, paddingHorizontal: 4, alignSelf: "flex-start", marginBottom: 3,
  },

  who: { fontSize: 22, fontWeight: "800", lineHeight: 26 },
  verdictRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  verdictChip: {
    color: "#000", fontSize: 12, fontWeight: "800", fontFamily: v_671f54,
    paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3, overflow: "hidden",
  },
  verdictMeta: { color: "#e5e7eb", fontSize: 13, fontFamily: v_671f54, flexShrink: 1 },
  sep: { height: 1, backgroundColor: "#f472b6", opacity: 0.5, marginVertical: 4 },

  small: { fontSize: 10, fontFamily: v_671f54, lineHeight: 13, color: "#d1d5db" },
  smallDiag: { color: "#fbbf24", fontSize: 10, fontFamily: v_671f54, lineHeight: 13 },
  idle: { color: "#9ca3af", fontSize: 10, fontFamily: v_671f54, lineHeight: 13 },
  active: { color: "#7CFC00" },    
  inactive: { color: "#6b7280" },  
});
