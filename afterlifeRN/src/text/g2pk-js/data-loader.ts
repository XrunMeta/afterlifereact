

const IDIOMS_JSON: Array<[string, string]> = require('./data/idioms.json');

const TABLE_JSON: Array<[string, string, string[]]> = require('./data/table.json');

export function loadIdioms(): Array<[string, string]> {
  return IDIOMS_JSON;
}

export function loadTableRules(): Array<[RegExp, string]> {
  const out: Array<[RegExp, string]> = [];
  for (const [pattern, replacement] of TABLE_JSON) {
    try {

      const regex = new RegExp(pattern, 'g');

      const jsReplacement = replacement.replace(/\\(\d)/g, '$$$1');
      out.push([regex, jsReplacement]);
    } catch (err) {
      console.warn('[g2pk-js] table rule regex 컴파일 실패:', pattern, err);
    }
  }
  return out;
}

export function loadCmuDict(): Record<string, string[]> {

  return require('./data/cmudict.json');
}
