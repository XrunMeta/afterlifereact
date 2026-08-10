

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
} from "../../face/faceTrackRoster";

const v_53a12a = 500;

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

  const v_76d5cb =
    v_d5dda0 == null
      ? "diag -"
      : `diag ${v_d5dda0.score.toFixed(2)} ${v_d5dda0.verdict} ${v_d5dda0.streak}/3 thr:${v_d5dda0.threshold}`;

  return (
    <View style={v_d81136.wrap} pointerEvents="none">
      <Text style={v_d81136.badge}>DEV ONLY</Text>
      <Text style={v_d81136.title}>{`face/track ${v_2ba0d1}/${v_3e6465.entries.length}`}</Text>
      <Text style={v_d81136.diag} numberOfLines={1}>{v_76d5cb}</Text>
      <View style={v_d81136.sep} />
      {v_3e6465.entries.length === 0 ? (
        <Text style={v_d81136.idle}>no face yet</Text>
      ) : null}
      {v_3e6465.entries.map((v_9e86fd) => {
        const v_f8b770 = v_772beb(v_9e86fd, v_5c2f9f);
        return (
          <Text
            key={v_9e86fd.trackingId}
            numberOfLines={1}
            style={[v_d81136.line, v_f8b770 ? v_d81136.active : v_d81136.inactive]}
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

    position: "absolute", top: "55%", right: 6, zIndex: 32,
    backgroundColor: "rgba(0,0,0,0.78)",
    borderWidth: 1, borderColor: "#f472b6",
    borderRadius: 2, paddingHorizontal: 5, paddingVertical: 4, width: 178,
  },
  badge: {
    color: "#000", backgroundColor: "#f472b6", fontSize: 8, fontWeight: "700",
    fontFamily: v_671f54, paddingHorizontal: 3, alignSelf: "flex-start", marginBottom: 2,
  },
  title: { color: "#f472b6", fontSize: 9, fontFamily: v_671f54, marginBottom: 1 },
  diag: { color: "#fbbf24", fontSize: 9, fontFamily: v_671f54, lineHeight: 12 },
  sep: { height: 1, backgroundColor: "#f472b6", opacity: 0.5, marginVertical: 3 },
  idle: { color: "#9ca3af", fontSize: 9, fontFamily: v_671f54, lineHeight: 12 },
  line: { fontSize: 9, fontFamily: v_671f54, lineHeight: 12 },
  active: { color: "#7CFC00" },    
  inactive: { color: "#6b7280" },  
});
