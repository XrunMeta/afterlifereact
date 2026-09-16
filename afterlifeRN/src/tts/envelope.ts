

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

const v_aceddb = {
  hopSec: 0.01,
  windowSec: 0.02,
  contrastSec: 0.25,
  noiseFloor: 0.26,
  attackSec: 0.02,
  releaseSec: 0.05,
  gamma: 2.0,
}

export function v_ee4cd6(
  v_5b2623,
  v_c8d4f6,
  v_b36f96 = {}
): Envelope {
  const v_68b2be = { ...v_aceddb, ...v_b36f96 }
  const v_39beaf = Math.max(1, Math.round(v_68b2be.hopSec * v_c8d4f6))
  const v_dd108b = Math.max(v_39beaf, Math.round(v_68b2be.windowSec * v_c8d4f6))
  const v_3b40dd = Math.max(1, Math.ceil(v_5b2623.length / v_39beaf))

  const v_57b82a = new Float32Array(v_3b40dd)
  for (let v_8b5cd8 = 0; v_8b5cd8 < v_3b40dd; v_8b5cd8++) {
    const v_965edf = v_8b5cd8 * v_39beaf
    const v_3b508c = Math.min(v_5b2623.length, v_965edf + v_dd108b)
    let v_dce0a8 = 0
    for (let v_ebec57 = v_965edf; v_ebec57 < v_3b508c; v_ebec57++) v_dce0a8 += v_5b2623[v_ebec57] * v_5b2623[v_ebec57]
    v_57b82a[v_8b5cd8] = v_3b508c > v_965edf ? Math.sqrt(v_dce0a8 / (v_3b508c - v_965edf)) : 0
  }

  const v_edeeb4 = v_e2f349(v_57b82a, 0.95) || 1e-6

  const v_2113ce = v_24e6e1(v_57b82a, Math.max(1, Math.round(v_68b2be.contrastSec / v_68b2be.hopSec)))
  const v_a8f6ab = new Float32Array(v_3b40dd)
  for (let v_8b5cd8 = 0; v_8b5cd8 < v_3b40dd; v_8b5cd8++) {

    v_a8f6ab[v_8b5cd8] = v_57b82a[v_8b5cd8] / (v_2113ce[v_8b5cd8] + v_edeeb4 * 0.08)
  }

  const v_50b626 = v_e2f349(v_a8f6ab, 0.92) || 1
  const v_70cf7e = new Float32Array(v_3b40dd)
  for (let v_8b5cd8 = 0; v_8b5cd8 < v_3b40dd; v_8b5cd8++) {
    const v_825625 = Math.min(1.4, v_a8f6ab[v_8b5cd8] / v_50b626)
    const v_d18ace = v_825625 <= v_68b2be.noiseFloor ? 0 : (v_825625 - v_68b2be.noiseFloor) / (1 - v_68b2be.noiseFloor)
    v_70cf7e[v_8b5cd8] = Math.pow(Math.min(1, Math.max(0, v_d18ace)), v_68b2be.gamma)
  }

  const v_464106 = 1 - Math.exp(-v_68b2be.hopSec / v_68b2be.attackSec)
  const v_4b5fe9 = 1 - Math.exp(-v_68b2be.hopSec / v_68b2be.releaseSec)
  const v_6fea0b = new Float32Array(v_3b40dd)
  let v_ba2215 = 0
  for (let v_8b5cd8 = 0; v_8b5cd8 < v_3b40dd; v_8b5cd8++) {
    const v_5f5d6d = v_70cf7e[v_8b5cd8]
    v_ba2215 += (v_5f5d6d - v_ba2215) * (v_5f5d6d > v_ba2215 ? v_464106 : v_4b5fe9)
    v_6fea0b[v_8b5cd8] = v_ba2215
  }

  return { hopSec: v_68b2be.hopSec, values: v_6fea0b, reference: v_edeeb4 }
}

export function v_4b71aa(v_c9c489, v_653d9c): number {
  if (v_653d9c <= 0 || v_c9c489.values.length === 0) return 0

  const v_9e7a9d = v_653d9c / v_c9c489.hopSec
  const v_ebec57 = Math.floor(v_9e7a9d)

  if (v_ebec57 >= v_c9c489.values.length - 1) return 0

  const v_2bdd01 = v_9e7a9d - v_ebec57
  return v_c9c489.values[v_ebec57] * (1 - v_2bdd01) + v_c9c489.values[v_ebec57 + 1] * v_2bdd01
}

function v_24e6e1(v_6fea0b, v_8e4fb6): Float32Array {
  const v_8d4337 = new Float32Array(v_6fea0b.length)
  const v_c92b92 = Math.floor(v_8e4fb6 / 2)
  let v_dce0a8 = 0
  let v_9e8c70 = 0

  for (let v_ebec57 = 0; v_ebec57 < v_6fea0b.length; v_ebec57++) {
    const v_965edf = Math.max(0, v_ebec57 - v_c92b92)
    const v_3b508c = Math.min(v_6fea0b.length - 1, v_ebec57 + v_c92b92)
    if (v_ebec57 === 0) {
      for (let v_b75e36 = v_965edf; v_b75e36 <= v_3b508c; v_b75e36++) v_dce0a8 += v_6fea0b[v_b75e36]
      v_9e8c70 = v_3b508c - v_965edf + 1
    } else {
      const v_68bef9 = Math.max(0, v_ebec57 - 1 - v_c92b92)
      const v_052df1 = Math.min(v_6fea0b.length - 1, v_ebec57 - 1 + v_c92b92)
      if (v_965edf > v_68bef9) {
        v_dce0a8 -= v_6fea0b[v_68bef9]
        v_9e8c70--
      }
      if (v_3b508c > v_052df1) {
        v_dce0a8 += v_6fea0b[v_3b508c]
        v_9e8c70++
      }
    }
    v_8d4337[v_ebec57] = v_9e8c70 > 0 ? v_dce0a8 / v_9e8c70 : 0
  }

  return v_8d4337
}

function v_e2f349(v_d0c056, v_e2a85c): number {
  const v_b16994 = Float32Array.from(v_d0c056).sort()
  const v_e86ad8 = Math.min(v_b16994.length - 1, Math.max(0, Math.round((v_b16994.length - 1) * v_e2a85c)))
  return v_b16994[v_e86ad8]
}
