

import { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import { COLORS, SIZES, RADIUS } from '../../components/constants';
import SafeView from '../../components/ui/SafeView';
import { createG2p } from '../../text/g2pk-js';
import { toCompat } from '../../text/g2pk-js/jamo';
import { getVoices, type CatalogVoice } from '../../api/clones';
import { useAuthStore } from '../../stores/authStore';

const VOCAB: Record<string, number> = {
  '_': 0, ',': 1, '.': 2, '!': 3, '?': 4, '…': 5, '~': 6,
  'ㄱ': 7, 'ㄴ': 8, 'ㄷ': 9, 'ㄹ': 10, 'ㅁ': 11, 'ㅂ': 12, 'ㅅ': 13, 'ㅇ': 14,
  'ㅈ': 15, 'ㅊ': 16, 'ㅋ': 17, 'ㅌ': 18, 'ㅍ': 19, 'ㅎ': 20,
  'ㄲ': 21, 'ㄸ': 22, 'ㅃ': 23, 'ㅆ': 24, 'ㅉ': 25,
  'ㅏ': 26, 'ㅓ': 27, 'ㅗ': 28, 'ㅜ': 29, 'ㅡ': 30, 'ㅣ': 31,
  'ㅐ': 32, 'ㅔ': 33, ' ': 34,
};

const DIPHTHONG_MAP: Record<string, string[]> = {
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

function toVocabIds(phonemes: string): number[] {
  const raw: number[] = [];
  const skipped: string[] = [];
  for (const ch of phonemes) {
    const expanded = DIPHTHONG_MAP[ch] ?? [ch];
    for (const c of expanded) {
      const id = VOCAB[c];
      if (id !== undefined) {
        raw.push(id);
      } else {
        skipped.push(c);
      }
    }
  }
  if (skipped.length) {
    console.log(`[TtsLocalPoc] vocab miss (${skipped.length}):`, skipped.join(''));
  }

  const withBlank: number[] = [0, 0, 0, 0, 0];
  for (const id of raw) {
    withBlank.push(id);
    withBlank.push(0);
  }
  withBlank.push(0, 0, 0);
  return withBlank;
}

function encodeWav(samples: Float32Array, sampleRate: number = 44100): Uint8Array {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  let offset = 0;
  const writeString = (s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset++, s.charCodeAt(i));
  };
  writeString('RIFF');
  view.setUint32(offset, 36 + samples.length * 2, true); offset += 4;
  writeString('WAVE');
  writeString('fmt ');
  view.setUint32(offset, 16, true); offset += 4; 
  view.setUint16(offset, 1, true); offset += 2; 
  view.setUint16(offset, 1, true); offset += 2; 
  view.setUint32(offset, sampleRate, true); offset += 4;
  view.setUint32(offset, sampleRate * 2, true); offset += 4; 
  view.setUint16(offset, 2, true); offset += 2; 
  view.setUint16(offset, 16, true); offset += 2; 
  writeString('data');
  view.setUint32(offset, samples.length * 2, true); offset += 4;

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Uint8Array(buffer);
}

export default function TtsLocalPocScreen() {
  const [text, setText] = useState('안녕하세요, 저는 할배예요.');
  const [phonemes, setPhonemes] = useState('');
  const [status, setStatus] = useState<string>('준비');
  const [duration, setDuration] = useState<number>(0);
  const g2pRef = useRef<ReturnType<typeof createG2p> | null>(null);
  const soundRef = useRef<AudioPlayer | null>(null);

  const sessionRef = useRef<any>(null);

  const [voices, setVoices] = useState<CatalogVoice[]>([]);
  const [previewingId, setPreviewingId] = useState<number | null>(null);
  const previewPlayerRef = useRef<AudioPlayer | null>(null);

  useEffect(() => {

    setStatus('g2p 로드 중…');
    setTimeout(() => {
      try {
        g2pRef.current = createG2p({ loadCmu: false }); 
        setStatus('g2p 준비 완료');
      } catch (err) {
        setStatus(`g2p 로드 실패: ${err}`);
      }
    }, 100);

    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      getVoices(accessToken)
        .then(setVoices)
        .catch((err) => console.warn('[TtsLocalPoc] getVoices failed:', err));
    }
    return () => {
      soundRef.current?.remove();
      previewPlayerRef.current?.remove();
    };
  }, []);

  const togglePreview = (v: CatalogVoice) => {
    previewPlayerRef.current?.remove();
    previewPlayerRef.current = null;
    if (previewingId === v.id) {
      setPreviewingId(null);
      return;
    }
    if (!v.sampleUrl) return;
    try {
      const player = createAudioPlayer(v.sampleUrl);
      previewPlayerRef.current = player;
      setPreviewingId(v.id);
      player.play();
    } catch (err) {
      console.warn('[TtsLocalPoc] preview failed:', err);
    }
  };

  const handleRun = useCallback(async () => {
    if (!g2pRef.current) {
      setStatus('g2p 미준비');
      return;
    }
    try {
      const start = Date.now();

      setStatus('g2p 실행 중…');

      let preNormalized = text
        .replace(/예요/g, '에요')
        .replace(/이에요/g, '이애요');

      if (preNormalized.trim().length < 6) {
        const trimmed = preNormalized.trim();
        const hasEnd = /[.!?]\s*$/.test(trimmed);
        preNormalized = ', ' + trimmed + (hasEnd ? '' : '.');
      }

      const rawFull = g2pRef.current.run(preNormalized, { toSyl: false });
      const raw = rawFull;
      const compact = toCompat(raw); 
      setPhonemes(compact);
      const ids = toVocabIds(compact);
      const g2pMs = Date.now() - start;

      console.log(`[TtsLocalPoc] input: "${text}"`);
      console.log(`[TtsLocalPoc] rawFull (${rawFull.length} chars):`, Array.from(rawFull).map(c => c.charCodeAt(0).toString(16)).join(' '));
      console.log(`[TtsLocalPoc] raw after strip (${raw.length} chars):`, Array.from(raw).map(c => c.charCodeAt(0).toString(16)).join(' '));
      console.log(`[TtsLocalPoc] compact (${compact.length} chars): "${compact}"`);
      console.log(`[TtsLocalPoc] vocab ids (${ids.length}):`, ids.join(','));

      const onnxStart = Date.now();
      const { InferenceSession, Tensor } = await import('onnxruntime-react-native');

      let session = sessionRef.current;
      if (!session) {
        setStatus('ONNX 초회 로드… (~130s)');
        const asset = Asset.fromModule(require('../../../assets/tts/halbae_9053.onnx'));
        if (!asset.localUri) {
          await asset.downloadAsync();
        }
        const modelPath = asset.localUri;
        if (!modelPath) throw new Error('ONNX asset localUri 확보 실패');
        const cleanPath = modelPath.replace(/^file:\/\//, '');
        session = await InferenceSession.create(cleanPath);
        sessionRef.current = session;
      }
      setStatus('추론 중…');

      const xArr = BigInt64Array.from(ids.map((n) => BigInt(n)));
      const xLenArr = BigInt64Array.from([BigInt(ids.length)]);
      const inputs = {
        x: new Tensor('int64', xArr, [1, ids.length]),
        x_length: new Tensor('int64', xLenArr, [1]),

        noise_scale: new Tensor('float32', new Float32Array([0.5]), [1]),
        length_scale: new Tensor('float32', new Float32Array([1.2]), [1]),
        noise_scale_w: new Tensor('float32', new Float32Array([0.6]), [1]),
      };

      const output = await session.run(inputs);

      console.log('[TtsLocalPoc] output names:', Object.keys(output));
      for (const [k, v] of Object.entries(output)) {
        console.log(`  ${k}: dims=[${(v as any).dims}] len=${(v as any).data?.length}`);
      }

      const audioTensor = Object.values(output).reduce((best, cur) => {
        const bestLen = (best as any).data?.length ?? 0;
        const curLen = (cur as any).data?.length ?? 0;
        return curLen > bestLen ? cur : best;
      });
      console.log('[TtsLocalPoc] picked audio tensor len:', (audioTensor as any).data?.length);
      const audioData = new Float32Array(audioTensor.data as Float32Array);

      const fadeInSamples = Math.min(2000, audioData.length);
      for (let i = 0; i < fadeInSamples; i++) {
        audioData[i] *= i / fadeInSamples;
      }

      const fadeOutSamples = Math.min(512, audioData.length);
      for (let i = 0; i < fadeOutSamples; i++) {
        audioData[audioData.length - 1 - i] *= i / fadeOutSamples;
      }
      const onnxMs = Date.now() - onnxStart;

      setStatus('WAV 인코딩 중…');
      const wav = encodeWav(audioData, 44100);
      const wavBase64 = Buffer.from(wav).toString('base64');
      const wavPath = FileSystem.cacheDirectory + `tts_poc_${Date.now()}.wav`;
      await FileSystem.writeAsStringAsync(wavPath, wavBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      setStatus('재생 중…');
      soundRef.current?.remove();
      const player = createAudioPlayer(wavPath);
      soundRef.current = player;
      player.play();

      const totalMs = Date.now() - start;
      const audioDurationSec = audioData.length / 44100;
      setDuration(audioDurationSec);
      setStatus(
        `완료 · g2p ${g2pMs}ms · ONNX ${onnxMs}ms · 총 ${totalMs}ms · 오디오 ${audioDurationSec.toFixed(1)}s`,
      );
    } catch (err) {
      setStatus(`에러: ${err}`);
      console.error('[TtsLocalPoc]', err);
    }
  }, [text]);

  return (
    <SafeView backgroundColor={COLORS.zinc50}>
      <ScrollView contentContainerStyle={s.container}>
        <Text style={s.title}>로컬 TTS POC (T-705)</Text>
        <Text style={s.subtitle}>
          완전 로컬 파이프라인: g2p-js → VITS ONNX → WAV → 재생
        </Text>

        <TextInput
          style={s.input}
          value={text}
          onChangeText={setText}
          multiline
          placeholder="한국어 텍스트를 입력하세요"
        />

        <TouchableOpacity style={s.btn} onPress={handleRun}>
          <Text style={s.btnText}>실행</Text>
        </TouchableOpacity>

        <View style={s.result}>
          <Text style={s.label}>상태</Text>
          <Text style={s.value}>{status}</Text>

          <Text style={s.label}>Phonemes (호환 자모)</Text>
          <Text style={s.valueMono} selectable>
            {phonemes || '(실행 전)'}
          </Text>

          {duration > 0 && (
            <>
              <Text style={s.label}>오디오 길이</Text>
              <Text style={s.value}>{duration.toFixed(2)}s</Text>
            </>
          )}
        </View>

        {}
        <View style={s.voicesSection}>
          <Text style={s.voicesTitle}>등록된 목소리 (서버 카탈로그)</Text>
          <Text style={s.voicesHint}>
            ▶ 미리듣기 는 서버에 업로드된 샘플 재생.{'\n'}
            로컬 ONNX 는 halbae 하나만 앱에 번들. 다른 목소리 로컬 실행은 각 ONNX 를 앱에 넣어야 함.
          </Text>
          {voices.length === 0 ? (
            <Text style={s.voicesEmpty}>(등록된 목소리 없음 or 아직 로딩 중)</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.voicesRow}
            >
              {voices.map((v) => {
                const isPlaying = v.id === previewingId;
                return (
                  <View key={v.id} style={s.voiceItem}>
                    <Text style={s.voiceItemName}>{v.name}</Text>
                    {(v.gender || v.ageRange) && (
                      <Text style={s.voiceItemMeta}>
                        {[v.gender, v.ageRange].filter(Boolean).join(' · ')}
                      </Text>
                    )}
                    <TouchableOpacity
                      style={s.voicePreviewBtn}
                      onPress={() => togglePreview(v)}
                    >
                      <Text style={s.voicePreviewBtnText}>
                        {isPlaying ? '■ 정지' : '▶ 미리듣기'}
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

const s = StyleSheet.create({
  container: {
    padding: SIZES.medium,
    gap: SIZES.medium,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.zinc900,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.zinc500,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.zinc300,
    borderRadius: RADIUS.md,
    padding: SIZES.small,
    minHeight: 80,
    fontSize: 14,
    color: COLORS.zinc900,
    backgroundColor: COLORS.white,
  },
  btn: {
    backgroundColor: COLORS.violet500,
    padding: SIZES.small,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  btnText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  result: {
    gap: 4,
    padding: SIZES.small,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
  },
  label: {
    fontSize: 11,
    color: COLORS.zinc500,
    marginTop: 6,
  },
  value: {
    fontSize: 13,
    color: COLORS.zinc900,
  },
  valueMono: {
    fontSize: 12,
    color: COLORS.zinc700,
    fontFamily: 'Courier',
  },

  voicesSection: {
    marginTop: SIZES.medium,
    padding: SIZES.small,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
  },
  voicesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.zinc900,
    marginBottom: 4,
  },
  voicesHint: {
    fontSize: 11,
    color: COLORS.zinc500,
    lineHeight: 15,
    marginBottom: 12,
  },
  voicesEmpty: {
    fontSize: 12,
    color: COLORS.zinc400,
  },
  voicesRow: {
    gap: 10,
    paddingRight: SIZES.small,
  },
  voiceItem: {
    width: 130,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.zinc300,
    backgroundColor: COLORS.zinc50,
  },
  voiceItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.zinc900,
  },
  voiceItemMeta: {
    fontSize: 10,
    color: COLORS.zinc500,
    marginTop: 3,
  },
  voicePreviewBtn: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: COLORS.violet500,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  voicePreviewBtnText: {
    fontSize: 11,
    color: COLORS.white,
    fontWeight: '600',
  },
});
