

export interface WavData {
  sampleRate: number
  channels: number

  samples: Float32Array
  durationSec: number
}

export function parseWav(buffer: ArrayBuffer): WavData {
  const view = new DataView(buffer)

  const riff = readTag(view, 0)
  const wave = readTag(view, 8)
  if (riff !== 'RIFF' || wave !== 'WAVE') {
    throw new Error(`WAV 가 아니다 (tag=${riff}/${wave})`)
  }

  let format = -1
  let channels = 0
  let sampleRate = 0
  let bitsPerSample = 0
  let dataOffset = -1
  let dataLength = 0

  let offset = 12
  while (offset + 8 <= view.byteLength) {
    const id = readTag(view, offset)
    const size = view.getUint32(offset + 4, true)
    const body = offset + 8

    if (id === 'fmt ') {
      format = view.getUint16(body, true)
      channels = view.getUint16(body + 2, true)
      sampleRate = view.getUint32(body + 4, true)
      bitsPerSample = view.getUint16(body + 14, true)
    } else if (id === 'data') {
      dataOffset = body
      dataLength = size
    }

    offset = body + size + (size % 2)
  }

  if (dataOffset < 0) throw new Error('data 청크가 없다')

  const isFloat = format === 3
  const isPcm16 = format === 1 && bitsPerSample === 16
  if (!isFloat && !isPcm16) {
    throw new Error(`지원하지 않는 WAV (format=${format}, bits=${bitsPerSample})`)
  }
  if (isFloat && bitsPerSample !== 32) {
    throw new Error(`32bit float 만 지원 (bits=${bitsPerSample})`)
  }

  const bytesPerSample = bitsPerSample / 8

  const usable = Math.min(dataLength, view.byteLength - dataOffset)
  const frameCount = Math.floor(usable / bytesPerSample / channels)
  const samples = new Float32Array(frameCount)

  for (let i = 0; i < frameCount; i++) {
    let sum = 0
    for (let c = 0; c < channels; c++) {
      const offset = dataOffset + (i * channels + c) * bytesPerSample
      sum += isFloat ? view.getFloat32(offset, true) : view.getInt16(offset, true) / 32768
    }
    samples[i] = sum / channels
  }

  return { sampleRate, channels, samples, durationSec: frameCount / sampleRate }
}

export function encodeWav16(samples: Float32Array, sampleRate: number): Uint8Array {
  const dataBytes = samples.length * 2
  const buffer = new ArrayBuffer(44 + dataBytes)
  const view = new DataView(buffer)

  const writeTag = (offset: number, tag: string) => {
    for (let i = 0; i < tag.length; i++) view.setUint8(offset + i, tag.charCodeAt(i))
  }

  writeTag(0, 'RIFF')
  view.setUint32(4, 36 + dataBytes, true)
  writeTag(8, 'WAVE')
  writeTag(12, 'fmt ')
  view.setUint32(16, 16, true) 
  view.setUint16(20, 1, true) 
  view.setUint16(22, 1, true) 
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true) 
  view.setUint16(32, 2, true) 
  view.setUint16(34, 16, true) 
  writeTag(36, 'data')
  view.setUint32(40, dataBytes, true)

  for (let i = 0; i < samples.length; i++) {

    const clamped = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(44 + i * 2, Math.round(clamped * 32767), true)
  }

  return new Uint8Array(buffer)
}

function readTag(view: DataView, offset: number): string {
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3)
  )
}
