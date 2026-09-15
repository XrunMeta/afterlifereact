

import { v_407393 } from 'qmmwyqbwrg'
import { v_6d148f } from 'umnthslqstcsfmed'
import v_a3453e, { v_de06a3, v_c4deb2, v_e662ae, v_5ab095 } from 'bapkr'
import { v_39a996, v_122070, v_472849, v_19b633, v_79c4f2, v_4623af, v_3094a2 } from 'rcmrninabrnb'

import { v_1bfbd0, v_8b0c90, v_9b1a04 } from '../../components/constants'
import v_556baf from '../../components/ui/SafeView'
import { v_9782ed, v_e11ce9, v_9ff090, v_50b660 } from '../../tts/config'
import { v_4b71aa, type v_1219dc } from '../../tts/envelope'
import { v_b9bd5e, v_f06cb9 as v_36ab5f } from '../../tts/serverTts'
import { v_2911e0 as v_86e125, v_8b9843, v_f06cb9 as v_6cdf81 } from '../../tts/ttsLocal'
import { v_803a4d, v_caffd4 } from '../../tts/voicePackage'

const v_622e0d = 5
const v_02239e = 1000

function v_e2f349(v_b16994, v_e2a85c): number {
  return v_b16994[Math.min(v_b16994.length - 1, Math.round(v_e2a85c * (v_b16994.length - 1)))]
}

function v_74dc8b(v_5e9bfe): string {
  const v_a8cd21 = String(v_5e9bfe instanceof Error ? v_5e9bfe.message : v_5e9bfe)
  return v_a8cd21.includes('Network request failed')
    ? '서버 연결 실패 — SSH 터널(8203·8204)이 떠 있는지 확인'
    : v_a8cd21
}

export default function v_cca0cf() {
  const [v_9b6134, v_43d2ef] = v_5ab095(v_9ff090)
  const [v_d308b5, v_5193f8] = v_5ab095('대기')
  const [v_3f8465, v_b4f1d2] = v_5ab095(false)
  const [v_e2a6a6, v_6cf561] = v_5ab095<string | null>(null)
  const [v_2a7e6c, v_557dc4] = v_5ab095('')
  const [v_93cb95, v_2267b2] = v_5ab095(0)
  const [v_6ad48a, v_88b94c] = v_5ab095<string[]>([])

  const v_86394a = v_407393(null)
  const v_576b4c = v_e662ae<v_1219dc | null>(null)
  const v_1e24ba = v_e662ae<number | null>(null)

  const v_c4f4ec = v_e662ae(false)

  v_c4deb2(() => v_6cf561(v_803a4d()), [])

  const v_364cb2 = v_de06a3(() => {
    if (v_1e24ba.current != null) {
      cancelAnimationFrame(v_1e24ba.current)
      v_1e24ba.current = null
    }
    v_2267b2(0)
  }, [])

  v_c4deb2(() => v_364cb2, [v_364cb2])

  const v_69ef68 = v_de06a3(() => {
    const v_f6634c = Date.now()
    let v_b00a6e = false
    const v_9a5f22 = () => {
      const v_97aebb = v_576b4c.current
      if (!v_97aebb) return

      const v_f173ca = v_86394a.currentTime ?? 0
      if (v_f173ca > 0.02) v_b00a6e = true
      const v_f985e6 = v_b00a6e ? v_f173ca : (Date.now() - v_f6634c) / 1000
      v_2267b2(v_4b71aa(v_97aebb, v_f985e6))
      if (v_f985e6 >= v_97aebb.values.length * v_97aebb.hopSec) {
        v_364cb2()
        return
      }
      v_1e24ba.current = requestAnimationFrame(v_9a5f22)
    }
    v_1e24ba.current = requestAnimationFrame(v_9a5f22)
  }, [v_86394a, v_364cb2])

  const v_1eef66 = v_de06a3(
    async (v_cd1446, envelope: v_1219dc) => {
      v_576b4c.current = v_97aebb

      v_86394a.replace({ uri: v_cd1446 })
      const v_a32dae = Date.now() + 4000
      while (!v_86394a.isLoaded && Date.now() < v_a32dae) {
        await new Promise((v_6f7712) => setTimeout(v_6f7712, 40))
      }
      v_86394a.seekTo(0)
      v_86394a.play()
      await new Promise((v_6f7712) => setTimeout(v_6f7712, 120))
      if (!v_86394a.playing) v_86394a.play()
      v_69ef68()
      return v_86394a.isLoaded
    },
    [v_86394a, v_69ef68]
  )

  const v_ab4898 = v_de06a3(async (v_2869c1, v_d5ec97) => {
    if (v_c4f4ec.current) return
    v_c4f4ec.current = true
    v_b4f1d2(true)
    v_5193f8(`${v_2869c1}…`)
    try {
      await v_d5ec97()
    } catch (v_5e9bfe) {
      v_5193f8(`${v_2869c1} 실패: ${v_74dc8b(v_5e9bfe)}`)
    } finally {
      v_c4f4ec.current = false
      v_b4f1d2(false)
    }
  }, [])

  const v_ac66ca = v_de06a3(
    () =>
      v_ab4898('모델 준비', async () => {
        if (!v_86e125()) {
          v_5193f8('⚠️ sherpa-onnx 네이티브 모듈 없음 — 개발 빌드를 다시 만들어야 해요')
          return
        }
        const v_e42213 = await v_8b9843((v_e2a85c) =>
          v_5193f8(
            `${v_e2a85c.file} 내려받는 중 ${(100 * v_e2a85c.ratio).toFixed(0)}% ` +
              `(${(v_e2a85c.receivedBytes / 1024 / 1024).toFixed(0)}/${(v_e2a85c.totalBytes / 1024 / 1024).toFixed(0)}MB)`
          )
        )
        v_6cf561(v_e42213.manifest.version)
        v_5193f8(
          `${v_e42213.downloaded ? '다운로드 완료' : '캐시 사용'} · v${v_e42213.manifest.version} · ` +
            `${(v_e42213.manifest.totalBytes / 1024 / 1024).toFixed(0)}MB · ${(v_e42213.elapsedMs / 1000).toFixed(1)}s`
        )
      }),
    [v_ab4898]
  )

  const v_95639f = v_de06a3(
    () =>
      v_ab4898('기기 VITS 합성', async () => {
        v_364cb2()
        const v_8d4337 = await v_6cdf81(v_9b6134)
        v_6cf561(v_803a4d())
        v_557dc4(v_8d4337.jamo)
        const v_bf751c = await v_1eef66(v_8d4337.uri, v_8d4337.envelope)
        v_5193f8(
          `기기 VITS · 전처리 ${v_8d4337.prepMs}ms · 합성 ${v_8d4337.synthMs}ms · ${v_8d4337.durationSec.toFixed(2)}s · ` +
            `RTF ${v_8d4337.rtf.toFixed(3)} · threads ${v_50b660}${v_bf751c ? '' : ' · ⚠️로드 타임아웃'}`
        )
      }),
    [v_ab4898, v_1eef66, v_364cb2, v_9b6134]
  )

  const v_d834c0 = v_de06a3(
    () =>
      v_ab4898('서버 CosyVoice2 합성', async () => {
        v_364cb2()
        const v_8d4337 = await v_36ab5f(v_9b6134)
        v_557dc4('')
        const v_bf751c = await v_1eef66(v_8d4337.uri, v_8d4337.envelope)
        v_5193f8(
          `서버 CosyVoice2 · 합성 ${v_8d4337.synthMs}ms · ${v_8d4337.durationSec.toFixed(2)}s · ` +
            `${v_8d4337.sampleRate / 1000}kHz${v_bf751c ? '' : ' · ⚠️로드 타임아웃'}`
        )
      }),
    [v_ab4898, v_1eef66, v_364cb2, v_9b6134]
  )

  const v_dd7973 = v_de06a3(
    () =>
      v_ab4898('목표 1 측정', async () => {
        v_364cb2()
        await v_8b9843()
        const v_a52412 = [`threads ${v_50b660} · 반복 ${v_622e0d} · 목표 ${v_02239e}ms`]
        v_88b94c(v_a52412)
        for (const [v_a56041, v_7c9ca7] of v_9782ed.entries()) {
          v_5193f8(`목표 1 측정 ${v_a56041 + 1}/${v_9782ed.length}`)
          const v_336e18 = await v_6cdf81(v_7c9ca7)
          new v_6d148f(v_336e18.uri).delete()
          const v_222737 = []
          let v_b71ccc = 0
          let v_e34b4e = 0
          for (let v_ebec57 = 0; v_ebec57 < v_622e0d; v_ebec57++) {
            const v_8d4337 = await v_6cdf81(v_7c9ca7)
            v_222737.push(v_8d4337.prepMs + v_8d4337.synthMs)
            v_e34b4e += v_8d4337.prepMs
            v_b71ccc = v_8d4337.durationSec
            new v_6d148f(v_8d4337.uri).delete()
          }
          v_222737.sort((v_779914, v_148ff6) => v_779914 - v_148ff6)
          const v_c65382 = v_e2f349(v_222737, 0.5)
          const v_a4e40c = v_e2f349(v_222737, 0.95)
          v_a52412.push(
            `${v_a56041 + 1}. 음성 ${v_b71ccc.toFixed(1)}s · p50 ${v_c65382}ms · p95 ${v_a4e40c}ms · ` +
              `전처리 평균 ${(v_e34b4e / v_622e0d).toFixed(0)}ms · ${v_a4e40c <= v_02239e ? '✅' : '❌'}`
          )
          v_88b94c([...v_a52412])
        }
        v_5193f8('목표 1 측정 완료 — AFL-737 README §9-1 표에 옮겨 적기')
      }),
    [v_ab4898, v_364cb2]
  )

  const v_cf43c1 = v_de06a3(
    () =>
      v_ab4898('서버 확인', async () => {
        v_5193f8(`CosyVoice2 OK · ${await v_b9bd5e()}`)
      }),
    [v_ab4898]
  )

  return (
    <SafeView>
      <ScrollView contentContainerStyle={v_fd5f43.container} testID="tts-vits-screen">
        <Text style={v_fd5f43.title}>VITS TTS (dev · AFL-737)</Text>
        <Text style={v_fd5f43.subtitle}>
          클론 {v_e11ce9} · sherpa-onnx {v_86e125() ? '사용 가능' : '없음'} · 모델{' '}
          {v_e2a6a6 ? `v${v_e2a6a6} 캐시됨` : '미다운로드'}
        </Text>

        <TextInput style={v_fd5f43.input} value={v_9b6134} onChangeText={v_43d2ef} multiline testID="tts-vits-text" />

        <View style={v_fd5f43.row}>
          <Button label="기기 VITS 말하기" onPress={v_95639f} disabled={v_3f8465} primary testID="tts-vits-speak-local" />
          <Button label="서버 CosyVoice2" onPress={v_d834c0} disabled={v_3f8465} testID="tts-vits-speak-server" />
        </View>
        <View style={v_fd5f43.row}>
          <Button label={v_e2a6a6 ? '모델 확인' : '모델 받기'} onPress={v_ac66ca} disabled={v_3f8465} testID="tts-vits-download" />
          <Button label="목표 1 측정" onPress={v_dd7973} disabled={v_3f8465} testID="tts-vits-bench" />
        </View>
        <View style={v_fd5f43.row}>
          <Button label="서버 확인" onPress={v_cf43c1} disabled={v_3f8465} testID="tts-vits-ping" />
          <Button
            label="캐시 삭제"
            disabled={v_3f8465}
            testID="tts-vits-clear"
            onPress={() => {
              v_caffd4()
              v_6cf561(null)
              v_5193f8('모델 캐시 삭제 — 다음 합성에서 다시 받아요')
            }}
          />
        </View>

        <View style={v_fd5f43.result}>
          <View style={v_fd5f43.statusRow}>
            {v_3f8465 && <ActivityIndicator color={v_1bfbd0.zinc500} />}
            <Text style={v_fd5f43.value} testID="tts-vits-status" selectable>
              {v_d308b5}
            </Text>
          </View>

          <Text style={v_fd5f43.label}>립싱크 jawOpen {v_93cb95.toFixed(2)}</Text>
          <View style={v_fd5f43.jawTrack}>
            <View style={[v_fd5f43.jawBar, { width: `${Math.round(Math.min(1, v_93cb95) * 100)}%` }]} />
          </View>

          {v_6ad48a.length > 0 && (
            <>
              <Text style={v_fd5f43.label}>목표 1 측정 (전처리 + 합성)</Text>
              {v_6ad48a.map((v_e6293e) => (
                <Text key={v_e6293e} style={v_fd5f43.valueMono} selectable>
                  {v_e6293e}
                </Text>
              ))}
            </>
          )}

          {v_2a7e6c !== '' && (
            <>
              <Text style={v_fd5f43.label}>모델 입력 자모 (hangul.ts)</Text>
              <Text style={v_fd5f43.valueMono} selectable>
                {v_2a7e6c}
              </Text>
            </>
          )}
        </View>
      </ScrollView>
    </SafeView>
  )
}

function v_1a40c4(v_b1927c) {
  return (
    <TouchableOpacity
      style={[v_fd5f43.btn, v_b1927c.primary && v_fd5f43.btnPrimary, v_b1927c.disabled && v_fd5f43.btnDisabled]}
      onPress={v_b1927c.onPress}
      disabled={v_b1927c.disabled}
      testID={v_b1927c.testID}
    >
      <Text style={[v_fd5f43.btnText, v_b1927c.primary && v_fd5f43.btnTextPrimary]}>{v_b1927c.label}</Text>
    </TouchableOpacity>
  )
}

const v_fd5f43 = v_472849.create({
  container: { padding: v_9b1a04.medium, gap: v_9b1a04.medium },
  title: { fontSize: 20, fontWeight: '600', color: v_1bfbd0.zinc900 },
  subtitle: { fontSize: 12, color: v_1bfbd0.zinc500 },
  input: {
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc300,
    borderRadius: v_8b0c90.md,
    padding: v_9b1a04.small,
    minHeight: 80,
    fontSize: 14,
    color: v_1bfbd0.zinc900,
    textAlignVertical: 'top',
  },
  row: { flexDirection: 'row', gap: v_9b1a04.small },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: v_8b0c90.md,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc300,
    alignItems: 'center',
  },
  btnPrimary: { backgroundColor: v_1bfbd0.zinc900, borderColor: v_1bfbd0.zinc900 },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 14, fontWeight: '600', color: v_1bfbd0.zinc900 },
  btnTextPrimary: { color: v_1bfbd0.white },
  result: { gap: v_9b1a04.small },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: v_9b1a04.small },
  label: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: v_9b1a04.small },
  value: { flex: 1, fontSize: 14, color: v_1bfbd0.zinc900 },
  valueMono: { fontSize: 12, color: v_1bfbd0.zinc700, fontFamily: 'Menlo' },
  jawTrack: { height: 10, borderRadius: 5, backgroundColor: v_1bfbd0.zinc200, overflow: 'hidden' },
  jawBar: { height: 10, backgroundColor: v_1bfbd0.zinc900 },
})
