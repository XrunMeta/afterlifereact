

import { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { COLORS, SIZES, RADIUS } from '../../components/constants';
import SafeView from '../../components/ui/SafeView';
import { createG2p } from '../../text/g2pk-js';
import { toCompat } from '../../text/g2pk-js/jamo';

const VOCAB: Record<string, number> = {
  '_': 0, ',': 1, '.': 2, '!': 3, '?': 4, '…': 5, '~': 6,
  'ㄱ': 7, 'ㄴ': 8, 'ㄷ': 9, 'ㄹ': 10, 'ㅁ': 11, 'ㅂ': 12, 'ㅅ': 13, 'ㅇ': 14,
  'ㅈ': 15, 'ㅊ': 16, 'ㅋ': 17, 'ㅌ': 18, 'ㅍ': 19, 'ㅎ': 20,
  'ㄲ': 21, 'ㄸ': 22, 'ㅃ': 23, 'ㅆ': 24, 'ㅉ': 25,
  'ㅏ': 26, 'ㅓ': 27, 'ㅗ': 28, 'ㅜ': 29, 'ㅡ': 30, 'ㅣ': 31,
  'ㅐ': 32, 'ㅔ': 33, ' ': 34,
};

function toVocabIds(phonemes: string): number[] {
  const ids: number[] = [];
  for (const ch of phonemes) {
    const id = VOCAB[ch];
    if (id !== undefined) ids.push(id);

  }
  return ids;
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
  const soundRef = useRef<Audio.Sound | null>(null);

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
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  const handleRun = useCallback(async () => {
    if (!g2pRef.current) {
      setStatus('g2p 미준비');
      return;
    }
    try {
      const start = Date.now();

      setStatus('g2p 실행 중…');
      const raw = g2pRef.current.run(text);
      const compact = toCompat(raw); 
      setPhonemes(compact);
      const ids = toVocabIds(compact);
      const g2pMs = Date.now() - start;

      setStatus('ONNX 로드 · 추론 중… (~130s 초회)');
      const onnxStart = Date.now();
      const { InferenceSession, Tensor } = await import('onnxruntime-react-native');

      const modelUri = require('../../../assets/tts/halbae_9053.onnx');
      const session = await InferenceSession.create(modelUri);

      const xArr = BigInt64Array.from(ids.map((n) => BigInt(n)));
      const xLenArr = BigInt64Array.from([BigInt(ids.length)]);
      const inputs = {
        x: new Tensor('int64', xArr, [1, ids.length]),
        x_lengths: new Tensor('int64', xLenArr, [1]),
        noise_scale: new Tensor('float32', new Float32Array([0.667]), [1]),
        length_scale: new Tensor('float32', new Float32Array([1.0]), [1]),
        noise_scale_w: new Tensor('float32', new Float32Array([0.8]), [1]),
      };

      const output = await session.run(inputs);
      const audioTensor = output.output ?? output.y ?? Object.values(output)[0];
      const audioData = audioTensor.data as Float32Array;
      const onnxMs = Date.now() - onnxStart;

      setStatus('WAV 인코딩 중…');
      const wav = encodeWav(audioData, 44100);
      const wavBase64 = Buffer.from(wav).toString('base64');
      const wavPath = FileSystem.cacheDirectory + `tts_poc_${Date.now()}.wav`;
      await FileSystem.writeAsStringAsync(wavPath, wavBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      setStatus('재생 중…');
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      const { sound } = await Audio.Sound.createAsync({ uri: wavPath });
      soundRef.current = sound;
      await sound.playAsync();

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
});
