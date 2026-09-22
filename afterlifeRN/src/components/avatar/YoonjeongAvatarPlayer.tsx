

import v_a3453e, {
  v_680bcc,
  v_de06a3,
  v_c4deb2,
  v_298205,
  v_df9f57,
  v_e662ae,
  v_5ab095,
} from 'bapkr';
import { v_a2349e, v_472849, v_3094a2, type v_7e4944 } from 'rcmrninabrnb';
import { v_110960, v_52ec3e } from 'euzpkmxzoe';
import { v_e82960, v_0e491a, type v_0eab75 } from 'qmmwyqbwrg';

import { v_dd9753, v_919a30, v_a60398, type v_7ae8bf } from '../../realtime/avatarIntent';

const v_906445 = {
  breath: require('../../../assets/avatar/yoonjeong/idle/idle_breath.mp4'),
  breath_alt: require('../../../assets/avatar/yoonjeong/idle/idle_breath_alt.mp4'),
  hair: require('../../../assets/avatar/yoonjeong/idle/idle_hair.mp4'),
} as const;
type IdleKey = keyof typeof v_906445;

const BRIDGE_MP4_ASSETS: Record<v_7ae8bf, number> = {
  fact: require('../../../assets/avatar/yoonjeong/bridge/bridge_fact.mp4'),
  emotion_pos: require('../../../assets/avatar/yoonjeong/bridge/bridge_emotion_pos.mp4'),
  complex: require('../../../assets/avatar/yoonjeong/bridge/bridge_complex.mp4'),
  challenge: require('../../../assets/avatar/yoonjeong/bridge/bridge_challenge.mp4'),
  generic: require('../../../assets/avatar/yoonjeong/bridge/bridge_generic.mp4'),

  location: require('../../../assets/avatar/yoonjeong/bridge/bridge_generic.mp4'),
  advice: require('../../../assets/avatar/yoonjeong/bridge/bridge_generic.mp4'),
  self: require('../../../assets/avatar/yoonjeong/bridge/bridge_generic.mp4'),
  emotion_neg: require('../../../assets/avatar/yoonjeong/bridge/bridge_generic.mp4'),
};

const BRIDGE_MP3_ASSETS: Record<v_7ae8bf, number> = {
  fact: require('../../../assets/avatar/yoonjeong/bridge/bridge_fact.mp3'),
  emotion_pos: require('../../../assets/avatar/yoonjeong/bridge/bridge_emotion_pos.mp3'),
  complex: require('../../../assets/avatar/yoonjeong/bridge/bridge_complex.mp3'),
  challenge: require('../../../assets/avatar/yoonjeong/bridge/bridge_challenge.mp3'),
  generic: require('../../../assets/avatar/yoonjeong/bridge/bridge_generic.mp3'),
  location: require('../../../assets/avatar/yoonjeong/bridge/bridge_location.mp3'),
  advice: require('../../../assets/avatar/yoonjeong/bridge/bridge_advice.mp3'),
  self: require('../../../assets/avatar/yoonjeong/bridge/bridge_generic.mp3'),
  emotion_neg: require('../../../assets/avatar/yoonjeong/bridge/bridge_generic.mp3'),
};

function v_c609dc(v_275ccd): IdleKey {
  const v_6f7c85 = ['breath', 'breath_alt', 'hair'];
  const v_e4cf17 = v_6f7c85.filter((v_0eb677) => v_0eb677 !== v_275ccd);

  const v_fc6de5 = Math.random();
  if (v_fc6de5 < 0.30) {
    if (v_e4cf17.includes('hair')) return 'hair';
  }

  const v_24afbf = v_e4cf17.filter((v_0eb677) => v_0eb677.startsWith('breath'));
  if (v_24afbf.length > 0) return v_24afbf[Math.floor(Math.random() * v_24afbf.length)] as IdleKey;
  return v_e4cf17[0] as IdleKey;
}

export interface YoonjeongAvatarPlayerHandle {
  playBridge: (text: string) => void;
  stopBridge: () => void;
  isBridgePlaying: () => boolean;
}

interface Props {

  style?: v_7e4944;

  paused?: boolean;

  onBridgeStart?: (intent: v_7ae8bf) => void;

  onBridgeEnd?: (intent: v_7ae8bf) => void;
}

export const v_6976f2 = v_680bcc<YoonjeongAvatarPlayerHandle, Props>(
  function v_6976f2({ style: v_7fa4e4, paused: v_9ab695, onBridgeStart: v_48b312, onBridgeEnd: v_d2c1bc }, v_6d4ed3) {

    const v_7e34d2 = v_906445.breath;
    const v_948c88 = v_110960(v_7e34d2, (v_e2a85c) => {
      v_e2a85c.loop = true; 
      v_e2a85c.muted = true;
      v_e2a85c.play();
    });

    v_c4deb2(() => {
      const v_e2a85c = v_948c88;
      if (!v_e2a85c) return;
      try {
        if (v_9ab695) v_e2a85c.pause();
        else v_e2a85c.play();
      } catch {}
    }, [v_9ab695, v_948c88]);

    const [v_ee2cf8, v_af7f7f] = v_5ab095<number | null>(null);
    const [v_902e94, v_7e1326] = v_5ab095(false);
    const v_9fdec5 = v_e662ae<v_7ae8bf | null>(null);
    const v_400fbc = v_e662ae<v_7ae8bf | null>(null);

    const v_9cebd7 = v_e662ae(new v_a2349e.Value(1)).current;
    const v_093525 = 250;

    const v_0d6297 = v_110960(null, (v_e2a85c) => {
      v_e2a85c.loop = false;
      v_e2a85c.muted = false;
      v_e2a85c.volume = 1.0;
    });

    const v_890dcc = v_e662ae<Partial<Record<v_7ae8bf, v_0eab75>>>({});
    const v_da3f78 = v_e662ae<v_0eab75 | null>(null);
    const v_667039 = v_de06a3((intent: v_7ae8bf): v_0eab75 | null => {
      try {
        const v_3f4e2e = v_890dcc.current;
        if (v_3f4e2e[v_9d78c8]) return v_3f4e2e[v_9d78c8] as v_0eab75;
        const v_86394a = v_e82960(v_fb22ba[v_9d78c8]);
        try { v_86394a.volume = 1.0; } catch {}
        v_3f4e2e[v_9d78c8] = v_86394a;
        return v_86394a;
      } catch {
        return null;
      }
    }, []);

    v_c4deb2(() => {
      void (async () => {
        try {
          await v_0e491a({
            playsInSilentMode: true,
            interruptionMode: 'mixWithOthers',
            allowsRecording: true,     
            shouldPlayInBackground: false,
            shouldRouteThroughEarpiece: false, 
          });
        } catch (v_9e86fd) {
          if (__DEV__) console.warn('[T-806/audio] setAudioModeAsync failed:', v_9e86fd);
        }
      })();
    }, []);

    const v_056b18 = v_de06a3(() => {
      const v_e2a85c = v_0d6297;
      try { if (v_e2a85c) v_e2a85c.pause(); } catch {}
      const v_4d1236 = v_da3f78.current;
      if (v_4d1236) { try { v_4d1236.pause(); } catch {} v_da3f78.current = null; }
      v_7e1326(false);
      v_af7f7f(null);
      v_400fbc.current = null;
    }, [v_0d6297]);

    const v_92c3ab = v_de06a3((v_9b6134) => {
      const v_479f05 = v_919a30(v_9b6134);
      const v_9d78c8 = v_a60398(v_479f05, v_9fdec5.current);
      const v_04e790 = v_883c85[v_9d78c8];
      v_9fdec5.current = v_9d78c8;
      v_400fbc.current = v_9d78c8;
      v_af7f7f(v_04e790);

      v_9cebd7.setValue(1);
      v_7e1326(true);

      try { v_48b312?.(v_9d78c8); } catch {}
      const v_e2a85c = v_0d6297;
      if (!v_e2a85c) return;
      try {
        const v_94d529 = () => {
          try {
            v_e2a85c.currentTime = 0;

            v_e2a85c.muted = false;
            v_e2a85c.volume = 1.0;
            v_e2a85c.play();
          } catch {}
        };
        if (typeof v_e2a85c.replaceAsync === 'function') {
          v_e2a85c.replaceAsync(v_04e790).then(v_94d529).catch(v_94d529);
        } else if (typeof v_e2a85c.replace === 'function') {
          v_e2a85c.replace(v_04e790);
          v_94d529();
        } else {
          v_94d529();
        }
      } catch {}
    }, [v_0d6297, v_48b312]);

    v_c4deb2(() => {
      const v_e2a85c = v_0d6297;
      if (!v_e2a85c) return;
      let v_259675 = false;
      const v_9e0440 = () => {
        if (v_259675) return;
        const v_cc0753 = v_400fbc.current;

        v_a2349e.timing(v_9cebd7, {
          toValue: 0,
          duration: v_093525,
          useNativeDriver: true,
        }).start(({ finished: v_85bc9b }) => {
          if (!v_85bc9b) return;
          v_7e1326(false);
          v_af7f7f(null);
          v_400fbc.current = null;
          const v_4d1236 = v_da3f78.current;
          if (v_4d1236) { try { v_4d1236.pause(); } catch {} v_da3f78.current = null; }
          if (v_cc0753) v_d2c1bc?.(v_cc0753);
        });
      };
      const v_9fde29 = [];
      try {
        if (typeof v_e2a85c.addListener === 'function') {
          const v_1ae212 = v_e2a85c.addListener('playToEnd', v_9e0440);
          if (v_1ae212 && typeof v_1ae212.remove === 'function') v_9fde29.push(() => v_1ae212.remove());
        }
      } catch {}
      let v_16badd = null;
      if (v_9fde29.length === 0) {
        v_16badd = setInterval(() => {
          if (!v_902e94) return;
          try {
            const v_7dc4bb = Number(v_e2a85c.duration);
            const v_c3bc75 = Number(v_e2a85c.currentTime);
            if (Number.isFinite(v_7dc4bb) && v_7dc4bb > 0 && Number.isFinite(v_c3bc75) && v_7dc4bb - v_c3bc75 < 0.05) {
              v_9e0440();
            }
          } catch {}
        }, 200);
      }
      return () => {
        v_259675 = true;
        for (const v_fa04a0 of v_9fde29) { try { v_fa04a0(); } catch {} }
        if (v_16badd) clearInterval(v_16badd);
      };
    }, [v_0d6297, v_902e94, v_d2c1bc]);

    v_298205(v_6d4ed3, () => ({
      playBridge: v_92c3ab,
      stopBridge: v_056b18,
      isBridgePlaying: () => v_902e94,
    }), [v_92c3ab, v_056b18, v_902e94]);

    v_c4deb2(() => () => {
      try { (v_0d6297 as any)?.pause?.(); } catch {}
      const v_a23604 = v_890dcc.current;
      for (const v_0eb677 of Object.keys(v_a23604) as v_7ae8bf[]) {
        const v_4d1236 = v_a23604[v_0eb677];
        if (v_4d1236) { try { v_4d1236.pause(); } catch {} try { v_4d1236.remove(); } catch {} }
      }
      v_890dcc.current = {};
      v_da3f78.current = null;
    }, [v_0d6297]);

    const v_4affe9 = v_df9f57(() => [v_d81136.container, v_7fa4e4], [v_7fa4e4]);

    return (
      <View style={v_4affe9} pointerEvents="none">
        {}
        {}
        <VideoView
          player={v_948c88}
          style={v_472849.absoluteFillObject}
          contentFit="cover"
          nativeControls={false}
        />
        {}
        {v_902e94 && v_ee2cf8 != null ? (
          <Animated.View style={[v_472849.absoluteFillObject, { opacity: v_9cebd7 }]} pointerEvents="none">
            <VideoView
              player={v_0d6297}
              style={v_472849.absoluteFillObject}
              contentFit="cover"
              nativeControls={false}
            />
          </Animated.View>
        ) : null}
      </View>
    );
  },
);

const v_d81136 = v_472849.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#000',
  },
});

export { v_dd9753 };
