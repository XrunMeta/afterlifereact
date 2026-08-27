

import v_a3453e, { v_c4deb2, v_df9f57, v_e662ae, v_5ab095 } from "bapkr";
import { v_3094a2, v_cf9c33, v_472849 } from "rcmrninabrnb";
import { v_e82960, type v_0eab75 } from "qmmwyqbwrg";

export type Viseme =
  | "REST" | "A" | "E" | "I" | "O" | "U" | "EO" | "EU" | "BILAB" | "DENT";

export interface VisemeEvent {
  v: Viseme;
  dur_ms: number;
}

export interface VisemeSynthResponse {
  audio_wav_b64: string;
  duration_ms: number;
  visemes: VisemeEvent[];
}

interface Props {

  response: VisemeSynthResponse | null;

  visemePrefix: string | null;

  style?: object;

  onComplete?: () => void;
}

const v_da5a32 = [
  "REST", "A", "E", "I", "O", "U", "EO", "EU", "BILAB", "DENT",
];

function v_f43a13(v_cd931c, v_81e2ef): string {

  const v_694b25 = v_cd931c.endsWith("/") ? v_cd931c : `${v_cd931c}/`;
  return `${v_694b25}viseme_${v_81e2ef.toLowerCase()}.png`;
}

export default function v_d4f200({
  response: v_3393e3,
  visemePrefix: v_f3ade9,
  style: v_7fa4e4,
  onComplete: v_9397ad,
}: Props) {
  const [v_634a62, v_de470b] = v_5ab095<Viseme>("REST");
  const v_205807 = v_e662ae<v_0eab75 | null>(null);
  const v_1e1f71 = v_e662ae<ReturnType<typeof setTimeout> | null>(null);

  const v_cc2223 = v_df9f57(() => {
    if (!v_f3ade9) return null;
    const v_942aa2 = {} as Record<Viseme, string>;
    for (const v_81e2ef of v_da5a32) {
      v_942aa2[v_81e2ef] = v_f43a13(v_f3ade9, v_81e2ef);
    }
    return v_942aa2;
  }, [v_f3ade9]);

  v_c4deb2(() => {
    if (!v_cc2223) return;
    Object.values(v_cc2223).forEach((v_ceb55a) => {
      v_cf9c33.prefetch(v_ceb55a).catch(() => {  });
    });
  }, [v_cc2223]);

  v_c4deb2(() => {
    if (!v_3393e3) {
      v_de470b("REST");
      return;
    }
    let v_2008a4 = false;
    const v_a983d4 = () => {
      if (v_1e1f71.current) { clearTimeout(v_1e1f71.current); v_1e1f71.current = null; }
      if (v_205807.current) {
        try { v_205807.current.remove(); } catch {  }
        v_205807.current = null;
      }
    };

    try {

      if (__DEV__) console.log(`[VisemePlayer] create · b64_len=${v_3393e3.audio_wav_b64.length} · dur=${v_3393e3.duration_ms}ms · visemes=${v_3393e3.visemes.length}`);
      const v_86394a = v_e82960({
        uri: `data:audio/wav;base64,${v_3393e3.audio_wav_b64}`,
      });
      v_205807.current = v_86394a;
      if (__DEV__) console.log(`[VisemePlayer] player created OK`);

      const v_bf9904 = v_3393e3.visemes;
      let v_05f387 = 0;
      const v_39e0bf = Date.now();

      const v_729796 = (v_e86ad8) => {
        if (v_2008a4) return;
        if (v_e86ad8 >= v_bf9904.length) {
          v_de470b("REST");
          v_9397ad?.();
          return;
        }
        const v_1d299c = v_bf9904[v_e86ad8];
        v_de470b(v_1d299c.v);
        v_05f387 += v_1d299c.dur_ms;
        const v_5f5d6d = v_39e0bf + v_05f387;
        const v_4b24d2 = Math.max(0, v_5f5d6d - Date.now());
        v_1e1f71.current = setTimeout(() => v_729796(v_e86ad8 + 1), v_4b24d2);
      };

      try {
        v_86394a.play();
        if (__DEV__) console.log(`[VisemePlayer] player.play() invoked`);
      } catch (v_2cc79c) {
        console.warn("[VisemePlayer] player.play() threw:", v_2cc79c);
      }
      v_729796(0);
    } catch (v_9e86fd) {
      console.warn("[VisemePlayer] play failed:", v_9e86fd);
      v_de470b("REST");
    }

    return () => { v_2008a4 = true; v_a983d4(); };
  }, [v_3393e3, v_9397ad]);

  const v_3155e5 = v_cc2223 ? v_cc2223[v_634a62] : null;

  return (
    <View style={[v_d81136.container, v_7fa4e4]}>
      {v_3155e5 ? (
        <Image

          key={v_634a62}
          source={{ uri: v_3155e5 }}
          style={v_d81136.image}
          resizeMode="cover"
          fadeDuration={0}
          onLoad={() => { if (__DEV__) console.log(`[VisemePlayer] IMG OK: ${v_634a62}`); }}
          onError={(v_9e86fd) => { if (__DEV__) console.warn(`[VisemePlayer] IMG FAIL: ${v_634a62} · ${v_3155e5} · ${v_9e86fd?.nativeEvent?.error ?? "?"}`); }}
        />
      ) : (
        <View style={[v_d81136.image, v_d81136.placeholder]} />
      )}
    </View>
  );
}

const v_d81136 = v_472849.create({

  container: { width: "100%", height: "100%" },
  image: { width: "100%", height: "100%" },
  placeholder: { backgroundColor: "#222" },
});
