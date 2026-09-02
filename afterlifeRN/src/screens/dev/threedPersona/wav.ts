

export interface WavData {
  sampleRate: number
  channels: number

  samples: Float32Array
  durationSec: number
}

export function v_bdb9cf(v_062bb0): WavData {
  const v_2836d4 = new DataView(v_062bb0)

  const v_ba5971 = v_e8fb23(v_2836d4, 0)
  const v_729db2 = v_e8fb23(v_2836d4, 8)
  if (v_ba5971 !== 'RIFF' || v_729db2 !== 'WAVE') {
    throw new Error(`WAV 가 아니다 (tag=${v_ba5971}/${v_729db2})`)
  }

  let v_db3cc6 = -1
  let v_1ee60e = 0
  let v_c8d4f6 = 0
  let v_7a6c46 = 0
  let v_de787e = -1
  let v_59b405 = 0

  let v_3bbadf = 12
  while (v_3bbadf + 8 <= v_2836d4.byteLength) {
    const v_389afb = v_e8fb23(v_2836d4, v_3bbadf)
    const v_05b441 = v_2836d4.getUint32(v_3bbadf + 4, true)
    const v_4d33b2 = v_3bbadf + 8

    if (v_389afb === 'fmt ') {
      v_db3cc6 = v_2836d4.getUint16(v_4d33b2, true)
      v_1ee60e = v_2836d4.getUint16(v_4d33b2 + 2, true)
      v_c8d4f6 = v_2836d4.getUint32(v_4d33b2 + 4, true)
      v_7a6c46 = v_2836d4.getUint16(v_4d33b2 + 14, true)
    } else if (v_389afb === 'data') {
      v_de787e = v_4d33b2
      v_59b405 = v_05b441
    }

    v_3bbadf = v_4d33b2 + v_05b441 + (v_05b441 % 2)
  }

  if (v_de787e < 0) throw new Error('data 청크가 없다')

  const v_6367ef = v_db3cc6 === 3
  const v_753033 = v_db3cc6 === 1 && v_7a6c46 === 16
  if (!v_6367ef && !v_753033) {
    throw new Error(`지원하지 않는 WAV (format=${v_db3cc6}, bits=${v_7a6c46})`)
  }
  if (v_6367ef && v_7a6c46 !== 32) {
    throw new Error(`32bit float 만 지원 (bits=${v_7a6c46})`)
  }

  const v_96c145 = v_7a6c46 / 8

  const v_3a5494 = Math.min(v_59b405, v_2836d4.byteLength - v_de787e)
  const v_01ab6d = Math.floor(v_3a5494 / v_96c145 / v_1ee60e)
  const v_5b2623 = new Float32Array(v_01ab6d)

  for (let v_ebec57 = 0; v_ebec57 < v_01ab6d; v_ebec57++) {
    let v_dce0a8 = 0
    for (let v_3f4e2e = 0; v_3f4e2e < v_1ee60e; v_3f4e2e++) {
      const v_3bbadf = v_de787e + (v_ebec57 * v_1ee60e + v_3f4e2e) * v_96c145
      v_dce0a8 += v_6367ef ? v_2836d4.getFloat32(v_3bbadf, true) : v_2836d4.getInt16(v_3bbadf, true) / 32768
    }
    v_5b2623[v_ebec57] = v_dce0a8 / v_1ee60e
  }

  return { sampleRate: v_c8d4f6, channels: v_1ee60e, samples: v_5b2623, durationSec: v_01ab6d / v_c8d4f6 }
}

export function v_2bb41d(v_5b2623, v_c8d4f6): Uint8Array {
  const v_fe09c6 = v_5b2623.length * 2
  const v_062bb0 = new ArrayBuffer(44 + v_fe09c6)
  const v_2836d4 = new DataView(v_062bb0)

  const v_223a7f = (v_3bbadf, v_bd1444) => {
    for (let v_ebec57 = 0; v_ebec57 < v_bd1444.length; v_ebec57++) v_2836d4.setUint8(v_3bbadf + v_ebec57, v_bd1444.charCodeAt(v_ebec57))
  }

  v_223a7f(0, 'RIFF')
  v_2836d4.setUint32(4, 36 + v_fe09c6, true)
  v_223a7f(8, 'WAVE')
  v_223a7f(12, 'fmt ')
  v_2836d4.setUint32(16, 16, true) 
  v_2836d4.setUint16(20, 1, true) 
  v_2836d4.setUint16(22, 1, true) 
  v_2836d4.setUint32(24, v_c8d4f6, true)
  v_2836d4.setUint32(28, v_c8d4f6 * 2, true) 
  v_2836d4.setUint16(32, 2, true) 
  v_2836d4.setUint16(34, 16, true) 
  v_223a7f(36, 'data')
  v_2836d4.setUint32(40, v_fe09c6, true)

  for (let v_ebec57 = 0; v_ebec57 < v_5b2623.length; v_ebec57++) {

    const v_665c62 = Math.max(-1, Math.min(1, v_5b2623[v_ebec57]))
    v_2836d4.setInt16(44 + v_ebec57 * 2, Math.round(v_665c62 * 32767), true)
  }

  return new Uint8Array(v_062bb0)
}

function v_e8fb23(v_2836d4, v_3bbadf): string {
  return String.fromCharCode(
    v_2836d4.getUint8(v_3bbadf),
    v_2836d4.getUint8(v_3bbadf + 1),
    v_2836d4.getUint8(v_3bbadf + 2),
    v_2836d4.getUint8(v_3bbadf + 3)
  )
}
