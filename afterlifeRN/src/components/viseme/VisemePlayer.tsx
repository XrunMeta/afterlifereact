

import v_a3453e, { v_c4deb2, v_df9f57, v_e662ae, v_5ab095 } from "bapkr";
import { v_3094a2, v_cf9c33, v_472849, v_a2349e, v_cdbae1 } from "rcmrninabrnb";
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

  const [v_fc05fe, v_4206c5] = v_5ab095<Record<Viseme, string> | null>(null);
  v_c4deb2(() => {
    if (!v_cc2223) { v_4206c5(null); return; }
    let v_2008a4 = false;
    (async () => {
      const v_8d4337 = {} as Record<Viseme, string>;
      await Promise.all(v_da5a32.map(async (v_81e2ef) => {
        try {
          const v_8f00b9 = await fetch(v_cc2223[v_81e2ef]);
          const v_3263c7 = await v_8f00b9.blob();
          const v_f47a40 = new FileReader();
          const v_8d6b19 = await new Promise<string>((v_6f7712, v_bad6f3) => {
            v_f47a40.onload = () => v_6f7712(v_f47a40.result as string);
            v_f47a40.onerror = () => v_bad6f3(v_f47a40.error);
            v_f47a40.readAsDataURL(v_3263c7);
          });
          v_8d4337[v_81e2ef] = v_8d6b19;
        } catch (v_9e86fd) {
          if (__DEV__) console.warn(`[VisemePlayer] preload ${v_81e2ef} fail:`, v_9e86fd);
          v_8d4337[v_81e2ef] = v_cc2223[v_81e2ef]; 
        }
      }));
      if (!v_2008a4) {
        if (__DEV__) console.log(`[VisemePlayer] preload done · 10 dataUris ready`);
        v_4206c5(v_8d4337);
      }
    })();
    return () => { v_2008a4 = true; };
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
          if (__DEV__) console.log(`[VisemePlayer] STEP end → REST`);
          v_9397ad?.();
          return;
        }
        const v_1d299c = v_bf9904[v_e86ad8];
        v_de470b(v_1d299c.v);
        if (__DEV__) console.log(`[VisemePlayer] STEP ${v_e86ad8} → ${v_1d299c.v} · dur=${v_1d299c.dur_ms}ms`);
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

  return (
    <View style={[v_d81136.container, v_7fa4e4]}>
      {v_fc05fe ? (

        <FadeStack dataUris={v_fc05fe} currentViseme={v_634a62} />
      ) : (
        <View style={[v_d81136.image, v_d81136.placeholder]} />
      )}
    </View>
  );
}

function v_ab412d({
  dataUris: v_fc05fe,
  currentViseme: v_634a62,
}: {
  dataUris: Record<Viseme, string>;
  currentViseme: Viseme;
}) {

  const v_05c322 = v_e662ae<Record<Viseme, v_a2349e.Value> | null>(null);
  if (!v_05c322.current) {
    const map: Record<Viseme, v_a2349e.Value> = {} as Record<Viseme, v_a2349e.Value>;
    for (const v_81e2ef of v_da5a32) v_8dcb51[v_81e2ef] = new v_a2349e.Value(v_81e2ef === "REST" ? 1 : 0);
    v_05c322.current = v_8dcb51;
  }
  const v_152909 = v_05c322.current;

  v_c4deb2(() => {

    v_da5a32.forEach((v_81e2ef) => {
      v_a2349e.timing(v_152909[v_81e2ef], {
        toValue: v_81e2ef === v_634a62 ? 1 : 0,
        duration: 100,
        easing: v_cdbae1.linear,
        useNativeDriver: true,
      }).start();
    });
  }, [v_634a62, v_152909]);

  return (
    <>
      {v_da5a32.map((v_81e2ef) => (
        <Animated.Image
          key={v_81e2ef}
          source={{ uri: v_fc05fe[v_81e2ef] }}
          style={[v_d81136.image, v_d81136.overlayImage, { opacity: v_152909[v_81e2ef] }]}
          resizeMode="cover"
          fadeDuration={0}
        />
      ))}
    </>
  );
}

const v_d81136 = v_472849.create({

  container: { width: "100%", height: "100%" },
  image: { width: "100%", height: "100%" },
  overlayImage: { position: "absolute", top: 0, left: 0 },
  placeholder: { backgroundColor: "#222" },
});
