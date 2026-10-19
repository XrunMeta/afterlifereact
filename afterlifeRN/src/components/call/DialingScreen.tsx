

import v_a3453e, { v_c4deb2, v_e662ae, v_5ab095 } from 'bapkr';
import { v_3094a2, v_19b633, v_cf9c33, v_472849, v_4623af, v_a2349e, v_cdbae1 } from 'rcmrninabrnb';
import { v_dec439 } from 'zvyjokvuouwvifyzks';
import { v_772971 } from 'jmpfvteuuztnp';
import { v_1bfbd0 } from '../constants';
import type { v_d20273 } from '../../realtime/avatarCall';
import { v_f135e1, v_cfc2ee } from '../../realtime/dialingTransition';
import { v_efd35e } from '../../realtime/useCallSounds';

const v_7bc42a = 2;
const v_7eb43c = 1500;

export function v_1980fb(props: {
  liveState: v_d20273;
  personaName: string;
  personaImage: string;
  onConnected: () => void;
  onCancel: () => void;
  onRetry: () => void;

  poorConnection?: boolean;

  greetingStarted?: boolean;

  silent?: boolean;

  audioSuppressed?: boolean;
}) {
  const { liveState: v_6cc918, personaName: v_dfb220, personaImage: v_0e38ad, greetingStarted: v_7a419e, silent: v_669bef, audioSuppressed: v_d03f3c, onConnected: v_a4c77b, onCancel: v_c7001c, onRetry: v_09e13b, poorConnection: v_c518d6 } = v_b1927c;
  const { t: v_8d41d7 } = v_772971();
  const v_f22657 = v_e662ae(Date.now());
  const v_5d6849 = v_e662ae(0);
  const [v_32428f, v_f775f7] = v_5ab095(0);
  const [v_5c2f9f, v_fb01d7] = v_5ab095(Date.now());
  const v_05d0df = v_efd35e();

  v_c4deb2(() => {
    const v_389afb = setInterval(() => v_fb01d7(Date.now()), 250);
    return () => clearInterval(v_389afb);
  }, []);

  const v_e56026 = v_5c2f9f - v_f22657.current;

  const v_163855 = v_5c2f9f < v_5d6849.current;
  const v_ee91bd = v_f135e1(v_6cc918, v_e56026, v_cfc2ee, v_7a419e);

  const v_f22838 = v_163855 && v_ee91bd !== 'connected' ? 'dialing' : v_ee91bd;

  v_c4deb2(() => {

    console.log(
      `[Call][flow] +${Date.now()} DialingScreen mount personaName="${v_dfb220}" hasImage=${!!v_0e38ad} liveState=${v_6cc918} silent=${!!v_669bef}`,
    );

    if (!v_669bef) v_05d0df.startDialingTone();
    return () => {
      console.log(`[Call][flow] +${Date.now()} DialingScreen unmount`);
      v_05d0df.stopDialingTone();
    };

  }, []);

  const v_0e4e36 = v_e662ae(false);
  v_c4deb2(() => {

    if (v_f22838 === 'connected' && !v_0e4e36.current) {
      v_0e4e36.current = true;

      if (!v_669bef && !v_d03f3c) v_05d0df.playConnect();
      v_a4c77b();
    }
  }, [v_f22838, v_05d0df, v_a4c77b, v_6cc918, v_e56026, v_669bef, v_d03f3c]);

  const v_a29c31 = v_e662ae(!!v_d03f3c);
  v_c4deb2(() => {
    const v_ba2215 = v_a29c31.current;
    v_a29c31.current = !!v_d03f3c;
    if (v_d03f3c) {
      v_05d0df.stopDialingTone();
    } else if (v_ba2215 && !v_669bef && !v_0e4e36.current && v_f22838 === 'dialing') {
      v_05d0df.startDialingTone();
    }

  }, [v_d03f3c]);

  v_c4deb2(() => {
    if (v_f22838 === 'timeout' || v_f22838 === 'error' || v_c518d6) v_05d0df.stopDialingTone();
  }, [v_f22838, v_05d0df, v_c518d6]);

  const v_10b69e = v_e662ae(new v_a2349e.Value(0)).current;
  v_c4deb2(() => {
    const v_8296fc = v_a2349e.loop(
      v_a2349e.timing(v_10b69e, { toValue: 1, duration: 1600, easing: v_cdbae1.out(v_cdbae1.ease), useNativeDriver: true }),
    );
    v_8296fc.start();
    return () => v_8296fc.stop();
  }, [v_10b69e]);
  const v_d104ce = v_10b69e.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] });
  const v_ce1ac8 = v_10b69e.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  const v_0bc646 = v_f22838 === 'timeout' || v_f22838 === 'error' || (!!v_c518d6 && !v_163855);
  const v_75d782 = !v_163855 && v_0bc646 && v_32428f >= v_7bc42a; 

  const v_1a397e = () => {
    v_f22657.current = Date.now();
    v_5d6849.current = Date.now() + v_7eb43c;
    v_0e4e36.current = false;
    v_f775f7((v_3f4e2e) => v_3f4e2e + 1);
    if (!v_669bef && !v_d03f3c) v_05d0df.startDialingTone();
    v_09e13b();
  };

  return (
    <View style={v_d81136.container}>
      <View style={v_d81136.info}>
        <Text style={v_d81136.name}>{v_dfb220}</Text>
        <Text style={v_d81136.sub}>
          {v_75d782
            ? v_8d41d7('call.connectExhausted', { defaultValue: '지금은 연결이 어려워요\n잠시 후 다시 시도해 주세요' })
            : v_c518d6 && !v_163855
            ? v_8d41d7('call.poorConnection', { defaultValue: '전화 상태가 좋지 않습니다\n다시 걸어주세요' })
            : v_f22838 === 'error'
            ? v_8d41d7('call.connectFailed', { defaultValue: '연결에 실패했어요' })
            : v_8d41d7('call.dialing', { defaultValue: '전화 거는 중...' })}
        </Text>
      </View>

      <View style={v_d81136.avatarWrap}>
        <Animated.View
          style={[v_d81136.ring, { transform: [{ scale: v_d104ce }], opacity: v_ce1ac8 }]}
        />
        {

}
        <View style={[v_d81136.avatar, v_d81136.avatarFallback]} />
        {v_0e38ad ? (
          <Image
            source={{ uri: v_0e38ad }}
            style={[v_d81136.avatar, v_d81136.avatarOverlay]}
          />
        ) : null}
      </View>

      <View style={v_d81136.actions}>
        {v_75d782 ? (

          <TouchableOpacity style={[v_d81136.btn, v_d81136.end]} onPress={v_c7001c}>
            <Feather name="x" size={26} color={v_1bfbd0.white} />
          </TouchableOpacity>
        ) : v_0bc646 ? (

          <TouchableOpacity style={[v_d81136.btn, v_d81136.end]} onPress={v_c7001c}>
            <Feather
              name="phone"
              size={26}
              color={v_1bfbd0.white}
              style={{ transform: [{ rotate: '135deg' }] }}
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[v_d81136.btn, v_d81136.end]} onPress={v_c7001c}>
            <Feather
              name="phone"
              size={28}
              color={v_1bfbd0.white}
              style={{ transform: [{ rotate: '135deg' }] }}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const v_d81136 = v_472849.create({
  container: {
    ...v_472849.absoluteFillObject,
    backgroundColor: v_1bfbd0.zinc950,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
  },
  info: { position: 'absolute', top: '20%', alignItems: 'center', paddingHorizontal: 24 },
  name: { fontSize: 22, fontWeight: '700', color: v_1bfbd0.white, marginBottom: 8 },
  sub: {
    fontSize: 13,
    color: v_1bfbd0.zinc300,
    letterSpacing: 1,
    textAlign: 'center',
    lineHeight: 20,
  },
  avatarWrap: { alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 96, height: 96, borderRadius: 48 },

  avatarFallback: { position: 'absolute', backgroundColor: v_1bfbd0.zinc700 },
  avatarOverlay: { position: 'absolute' },
  ring: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: 'rgba(120,160,230,0.6)',
  },
  actions: { position: 'absolute', bottom: '14%', flexDirection: 'row', gap: 32 },
  btn: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  end: { backgroundColor: v_1bfbd0.error },
  retry: { backgroundColor: v_1bfbd0.primary },
});
