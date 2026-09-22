

import { v_de5c00, v_6d148f, v_4e6085 } from 'umnthslqstcsfmed'

import { v_e11ce9, v_c83945 } from './config'

export interface VoiceManifest {
  cloneId: string
  version: string
  sampleRate: number
  modelFile: string
  tokensFile: string
  modelType: string
  needsEspeakData: boolean
  files: { name: string; size: number; sha256: string }[]
  totalBytes: number
  note?: string
}

export interface VoicePackage {
  manifest: VoiceManifest

  modelDir: string
  modelPath: string
  tokensPath: string

  downloaded: boolean
  elapsedMs: number
}

export interface DownloadProgress {
  file: string
  receivedBytes: number
  totalBytes: number
  ratio: number
}

function v_7001bd(v_6e0fd3): v_de5c00 {
  return new v_de5c00(v_4e6085.document, 'voices', v_6e0fd3)
}

function v_68ef0f(v_6e0fd3): v_6d148f {
  return new v_6d148f(v_7001bd(v_6e0fd3), 'manifest.json')
}

export async function v_a58650(): Promise<string[]> {
  const v_3393e3 = await fetch(`${v_c83945}/healthz`)
  if (!v_3393e3.ok) throw new Error(`healthz ${v_3393e3.status}`)
  const v_4d33b2 = (await v_3393e3.json()) as { voices?: string[] }
  return v_4d33b2.voices ?? []
}

export interface VoiceSourceOptions {
  manifestUrl?: string | null
  filesBaseUrl?: string | null
  accessToken?: string | null
}

function v_b90e6c(v_2ca7e0): Record<string, string> {
  return v_2ca7e0 ? { Authorization: `Bearer ${v_2ca7e0}` } : {}
}

export async function v_fef4d7(v_6e0fd3 = v_e11ce9, v_04e790): Promise<VoiceManifest> {
  const v_f71b56 = v_04e790?.manifestUrl ?? `${v_c83945}/voices/${v_6e0fd3}/manifest.json`
  const v_3393e3 = await fetch(v_f71b56, { headers: v_b90e6c(v_04e790?.accessToken) })
  if (!v_3393e3.ok) throw new Error(`manifest ${v_3393e3.status}`)
  return (await v_3393e3.json()) as VoiceManifest
}

function v_dbae8b(v_04e790, v_6e0fd3): string {
  if (v_04e790?.filesBaseUrl) return v_04e790.filesBaseUrl.replace(/\/$/, '')
  if (v_04e790?.manifestUrl) return v_04e790.manifestUrl.replace(/\/manifest\.json$/, '')
  return `${v_c83945}/voices/${v_6e0fd3}`
}

function v_49774a(v_88e564): boolean {
  try {
    const v_c67510 = v_68ef0f(v_88e564.cloneId)
    if (!v_c67510.exists) return false

    const v_e2a6a6 = JSON.parse(v_c67510.textSync()) as VoiceManifest
    if (v_e2a6a6.version !== v_88e564.version) return false

    for (const v_2b8338 of v_88e564.files) {
      const v_4de33e = new v_6d148f(v_7001bd(v_88e564.cloneId), v_2b8338.name)
      if (!v_4de33e.exists) return false

      if ((v_4de33e.size ?? 0) !== v_2b8338.size) return false
    }
    return true
  } catch {
    return false
  }
}

export async function v_e786af(
  v_94c617,
  v_6e0fd3 = v_e11ce9,
  v_04e790
): Promise<VoicePackage> {
  const v_f6634c = Date.now()
  const v_b7cff2 = v_7001bd(v_6e0fd3)
  const v_1f00b4 = v_dbae8b(v_04e790, v_6e0fd3)
  const v_6d219b = v_b90e6c(v_04e790?.accessToken)

  let v_88e564
  let v_b2caa3 = false
  try {
    v_88e564 = await v_fef4d7(v_6e0fd3, v_04e790)
  } catch (v_5e9bfe) {
    const v_c67510 = v_68ef0f(v_6e0fd3)
    if (!v_c67510.exists) throw v_5e9bfe
    v_88e564 = JSON.parse(v_c67510.textSync()) as VoiceManifest
    v_b2caa3 = true
  }

  if (v_b2caa3) {

    if (!v_49774a(v_88e564)) throw new Error('오프라인인데 캐시가 온전하지 않다')
    const v_e29566 = v_b7cff2.uri.replace('file://', '').replace(/\/$/, '')
    return {
      manifest: v_88e564,
      modelDir: v_e29566,
      modelPath: `${v_e29566}/${v_88e564.modelFile}`,
      tokensPath: `${v_e29566}/${v_88e564.tokensFile}`,
      downloaded: false,
      elapsedMs: Date.now() - v_f6634c,
    }
  }

  const v_807c28 = (v_b71f3d): VoicePackage => {
    const v_e29566 = v_b7cff2.uri.replace('file://', '').replace(/\/$/, '')
    return {
      manifest: v_88e564,
      modelDir: v_e29566,
      modelPath: `${v_e29566}/${v_88e564.modelFile}`,
      tokensPath: `${v_e29566}/${v_88e564.tokensFile}`,
      downloaded: v_b71f3d,
      elapsedMs: Date.now() - v_f6634c,
    }
  }

  if (v_49774a(v_88e564)) return v_807c28(false)

  if (v_b7cff2.exists) v_b7cff2.delete()
  v_b7cff2.create({ intermediates: true })

  for (const v_2b8338 of v_88e564.files) {
    const v_f71b56 = `${v_1f00b4}/${v_2b8338.name}`

    v_94c617?.({
      file: v_2b8338.name,
      receivedBytes: 0,
      totalBytes: v_2b8338.size,
      ratio: 0,
    })
    await v_6d148f.downloadFileAsync(v_f71b56, new v_6d148f(v_b7cff2, v_2b8338.name), {
      headers: v_6d219b,
    })
    v_94c617?.({
      file: v_2b8338.name,
      receivedBytes: v_2b8338.size,
      totalBytes: v_2b8338.size,
      ratio: 1,
    })

    const v_745f8c = new v_6d148f(v_b7cff2, v_2b8338.name).size ?? 0
    if (v_745f8c !== v_2b8338.size) {
      throw new Error(`${v_2b8338.name} 크기 불일치: 받은 ${v_745f8c} vs 기대 ${v_2b8338.size}`)
    }
  }

  const v_c67510 = v_68ef0f(v_6e0fd3)
  v_c67510.create()
  v_c67510.write(JSON.stringify(v_88e564))

  return v_807c28(true)
}

export function v_caffd4(v_6e0fd3 = v_e11ce9): void {
  const v_b7cff2 = v_7001bd(v_6e0fd3)
  if (v_b7cff2.exists) v_b7cff2.delete()
}

export function v_803a4d(v_6e0fd3 = v_e11ce9): string | null {
  try {
    const v_c67510 = v_68ef0f(v_6e0fd3)
    if (!v_c67510.exists) return null
    return (JSON.parse(v_c67510.textSync()) as VoiceManifest).version
  } catch {
    return null
  }
}
