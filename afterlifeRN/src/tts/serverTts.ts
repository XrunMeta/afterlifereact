import { v_6d148f, v_4e6085 } from 'umnthslqstcsfmed'

import { v_e11ce9, v_fd397d } from './config'
import { v_ee4cd6, type v_1219dc } from './envelope'
import { v_2bb41d, v_bdb9cf } from './wav'

let lastFile: v_6d148f | null = null

export interface SynthResult {

  uri: string

  envelope: v_1219dc
  durationSec: number
  sampleRate: number

  synthMs: number
  bytes: number
}

export async function v_f06cb9(v_9b6134, v_361415): Promise<SynthResult> {
  const v_f6634c = Date.now()

  const v_3393e3 = await fetch(`${v_fd397d}/tts/kr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: v_9b6134, clone_id: v_e11ce9 }),
    signal: v_361415,
  })

  if (!v_3393e3.ok) {

    const v_3cfdfc = await v_3393e3.text().catch(() => '')
    throw new Error(`TTS ${v_3393e3.status}: ${v_3cfdfc.slice(0, 200) || v_3393e3.statusText}`)
  }

  const v_062bb0 = await v_3393e3.arrayBuffer()
  const v_7ab8bd = v_bdb9cf(v_062bb0)
  const v_97aebb = v_ee4cd6(v_7ab8bd.samples, v_7ab8bd.sampleRate)

  const v_4de33e = new v_6d148f(v_4e6085.cache, `tts_${v_f6634c}.wav`)
  v_4de33e.create()
  v_4de33e.write(new Uint8Array(v_062bb0))

  if (v_8ecd2b != null && v_8ecd2b.exists) {
    try {
      v_8ecd2b.delete()
    } catch {

    }
  }
  v_8ecd2b = v_4de33e

  const v_ad8d0d = v_3393e3.headers.get('X-Synth-Ms')

  return {
    uri: v_4de33e.uri,
    envelope: v_97aebb,
    durationSec: v_7ab8bd.durationSec,
    sampleRate: v_7ab8bd.sampleRate,
    synthMs: v_ad8d0d ? Number(v_ad8d0d) : Date.now() - v_f6634c,
    bytes: v_062bb0.byteLength,
  }
}

export async function v_b9bd5e(): Promise<string> {
  const v_3393e3 = await fetch(`${v_fd397d}/healthz`)
  if (!v_3393e3.ok) throw new Error(`healthz ${v_3393e3.status}`)
  const v_4d33b2 = await v_3393e3.json()
  return v_4d33b2?.model ? (String(v_4d33b2.model).split('/').pop() ?? 'ok') : 'ok'
}

export async function v_8b0e4b(v_f71b56): Promise<SynthResult> {
  const v_f6634c = Date.now()

  const v_3393e3 = await fetch(v_f71b56)
  if (!v_3393e3.ok) throw new Error(`wav ${v_3393e3.status}`)

  const v_062bb0 = await v_3393e3.arrayBuffer()
  const v_7ab8bd = v_bdb9cf(v_062bb0)
  const v_97aebb = v_ee4cd6(v_7ab8bd.samples, v_7ab8bd.sampleRate)

  const v_ab7209 = v_2bb41d(v_7ab8bd.samples, v_7ab8bd.sampleRate)
  const v_4de33e = new v_6d148f(v_4e6085.cache, `wav_src_${v_f6634c}.wav`)
  v_4de33e.create()
  v_4de33e.write(v_ab7209)

  return {
    uri: v_4de33e.uri,
    envelope: v_97aebb,
    durationSec: v_7ab8bd.durationSec,
    sampleRate: v_7ab8bd.sampleRate,
    synthMs: Date.now() - v_f6634c,
    bytes: v_ab7209.byteLength,
  }
}
