

import { v_5ab095, v_de06a3, v_e662ae, v_c4deb2 } from 'bapkr';
import { v_3094a2, v_19b633, v_79c4f2, v_472849, v_4623af, v_122070 } from 'rcmrninabrnb';
import { v_e82960, type v_0eab75 } from 'qmmwyqbwrg';

import * as v_f38d26 from 'lbosdxgirxcherxohyvziam';
import { v_da5c4b } from 'feadcwrczd';
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from '../../components/constants';
import v_556baf from '../../components/ui/SafeView';
import { v_be46cf } from '../../text/g2pk-js';
import { v_4bb4ce } from '../../text/g2pk-js/jamo';
import { v_3ee8c0, type v_d80981 } from '../../api/clones';
import { v_1ed7d9 } from '../../stores/authStore';

const v_34ca2a = {
  '_': 0, ',': 1, '.': 2, '!': 3, '?': 4, '…': 5, '~': 6,
  'ㄱ': 7, 'ㄴ': 8, 'ㄷ': 9, 'ㄹ': 10, 'ㅁ': 11, 'ㅂ': 12, 'ㅅ': 13, 'ㅇ': 14,
  'ㅈ': 15, 'ㅊ': 16, 'ㅋ': 17, 'ㅌ': 18, 'ㅍ': 19, 'ㅎ': 20,
  'ㄲ': 21, 'ㄸ': 22, 'ㅃ': 23, 'ㅆ': 24, 'ㅉ': 25,
  'ㅏ': 26, 'ㅓ': 27, 'ㅗ': 28, 'ㅜ': 29, 'ㅡ': 30, 'ㅣ': 31,
  'ㅐ': 32, 'ㅔ': 33, ' ': 34,
};

const v_cae26e = {
  'ㅑ': ['ㅣ', 'ㅏ'],
  'ㅕ': ['ㅣ', 'ㅓ'],
  'ㅛ': ['ㅣ', 'ㅗ'],
  'ㅠ': ['ㅣ', 'ㅜ'],
  'ㅒ': ['ㅣ', 'ㅐ'],
  'ㅖ': ['ㅣ', 'ㅔ'],
  'ㅘ': ['ㅗ', 'ㅏ'],
  'ㅙ': ['ㅗ', 'ㅐ'],
  'ㅚ': ['ㅗ', 'ㅣ'],
  'ㅝ': ['ㅜ', 'ㅓ'],
  'ㅞ': ['ㅜ', 'ㅔ'],
  'ㅟ': ['ㅜ', 'ㅣ'],
  'ㅢ': ['ㅡ', 'ㅣ'],
};

function v_29e3ac(v_ca4687): number[] {
  const v_479f05 = [];
  const v_930bf2 = [];
  for (const v_10a17d of v_ca4687) {
    const v_ebda8f = v_cae26e[v_10a17d] ?? [v_10a17d];
    for (const v_3f4e2e of v_ebda8f) {
      const v_389afb = v_34ca2a[v_3f4e2e];
      if (v_389afb !== undefined) {
        v_479f05.push(v_389afb);
      } else {
        v_930bf2.push(v_3f4e2e);
      }
    }
  }
  if (v_930bf2.length) {
    console.log(`[TtsLocalPoc] vocab miss (${v_930bf2.length}):`, v_930bf2.join(''));
  }

  const v_a0a2d8 = [0, 0, 0, 0, 0];
  for (const v_389afb of v_479f05) {
    v_a0a2d8.push(v_389afb);
    v_a0a2d8.push(0);
  }
  v_a0a2d8.push(0, 0, 0);
  return v_a0a2d8;
}

function v_952b2c(v_5b2623, v_c8d4f6 = 44100): Uint8Array {
  const v_062bb0 = new ArrayBuffer(44 + v_5b2623.length * 2);
  const v_2836d4 = new DataView(v_062bb0);

  let v_3bbadf = 0;
  const v_49d2be = (v_fd5f43) => {
    for (let v_ebec57 = 0; v_ebec57 < v_fd5f43.length; v_ebec57++) v_2836d4.setUint8(v_3bbadf++, v_fd5f43.charCodeAt(v_ebec57));
  };
  v_49d2be('RIFF');
  v_2836d4.setUint32(v_3bbadf, 36 + v_5b2623.length * 2, true); v_3bbadf += 4;
  v_49d2be('WAVE');
  v_49d2be('fmt ');
  v_2836d4.setUint32(v_3bbadf, 16, true); v_3bbadf += 4; 
  v_2836d4.setUint16(v_3bbadf, 1, true); v_3bbadf += 2; 
  v_2836d4.setUint16(v_3bbadf, 1, true); v_3bbadf += 2; 
  v_2836d4.setUint32(v_3bbadf, v_c8d4f6, true); v_3bbadf += 4;
  v_2836d4.setUint32(v_3bbadf, v_c8d4f6 * 2, true); v_3bbadf += 4; 
  v_2836d4.setUint16(v_3bbadf, 2, true); v_3bbadf += 2; 
  v_2836d4.setUint16(v_3bbadf, 16, true); v_3bbadf += 2; 
  v_49d2be('data');
  v_2836d4.setUint32(v_3bbadf, v_5b2623.length * 2, true); v_3bbadf += 4;

  for (let v_ebec57 = 0; v_ebec57 < v_5b2623.length; v_ebec57++) {
    const v_fd5f43 = Math.max(-1, Math.min(1, v_5b2623[v_ebec57]));
    v_2836d4.setInt16(v_3bbadf, v_fd5f43 < 0 ? v_fd5f43 * 0x8000 : v_fd5f43 * 0x7fff, true);
    v_3bbadf += 2;
  }

  return new Uint8Array(v_062bb0);
}

export default function v_e2119c() {
  const [v_9b6134, v_43d2ef] = v_5ab095('안녕하세요, 저는 할배예요.');
  const [v_ca4687, v_936a7f] = v_5ab095('');
  const [v_d308b5, v_5193f8] = v_5ab095<string>('준비');
  const [v_a712cf, v_ab79a4] = v_5ab095<number>(0);
  const v_f4a23b = v_e662ae<ReturnType<typeof v_be46cf> | null>(null);
  const v_f4fa42 = v_e662ae<v_0eab75 | null>(null);

  const v_d61830 = v_e662ae<any>(null);

  const [v_53e1f3, v_de0f36] = v_5ab095<v_d80981[]>([]);
  const [v_aa617a, v_b76e01] = v_5ab095<number | null>(null);
  const v_b53f6c = v_e662ae<v_0eab75 | null>(null);

  v_c4deb2(() => {

    v_5193f8('g2p 로드 중…');
    setTimeout(() => {
      try {
        v_f4a23b.current = v_be46cf({ loadCmu: false }); 
        v_5193f8('g2p 준비 완료');
      } catch (v_49263d) {
        v_5193f8(`g2p 로드 실패: ${v_49263d}`);
      }
    }, 100);

    const v_2ca7e0 = v_1ed7d9.getState().accessToken;
    if (v_2ca7e0) {
      v_3ee8c0(v_2ca7e0)
        .then(v_de0f36)
        .catch((v_49263d) => console.warn('[TtsLocalPoc] getVoices failed:', v_49263d));
    }
    return () => {
      v_f4fa42.current?.remove();
      v_b53f6c.current?.remove();
    };
  }, []);

  const v_1bf8db = (v: v_d80981) => {
    v_b53f6c.current?.remove();
    v_b53f6c.current = null;
    if (v_aa617a === v_81e2ef.id) {
      v_b76e01(null);
      return;
    }
    if (!v_81e2ef.sampleUrl) return;
    try {
      const v_86394a = v_e82960(v_81e2ef.sampleUrl);
      v_b53f6c.current = v_86394a;
      v_b76e01(v_81e2ef.id);
      v_86394a.play();
    } catch (v_49263d) {
      console.warn('[TtsLocalPoc] preview failed:', v_49263d);
    }
  };

  const v_fbef80 = v_de06a3(async () => {
    if (!v_f4a23b.current) {
      v_5193f8('g2p 미준비');
      return;
    }
    try {
      const v_965edf = Date.now();

      v_5193f8('g2p 실행 중…');

      let v_f0c8d3 = v_9b6134
        .replace(/예요/g, '에요')
        .replace(/이에요/g, '이애요');

      if (v_f0c8d3.trim().length < 6) {
        const v_2f361a = v_f0c8d3.trim();
        const v_6046ee = /[.!?]\s*$/.test(v_2f361a);
        v_f0c8d3 = ', ' + v_2f361a + (v_6046ee ? '' : '.');
      }

      const v_d62217 = v_f4a23b.current.run(v_f0c8d3, { toSyl: false });
      const v_479f05 = v_d62217;
      const v_c22a7a = v_4bb4ce(v_479f05); 
      v_936a7f(v_c22a7a);
      const v_52e08b = v_29e3ac(v_c22a7a);
      const v_8eee80 = Date.now() - v_965edf;

      console.log(`[TtsLocalPoc] input: "${v_9b6134}"`);
      console.log(`[TtsLocalPoc] rawFull (${v_d62217.length} chars):`, Array.from(v_d62217).map(v_3f4e2e => v_3f4e2e.charCodeAt(0).toString(16)).join(' '));
      console.log(`[TtsLocalPoc] raw after strip (${v_479f05.length} chars):`, Array.from(v_479f05).map(v_3f4e2e => v_3f4e2e.charCodeAt(0).toString(16)).join(' '));
      console.log(`[TtsLocalPoc] compact (${v_c22a7a.length} chars): "${v_c22a7a}"`);
      console.log(`[TtsLocalPoc] vocab ids (${v_52e08b.length}):`, v_52e08b.join(','));

      const v_a5c994 = Date.now();
      const { InferenceSession: v_eee163, Tensor: v_239850 } = await import('xwvwngpckyeydbryrllvuafz');

      let v_a3ff5a = v_d61830.current;
      if (!v_a3ff5a) {
        v_5193f8('ONNX 초회 로드… (~130s)');
        const v_b76cd8 = v_da5c4b.fromModule(require('../../../assets/tts/halbae_9053.onnx'));
        if (!v_b76cd8.localUri) {
          await v_b76cd8.downloadAsync();
        }
        const v_3e9268 = v_b76cd8.localUri;
        if (!v_3e9268) throw new Error('ONNX asset localUri 확보 실패');
        const v_5006e1 = v_3e9268.replace(/^file:\/\//, '');
        v_a3ff5a = await v_eee163.create(v_5006e1);
        v_d61830.current = v_a3ff5a;
      }
      v_5193f8('추론 중…');

      const v_c2ff59 = BigInt64Array.from(v_52e08b.map((v_f4e98d) => BigInt(v_f4e98d)));
      const v_101948 = BigInt64Array.from([BigInt(v_52e08b.length)]);
      const v_b50631 = {
        x: new v_239850('int64', v_c2ff59, [1, v_52e08b.length]),
        x_length: new v_239850('int64', v_101948, [1]),

        noise_scale: new v_239850('float32', new Float32Array([0.5]), [1]),
        length_scale: new v_239850('float32', new Float32Array([1.2]), [1]),
        noise_scale_w: new v_239850('float32', new Float32Array([0.6]), [1]),
      };

      const v_9ef443 = await v_a3ff5a.run(v_b50631);

      console.log('[TtsLocalPoc] output names:', Object.keys(v_9ef443));
      for (const [v_0eb677, v_81e2ef] of Object.entries(v_9ef443)) {
        console.log(`  ${v_0eb677}: dims=[${(v_81e2ef as any).dims}] len=${(v_81e2ef as any).data?.length}`);
      }

      const v_dbe504 = Object.values(v_9ef443).reduce((v_643757, v_c3bc75) => {
        const v_fbd664 = (v_643757 as any).data?.length ?? 0;
        const v_db7953 = (v_c3bc75 as any).data?.length ?? 0;
        return v_db7953 > v_fbd664 ? v_c3bc75 : v_643757;
      });
      console.log('[TtsLocalPoc] picked audio tensor len:', (v_dbe504 as any).data?.length);
      const v_116170 = new Float32Array(v_dbe504.data as Float32Array);

      const v_bb26bf = Math.min(2000, v_116170.length);
      for (let v_ebec57 = 0; v_ebec57 < v_bb26bf; v_ebec57++) {
        v_116170[v_ebec57] *= v_ebec57 / v_bb26bf;
      }

      const v_a09d1e = Math.min(512, v_116170.length);
      for (let v_ebec57 = 0; v_ebec57 < v_a09d1e; v_ebec57++) {
        v_116170[v_116170.length - 1 - v_ebec57] *= v_ebec57 / v_a09d1e;
      }
      const v_ccc71a = Date.now() - v_a5c994;

      v_5193f8('WAV 인코딩 중…');
      const v_7ab8bd = v_952b2c(v_116170, 44100);
      const v_474ae4 = Buffer.from(v_7ab8bd).toString('base64');
      const v_f2bb81 = v_f38d26.cacheDirectory + `tts_poc_${Date.now()}.wav`;
      await v_f38d26.writeAsStringAsync(v_f2bb81, v_474ae4, {
        encoding: v_f38d26.EncodingType.Base64,
      });

      v_5193f8('재생 중…');
      v_f4fa42.current?.remove();
      const v_86394a = v_e82960(v_f2bb81);
      v_f4fa42.current = v_86394a;
      v_86394a.play();

      const v_57324b = Date.now() - v_965edf;
      const v_c46b36 = v_116170.length / 44100;
      v_ab79a4(v_c46b36);
      v_5193f8(
        `완료 · g2p ${v_8eee80}ms · ONNX ${v_ccc71a}ms · 총 ${v_57324b}ms · 오디오 ${v_c46b36.toFixed(1)}s`,
      );
    } catch (v_49263d) {
      v_5193f8(`에러: ${v_49263d}`);
      console.error('[TtsLocalPoc]', v_49263d);
    }
  }, [v_9b6134]);

  return (
    <SafeView backgroundColor={v_1bfbd0.zinc50}>
      <ScrollView contentContainerStyle={v_fd5f43.container}>
        <Text style={v_fd5f43.title}>로컬 TTS POC (T-705)</Text>
        <Text style={v_fd5f43.subtitle}>
          완전 로컬 파이프라인: g2p-js → VITS ONNX → WAV → 재생
        </Text>

        <TextInput
          style={v_fd5f43.input}
          value={v_9b6134}
          onChangeText={v_43d2ef}
          multiline
          placeholder="한국어 텍스트를 입력하세요"
        />

        <TouchableOpacity style={v_fd5f43.btn} onPress={v_fbef80}>
          <Text style={v_fd5f43.btnText}>실행</Text>
        </TouchableOpacity>

        <View style={v_fd5f43.result}>
          <Text style={v_fd5f43.label}>상태</Text>
          <Text style={v_fd5f43.value}>{v_d308b5}</Text>

          <Text style={v_fd5f43.label}>Phonemes (호환 자모)</Text>
          <Text style={v_fd5f43.valueMono} selectable>
            {v_ca4687 || '(실행 전)'}
          </Text>

          {v_a712cf > 0 && (
            <>
              <Text style={v_fd5f43.label}>오디오 길이</Text>
              <Text style={v_fd5f43.value}>{v_a712cf.toFixed(2)}s</Text>
            </>
          )}
        </View>

        {}
        <View style={v_fd5f43.voicesSection}>
          <Text style={v_fd5f43.voicesTitle}>등록된 목소리 (서버 카탈로그)</Text>
          <Text style={v_fd5f43.voicesHint}>
            ▶ 미리듣기 는 서버에 업로드된 샘플 재생.{'\n'}
            로컬 ONNX 는 halbae 하나만 앱에 번들. 다른 목소리 로컬 실행은 각 ONNX 를 앱에 넣어야 함.
          </Text>
          {v_53e1f3.length === 0 ? (
            <Text style={v_fd5f43.voicesEmpty}>(등록된 목소리 없음 or 아직 로딩 중)</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={v_fd5f43.voicesRow}
            >
              {v_53e1f3.map((v_81e2ef) => {
                const v_087c92 = v_81e2ef.id === v_aa617a;
                return (
                  <View key={v_81e2ef.id} style={v_fd5f43.voiceItem}>
                    <Text style={v_fd5f43.voiceItemName}>{v_81e2ef.name}</Text>
                    {(v_81e2ef.gender || v_81e2ef.ageRange) && (
                      <Text style={v_fd5f43.voiceItemMeta}>
                        {[v_81e2ef.gender, v_81e2ef.ageRange].filter(Boolean).join(' · ')}
                      </Text>
                    )}
                    <TouchableOpacity
                      style={v_fd5f43.voicePreviewBtn}
                      onPress={() => v_1bf8db(v_81e2ef)}
                    >
                      <Text style={v_fd5f43.voicePreviewBtnText}>
                        {v_087c92 ? '■ 정지' : '▶ 미리듣기'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </ScrollView>
    </SafeView>
  );
}

const v_fd5f43 = v_472849.create({
  container: {
    padding: v_9b1a04.medium,
    gap: v_9b1a04.medium,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: v_1bfbd0.zinc900,
  },
  subtitle: {
    fontSize: 12,
    color: v_1bfbd0.zinc500,
  },
  input: {
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc300,
    borderRadius: v_8b0c90.md,
    padding: v_9b1a04.small,
    minHeight: 80,
    fontSize: 14,
    color: v_1bfbd0.zinc900,
    backgroundColor: v_1bfbd0.white,
  },
  btn: {
    backgroundColor: v_1bfbd0.violet500,
    padding: v_9b1a04.small,
    borderRadius: v_8b0c90.md,
    alignItems: 'center',
  },
  btnText: {
    color: v_1bfbd0.white,
    fontWeight: '600',
  },
  result: {
    gap: 4,
    padding: v_9b1a04.small,
    backgroundColor: v_1bfbd0.white,
    borderRadius: v_8b0c90.md,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
  },
  label: {
    fontSize: 11,
    color: v_1bfbd0.zinc500,
    marginTop: 6,
  },
  value: {
    fontSize: 13,
    color: v_1bfbd0.zinc900,
  },
  valueMono: {
    fontSize: 12,
    color: v_1bfbd0.zinc700,
    fontFamily: 'Courier',
  },

  voicesSection: {
    marginTop: v_9b1a04.medium,
    padding: v_9b1a04.small,
    backgroundColor: v_1bfbd0.white,
    borderRadius: v_8b0c90.md,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
  },
  voicesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: v_1bfbd0.zinc900,
    marginBottom: 4,
  },
  voicesHint: {
    fontSize: 11,
    color: v_1bfbd0.zinc500,
    lineHeight: 15,
    marginBottom: 12,
  },
  voicesEmpty: {
    fontSize: 12,
    color: v_1bfbd0.zinc400,
  },
  voicesRow: {
    gap: 10,
    paddingRight: v_9b1a04.small,
  },
  voiceItem: {
    width: 130,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc300,
    backgroundColor: v_1bfbd0.zinc50,
  },
  voiceItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: v_1bfbd0.zinc900,
  },
  voiceItemMeta: {
    fontSize: 10,
    color: v_1bfbd0.zinc500,
    marginTop: 3,
  },
  voicePreviewBtn: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: v_1bfbd0.violet500,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  voicePreviewBtnText: {
    fontSize: 11,
    color: v_1bfbd0.white,
    fontWeight: '600',
  },
});
