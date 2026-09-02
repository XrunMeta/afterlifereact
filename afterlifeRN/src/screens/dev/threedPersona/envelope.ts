

export interface Envelope {

  hopSec: number

  values: Float32Array

  reference: number
}

export interface EnvelopeOptions {

  hopSec?: number

  windowSec?: number

  contrastSec?: number

  noiseFloor?: number

  attackSec?: number

  releaseSec?: number

  gamma?: number
}

const DEFAULTS: Required<EnvelopeOptions> = {
  hopSec: 0.01,
  windowSec: 0.02,
  contrastSec: 0.25,
  noiseFloor: 0.26,
  attackSec: 0.02,
  releaseSec: 0.05,
  gamma: 2.0,
}

export function buildEnvelope(
  samples: Float32Array,
  sampleRate: number,
  options: EnvelopeOptions = {}
): Envelope {
  const opt = { ...DEFAULTS, ...options }
  const hop = Math.max(1, Math.round(opt.hopSec * sampleRate))
  const window = Math.max(hop, Math.round(opt.windowSec * sampleRate))
  const frames = Math.max(1, Math.ceil(samples.length / hop))

  const rms = new Float32Array(frames)
  for (let f = 0; f < frames; f++) {
    const start = f * hop
    const end = Math.min(samples.length, start + window)
    let sum = 0
    for (let i = start; i < end; i++) sum += samples[i] * samples[i]
    rms[f] = end > start ? Math.sqrt(sum / (end - start)) : 0
  }

  const reference = percentile(rms, 0.95) || 1e-6

  const baseline = movingAverage(rms, Math.max(1, Math.round(opt.contrastSec / opt.hopSec)))
  const contrast = new Float32Array(frames)
  for (let f = 0; f < frames; f++) {

    contrast[f] = rms[f] / (baseline[f] + reference * 0.08)
  }

  const contrastRef = percentile(contrast, 0.92) || 1
  const shaped = new Float32Array(frames)
  for (let f = 0; f < frames; f++) {
    const norm = Math.min(1.4, contrast[f] / contrastRef)
    const gated = norm <= opt.noiseFloor ? 0 : (norm - opt.noiseFloor) / (1 - opt.noiseFloor)
    shaped[f] = Math.pow(Math.min(1, Math.max(0, gated)), opt.gamma)
  }

  const attack = 1 - Math.exp(-opt.hopSec / opt.attackSec)
  const release = 1 - Math.exp(-opt.hopSec / opt.releaseSec)
  const values = new Float32Array(frames)
  let prev = 0
  for (let f = 0; f < frames; f++) {
    const target = shaped[f]
    prev += (target - prev) * (target > prev ? attack : release)
    values[f] = prev
  }

  return { hopSec: opt.hopSec, values, reference }
}

export function sampleEnvelope(env: Envelope, timeSec: number): number {
  if (timeSec <= 0 || env.values.length === 0) return 0

  const pos = timeSec / env.hopSec
  const i = Math.floor(pos)

  if (i >= env.values.length - 1) return 0

  const frac = pos - i
  return env.values[i] * (1 - frac) + env.values[i + 1] * frac
}

function movingAverage(values: Float32Array, width: number): Float32Array {
  const out = new Float32Array(values.length)
  const half = Math.floor(width / 2)
  let sum = 0
  let count = 0

  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - half)
    const end = Math.min(values.length - 1, i + half)
    if (i === 0) {
      for (let j = start; j <= end; j++) sum += values[j]
      count = end - start + 1
    } else {
      const prevStart = Math.max(0, i - 1 - half)
      const prevEnd = Math.min(values.length - 1, i - 1 + half)
      if (start > prevStart) {
        sum -= values[prevStart]
        count--
      }
      if (end > prevEnd) {
        sum += values[end]
        count++
      }
    }
    out[i] = count > 0 ? sum / count : 0
  }

  return out
}

function percentile(arr: Float32Array, p: number): number {
  const sorted = Float32Array.from(arr).sort()
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * p)))
  return sorted[idx]
}
