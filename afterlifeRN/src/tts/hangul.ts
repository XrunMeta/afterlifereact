

const v_e29bd0 = 0xac00
const v_1908e1 = 0xd7a3

const v_741283 = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
]

const v_216318 = [
  'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ',
  'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ',
]

const v_deadb9 = [
  '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ',
  'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
]

const v_2177c5 = {
  'ㅘ': 'ㅗㅏ', 'ㅙ': 'ㅗㅐ', 'ㅚ': 'ㅗㅣ', 'ㅝ': 'ㅜㅓ', 'ㅞ': 'ㅜㅔ',
  'ㅟ': 'ㅜㅣ', 'ㅢ': 'ㅡㅣ', 'ㅑ': 'ㅣㅏ', 'ㅒ': 'ㅣㅐ', 'ㅕ': 'ㅣㅓ',
  'ㅖ': 'ㅣㅔ', 'ㅛ': 'ㅣㅗ', 'ㅠ': 'ㅣㅜ',
}

const v_1f33ed = {
  'ㄳ': 'ㄱㅅ', 'ㄵ': 'ㄴㅈ', 'ㄶ': 'ㄴㅎ', 'ㄺ': 'ㄹㄱ', 'ㄻ': 'ㄹㅁ',
  'ㄼ': 'ㄹㅂ', 'ㄽ': 'ㄹㅅ', 'ㄾ': 'ㄹㅌ', 'ㄿ': 'ㄹㅍ', 'ㅀ': 'ㄹㅎ',
  'ㅄ': 'ㅂㅅ',
}

const v_36d01e = new Set([',', '.', '!', '?', '…', '~'])

export const v_f1d098 = new Set([
  ...'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㄲㄸㅃㅆㅉ',
  ...'ㅏㅓㅗㅜㅡㅣㅐㅔ',
  ' ',
  ...',.!?…~',
])

const v_65f2d0 = {
  'ㄳ': ['ㄱ', 'ㅅ'], 'ㄵ': ['ㄴ', 'ㅈ'], 'ㄶ': ['ㄴ', 'ㅎ'], 'ㄺ': ['ㄹ', 'ㄱ'],
  'ㄻ': ['ㄹ', 'ㅁ'], 'ㄼ': ['ㄹ', 'ㅂ'], 'ㄽ': ['ㄹ', 'ㅅ'], 'ㄾ': ['ㄹ', 'ㅌ'],
  'ㄿ': ['ㄹ', 'ㅍ'], 'ㅀ': ['ㄹ', 'ㅎ'], 'ㅄ': ['ㅂ', 'ㅅ'],
}

const v_6144f0 = {
  'ㅋ': 'ㄱ', 'ㄲ': 'ㄱ',
  'ㅅ': 'ㄷ', 'ㅆ': 'ㄷ', 'ㅈ': 'ㄷ', 'ㅊ': 'ㄷ', 'ㅌ': 'ㄷ', 'ㅎ': 'ㄷ',
  'ㅍ': 'ㅂ',
}

const v_2b7d9a = { 'ㄱ': 'ㅇ', 'ㄷ': 'ㄴ', 'ㅂ': 'ㅁ' }

const v_0425fe = {
  'ㄱ': 'ㄲ', 'ㄷ': 'ㄸ', 'ㅂ': 'ㅃ', 'ㅅ': 'ㅆ', 'ㅈ': 'ㅉ',
}

const v_39d23c = {
  'ㄱ': 'ㅋ', 'ㄷ': 'ㅌ', 'ㅂ': 'ㅍ', 'ㅈ': 'ㅊ',
  'ㅅ': 'ㅌ', 'ㅆ': 'ㅌ', 'ㅌ': 'ㅌ',
}

interface Syllable {
  initial: string
  medial: string
  final: string
}

function v_c33aa1(v_c99bd2): Syllable {
  const v_a56041 = v_c99bd2 - v_e29bd0
  return {
    initial: v_741283[Math.floor(v_a56041 / 588)],
    medial: v_216318[Math.floor((v_a56041 % 588) / 28)],
    final: v_deadb9[v_a56041 % 28],
  }
}

function v_81efac(v_4622b9): void {
  for (let v_ebec57 = 0; v_ebec57 < v_4622b9.length; v_ebec57++) {
    const v_c3bc75 = v_4622b9[v_ebec57].syllable
    if (!v_c3bc75 || !v_c3bc75.final) continue

    let v_b75e36 = v_ebec57 + 1
    let v_fba7b9 = false
    while (v_b75e36 < v_4622b9.length && !v_4622b9[v_b75e36].syllable) {
      if (/\s/.test(v_4622b9[v_b75e36].raw)) v_fba7b9 = true

      else if (v_36d01e.has(v_4622b9[v_b75e36].raw)) { v_b75e36 = v_4622b9.length; break }
      v_b75e36++
    }
    const v_a448ad = v_b75e36 < v_4622b9.length ? v_4622b9[v_b75e36].syllable : null
    if (!v_a448ad) continue

    const v_c485ff = v_a448ad.initial === 'ㅇ' && !v_fba7b9

    if (v_a448ad.initial === 'ㅎ' && v_39d23c[v_c3bc75.final]) {
      v_a448ad.initial = v_39d23c[v_c3bc75.final]
      v_c3bc75.final = ''
      continue
    }
    if (v_c3bc75.final === 'ㅎ' && v_39d23c[v_a448ad.initial]) {
      v_a448ad.initial = v_39d23c[v_a448ad.initial]
      v_c3bc75.final = ''
      continue
    }
    if ((v_c3bc75.final === 'ㄶ' || v_c3bc75.final === 'ㅀ') && v_39d23c[v_a448ad.initial]) {
      v_a448ad.initial = v_39d23c[v_a448ad.initial]
      v_c3bc75.final = v_c3bc75.final === 'ㄶ' ? 'ㄴ' : 'ㄹ'
      continue
    }

    if (v_c485ff) {
      if (v_c3bc75.final === 'ㅎ') {
        v_c3bc75.final = ''
        continue
      }

      if (v_c3bc75.final === 'ㄶ' || v_c3bc75.final === 'ㅀ') {
        v_a448ad.initial = v_c3bc75.final === 'ㄶ' ? 'ㄴ' : 'ㄹ'
        v_c3bc75.final = ''
        continue
      }
    }

    if (v_c485ff && v_a448ad.medial === 'ㅣ' && (v_c3bc75.final === 'ㄷ' || v_c3bc75.final === 'ㅌ')) {
      v_a448ad.initial = v_c3bc75.final === 'ㄷ' ? 'ㅈ' : 'ㅊ'
      v_c3bc75.final = ''
      continue
    }

    if (v_c485ff) {
      const v_f208d5 = v_65f2d0[v_c3bc75.final]
      if (v_f208d5) {
        v_c3bc75.final = v_f208d5[0]
        v_a448ad.initial = v_f208d5[1]
      } else if (v_c3bc75.final !== 'ㅇ') {
        v_a448ad.initial = v_c3bc75.final
        v_c3bc75.final = ''
      }
      continue
    }

    const v_f208d5 = v_65f2d0[v_c3bc75.final]
    if (v_f208d5) v_c3bc75.final = v_f208d5[0]

    v_c3bc75.final = v_6144f0[v_c3bc75.final] ?? v_c3bc75.final

    if (v_c3bc75.final === 'ㄴ' && v_a448ad.initial === 'ㄹ') {
      v_c3bc75.final = 'ㄹ'
      continue
    }
    if (v_c3bc75.final === 'ㄹ' && v_a448ad.initial === 'ㄴ') {
      v_a448ad.initial = 'ㄹ'
      continue
    }

    if ((v_a448ad.initial === 'ㄴ' || v_a448ad.initial === 'ㅁ') && v_2b7d9a[v_c3bc75.final]) {
      v_c3bc75.final = v_2b7d9a[v_c3bc75.final]
      continue
    }

    if ((v_c3bc75.final === 'ㅁ' || v_c3bc75.final === 'ㅇ') && v_a448ad.initial === 'ㄹ') {
      v_a448ad.initial = 'ㄴ'
      continue
    }

    if ((v_c3bc75.final === 'ㄱ' || v_c3bc75.final === 'ㄷ' || v_c3bc75.final === 'ㅂ') && v_0425fe[v_a448ad.initial]) {
      v_a448ad.initial = v_0425fe[v_a448ad.initial]
    }
  }
}

export function v_c99bc7(v_9b6134): string {

  const v_4622b9 = []

  for (const v_620da0 of v_9b6134) {
    const v_c99bd2 = v_620da0.codePointAt(0) ?? 0
    if (v_c99bd2 >= v_e29bd0 && v_c99bd2 <= v_1908e1) {
      v_4622b9.push({ syllable: v_c33aa1(v_c99bd2), raw: v_620da0 })
    } else {
      v_4622b9.push({ syllable: null, raw: v_620da0 })
    }
  }

  v_81efac(v_4622b9)

  let v_8d4337 = ''
  for (const { syllable: v_74ae35, raw: v_479f05 } of v_4622b9) {
    if (v_74ae35) {
      v_8d4337 += v_74ae35.initial
      v_8d4337 += v_2177c5[v_74ae35.medial] ?? v_74ae35.medial
      if (v_74ae35.final) v_8d4337 += v_1f33ed[v_74ae35.final] ?? v_74ae35.final
      continue
    }

    if (v_36d01e.has(v_479f05)) {
      v_8d4337 += v_479f05
      continue
    }

    if (/\s/.test(v_479f05)) {
      if (!v_8d4337.endsWith(' ')) v_8d4337 += ' '
      continue
    }

    if (v_2177c5[v_479f05]) v_8d4337 += v_2177c5[v_479f05]
    else if (v_1f33ed[v_479f05]) v_8d4337 += v_1f33ed[v_479f05]
    else if (v_f1d098.has(v_479f05)) v_8d4337 += v_479f05
  }

  v_8d4337 = v_8d4337.trim()

  if (v_8d4337 && !v_36d01e.has(v_8d4337[v_8d4337.length - 1])) v_8d4337 += '.'

  return v_8d4337
}

export function v_51b50b(v_2a7e6c): string[] {
  return [...new Set([...v_2a7e6c].filter((v_3f4e2e) => !v_f1d098.has(v_3f4e2e)))]
}
