

import { v_6d148f, v_4e6085 } from 'umnthslqstcsfmed'

import { v_50b660 } from './config'
import { v_ee4cd6, type v_1219dc } from './envelope'
import { v_c99bc7, v_51b50b } from './hangul'
import { v_2bb41d, v_bdb9cf } from './wav'
import { v_e786af, type v_d7f057, type v_997669 } from './voicePackage'

export interface LocalSynthResult {
  uri: string
  envelope: v_1219dc
  durationSec: number
  sampleRate: number

  synthMs: number

  rtf: number
  bytes: number

  prepMs: number

  jamo: string
}

type SherpaModule = {
  TTS: {
    initialize(config: Record<string, unknown>): Promise<{ success?: boolean } | undefined>
    generateSpeech(
      text: string,
      options: Record<string, unknown>
    ): Promise<{ success?: boolean; filePath?: string } | undefined>
    release?(): Promise<unknown>
  }
}

let v_dccb8a
let v_a29164 = null

function v_b5875f(): SherpaModule | null {
  if (v_dccb8a !== undefined) return v_dccb8a
  try {

    v_dccb8a = require('jpefyaqacrtszzlrntnuem') as SherpaModule
  } catch {
    v_dccb8a = null
  }
  return v_dccb8a
}

export function v_2911e0(): boolean {
  return v_b5875f() != null
}

export async function v_8b9843(
  onProgress?: (progress: v_d7f057) => void
): Promise<v_997669> {
  const v_e42213 = await v_e786af(v_94c617)

  const v_8fc3e4 = v_b5875f()
  if (!v_8fc3e4) throw new Error('sherpa-onnx 네이티브 모듈 없음 (개발 빌드 재생성 필요)')

  if (v_a29164 === v_e42213.manifest.version) return v_e42213

  const v_43c42e = await v_8fc3e4.TTS.initialize({
    modelDir: v_e42213.modelDir,

    modelFile: v_e42213.manifest.modelFile,
    tokensFile: v_e42213.manifest.tokensFile,

    dataDir: '',
    ttsModelType: v_e42213.manifest.modelType,
    numThreads: v_50b660,
    debug: false,
  })

  if (v_43c42e?.success === false) throw new Error('sherpa-onnx 초기화 실패')
  v_a29164 = v_e42213.manifest.version
  return v_e42213
}

export async function v_f06cb9(v_9b6134, v_d93ca3 = 1.0): Promise<LocalSynthResult> {
  const v_8fc3e4 = v_b5875f()
  if (!v_8fc3e4) throw new Error('sherpa-onnx 네이티브 모듈 없음')

  await v_8b9843()
  const v_f75c8d = Date.now()
  const v_2a7e6c = v_c99bc7(v_9b6134)
  const v_73a91c = Date.now() - v_f75c8d

  const v_266752 = v_51b50b(v_2a7e6c)
  if (v_266752.length) {

    console.warn('[ttsLocal] 모델 심볼 밖 문자:', v_266752.join(''))
  }

  const v_f6634c = Date.now()

  const v_8d4337 = await v_8fc3e4.TTS.generateSpeech(v_2a7e6c, {
    speakerId: 0,
    speakingRate: v_d93ca3,

    playAudio: false,
  })
  const v_3691b5 = Date.now() - v_f6634c

  if (!v_8d4337?.filePath) throw new Error('온디바이스 합성 실패 (filePath 없음)')

  const v_4de33e = new v_6d148f(v_8d4337.filePath.startsWith('file://') ? v_8d4337.filePath : `file://${v_8d4337.filePath}`)
  const v_062bb0 = v_4de33e.bytesSync()
  const v_7ab8bd = v_bdb9cf(v_062bb0.buffer.slice(v_062bb0.byteOffset, v_062bb0.byteOffset + v_062bb0.byteLength) as ArrayBuffer)
  const v_97aebb = v_ee4cd6(v_7ab8bd.samples, v_7ab8bd.sampleRate)

  const v_ab7209 = v_2bb41d(v_7ab8bd.samples, v_7ab8bd.sampleRate)
  const v_5f5d6d = new v_6d148f(v_4e6085.cache, `tts_local_${v_f6634c}.wav`)
  v_5f5d6d.create()
  v_5f5d6d.write(v_ab7209)

  return {
    uri: v_5f5d6d.uri,
    envelope: v_97aebb,
    durationSec: v_7ab8bd.durationSec,
    sampleRate: v_7ab8bd.sampleRate,
    synthMs: v_3691b5,
    rtf: v_3691b5 / 1000 / Math.max(v_7ab8bd.durationSec, 1e-6),
    bytes: v_ab7209.byteLength,
    jamo: v_2a7e6c,
    prepMs: v_73a91c,
  }
}
