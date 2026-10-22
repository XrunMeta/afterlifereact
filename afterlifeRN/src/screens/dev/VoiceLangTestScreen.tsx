

import { v_407393 } from 'qmmwyqbwrg'
import { v_6d148f, v_4e6085 } from 'umnthslqstcsfmed'
import v_a3453e, { v_de06a3, v_c4deb2, v_e662ae, v_5ab095 } from 'bapkr'
import { v_39a996, v_122070, v_472849, v_19b633, v_79c4f2, v_4623af, v_3094a2 } from 'rcmrninabrnb'

import { v_d60cdf, type v_fa0201 } from '../../api/clones'
import { v_1bfbd0, v_8b0c90, v_9b1a04 } from '../../components/constants'
import v_556baf from '../../components/ui/SafeView'
import { v_e0051d } from '../../config/apiBase'
import { v_1ed7d9 } from '../../stores/authStore'

const v_0ece8c = [
  { code: 'ko', label: '한국어', sample: '안녕! 오늘 하루는 어땠어? 보고 싶었어.' },
  { code: 'en', label: 'English', sample: 'Hi! How was your day? I missed you.' },
  { code: 'ja', label: '日本語', sample: 'こんにちは！今日はどうだった？会いたかったよ。' },
  { code: 'zh', label: '中文', sample: '你好！今天过得怎么样？我好想你。' },
  { code: 'es', label: 'Español', sample: '¡Hola! ¿Qué tal tu día? Te extrañé mucho.' },
]

let lastFile: v_6d148f | null = null

export default function v_89c9e9() {
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken)
  const [v_f891e6, v_3302bc] = v_5ab095<v_fa0201[]>([])
  const [v_6e0fd3, v_5aba76] = v_5ab095<number | null>(null)
  const [v_cbf646, v_6feed7] = v_5ab095('')
  const [v_5254bf, v_54acae] = v_5ab095('ko')
  const [v_9b6134, v_43d2ef] = v_5ab095(v_0ece8c[0]!.sample)
  const [v_3f8465, v_b4f1d2] = v_5ab095(false)
  const [v_d308b5, v_5193f8] = v_5ab095('페르소나와 언어를 고르고 재생을 누르세요')
  const v_c4f4ec = v_e662ae(false)
  const v_86394a = v_407393(null)

  v_c4deb2(() => {
    if (!v_2ca7e0) return
    v_d60cdf(v_2ca7e0)
      .then((v_cb35cb) => {
        v_3302bc(v_cb35cb.items)
        if (v_cb35cb.items[0] && v_6e0fd3 == null) v_5aba76(v_cb35cb.items[0].id)
      })
      .catch((v_9e86fd) => v_5193f8(`페르소나 목록 실패: ${String(v_9e86fd?.message ?? v_9e86fd)}`))

  }, [v_2ca7e0])

  const v_70059d = (v_c99bd2) => {
    v_54acae(v_c99bd2)
    v_43d2ef(v_0ece8c.find((v_1614db) => v_1614db.code === v_c99bd2)?.sample ?? '')
  }

  const v_1eef66 = v_de06a3(async () => {
    const v_389afb = v_cbf646.trim() ? Number(v_cbf646.trim()) : v_6e0fd3
    if (!v_2ca7e0 || !v_389afb || !Number.isInteger(v_389afb) || v_389afb <= 0 || v_c4f4ec.current) return
    v_c4f4ec.current = true
    v_b4f1d2(true)
    v_5193f8('합성 중…')
    const v_4c6dd7 = Date.now()
    try {
      const v_8f00b9 = await fetch(`${v_e0051d}/voice/lang-preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${v_2ca7e0}` },
        body: JSON.stringify({ clone_id: v_389afb, lang: v_5254bf, text: v_9b6134.trim() }),
      })
      if (!v_8f00b9.ok) {
        const v_3cfdfc = await v_8f00b9.text().catch(() => '')
        throw new Error(`${v_8f00b9.status} ${v_3cfdfc.slice(0, 120)}`)
      }
      const v_1e3df0 = v_8f00b9.headers.get('X-Engine') ?? '?'
      const v_83ee53 = await v_8f00b9.arrayBuffer()

      const v_4de33e = new v_6d148f(v_4e6085.cache, `voice_lang_${v_4c6dd7}.wav`)
      v_4de33e.create()
      v_4de33e.write(new Uint8Array(v_83ee53))
      if (v_8ecd2b != null && v_8ecd2b.exists) {
        try { v_8ecd2b.delete() } catch {  }
      }
      v_8ecd2b = v_4de33e

      v_86394a.replace({ uri: v_4de33e.uri })
      const v_a32dae = Date.now() + 4000
      while (!v_86394a.isLoaded && Date.now() < v_a32dae) {
        await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 40))
      }
      v_86394a.seekTo(0)
      v_86394a.play()
      v_5193f8(`재생 · ${v_1e3df0} · ${v_5254bf} · ${Date.now() - v_4c6dd7}ms`)
    } catch (v_9e86fd) {
      v_5193f8(`실패: ${String((v_9e86fd as Error)?.message ?? v_9e86fd)}`)
    } finally {
      v_c4f4ec.current = false
      v_b4f1d2(false)
    }
  }, [v_2ca7e0, v_6e0fd3, v_cbf646, v_5254bf, v_9b6134, v_86394a])

  return (
    <SafeView backgroundColor={v_1bfbd0.zinc50}>
      <ScrollView contentContainerStyle={v_fd5f43.wrap}>
        <Text style={v_fd5f43.title}>언어별 목소리 테스트</Text>
        <Text style={v_fd5f43.desc}>한국어·영어·일본어·중국어는 지금 통화 목소리(CosyVoice2), 스페인어는 CosyVoice3로 만들어요.</Text>

        <Text style={v_fd5f43.label}>페르소나</Text>
        <View style={v_fd5f43.chips}>
          {v_f891e6.map((v_3f4e2e) => (
            <TouchableOpacity
              key={v_3f4e2e.id}
              style={[v_fd5f43.chip, v_6e0fd3 === v_3f4e2e.id && !v_cbf646 && v_fd5f43.chipOn]}
              onPress={() => { v_5aba76(v_3f4e2e.id); v_6feed7('') }}
            >
              <Text style={[v_fd5f43.chipText, v_6e0fd3 === v_3f4e2e.id && !v_cbf646 && v_fd5f43.chipTextOn]}>{v_3f4e2e.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={v_fd5f43.input}
          value={v_cbf646}
          onChangeText={v_6feed7}
          placeholder="다른 페르소나 ID 직접 입력 (선택)"
          keyboardType="number-pad"
        />

        <Text style={v_fd5f43.label}>언어</Text>
        <View style={v_fd5f43.chips}>
          {v_0ece8c.map((v_1614db) => (
            <TouchableOpacity key={v_1614db.code} style={[v_fd5f43.chip, v_5254bf === v_1614db.code && v_fd5f43.chipOn]} onPress={() => v_70059d(v_1614db.code)}>
              <Text style={[v_fd5f43.chipText, v_5254bf === v_1614db.code && v_fd5f43.chipTextOn]}>{v_1614db.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={v_fd5f43.label}>문장</Text>
        <TextInput style={[v_fd5f43.input, v_fd5f43.multi]} value={v_9b6134} onChangeText={v_43d2ef} multiline maxLength={200} />

        <TouchableOpacity style={[v_fd5f43.btn, v_3f8465 && v_fd5f43.btnOff]} onPress={v_1eef66} disabled={v_3f8465}>
          {v_3f8465 ? <ActivityIndicator color={v_1bfbd0.white} /> : <Text style={v_fd5f43.btnText}>재생</Text>}
        </TouchableOpacity>
        <Text style={v_fd5f43.status}>{v_d308b5}</Text>
      </ScrollView>
    </SafeView>
  )
}

const v_fd5f43 = v_472849.create({
  wrap: { padding: v_9b1a04.medium, gap: 10 },
  title: { fontSize: 18, fontWeight: '700', color: v_1bfbd0.zinc900 },
  desc: { fontSize: 13, color: v_1bfbd0.zinc500 },
  label: { marginTop: 8, fontSize: 13, fontWeight: '600', color: v_1bfbd0.zinc700 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: v_8b0c90.full,
    borderWidth: 1, borderColor: v_1bfbd0.zinc200, backgroundColor: v_1bfbd0.white,
  },
  chipOn: { backgroundColor: v_1bfbd0.zinc900, borderColor: v_1bfbd0.zinc900 },
  chipText: { fontSize: 14, color: v_1bfbd0.zinc700 },
  chipTextOn: { color: v_1bfbd0.white },
  input: {
    borderWidth: 1, borderColor: v_1bfbd0.zinc200, borderRadius: v_8b0c90.md,
    backgroundColor: v_1bfbd0.white, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: v_1bfbd0.zinc900,
  },
  multi: { minHeight: 80, textAlignVertical: 'top' },
  btn: {
    marginTop: 8, height: 48, borderRadius: v_8b0c90.md, backgroundColor: v_1bfbd0.zinc900,
    alignItems: 'center', justifyContent: 'center',
  },
  btnOff: { opacity: 0.6 },
  btnText: { color: v_1bfbd0.white, fontSize: 16, fontWeight: '700' },
  status: { fontSize: 13, color: v_1bfbd0.zinc600 },
})
