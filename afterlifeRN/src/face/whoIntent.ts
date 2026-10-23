

export type WhoIntent = "self" | "other";

const v_26b635 = [
  /(너|넌|당신|니|네가|너는)\s*(는|은)?\s*(누구|누군|이름)/,
  /\bwho\s+are\s+you\b/i,
  /\byour\s+name\b/i,
  /(君|あなた|お前)\s*(は|の名前)/,
  /你是谁|你叫什么/,
];

const v_f077a1 = "누(?:구(?:야|지|게|일까|예요|에요|냐|니|세요)?|군지|군데|굴까)(?=\\s|[?!.~]|$)";

const v_1df298 = [
  new RegExp(`(나|내가|난|저|제가)\\s*(는|은)?\\s*${v_f077a1}`),
  /내\s*이름\s*(이|은)?\s*(뭐|알아|기억)/,
  /(나|저)\s*(를)?\s*(알아(?!서)|기억해|알아보겠)/,
  /\bwho\s+am\s+i\b/i,
  /\bdo\s+you\s+(know|recognize|remember)\s+me\b/i,
  /(僕|私|俺)\s*(は|が)\s*誰/,
  /(僕|私|俺)\s*の\s*こと\s*(わかる|分かる|覚えて)/,
  /我是谁|你认识我|你记得我/,
];

const v_7cf5ee = [
  new RegExp(`(이|그|저)\\s*(사람|친구|분|애|얘)\\s*(은|는|이|가)?\\s*${v_f077a1}`),
  new RegExp(`(얘|쟤|걔)\\s*(는|가)?\\s*${v_f077a1}`),
  /(이|그|저)\s*(사람|친구|분)\s*(을|를)?\s*(알아(?!서)|알아보)/,
  /\bwho\s+is\s+(this|that|he|she)\b/i,
  /\bdo\s+you\s+know\s+(this|that|him|her)\b/i,
  /(この|その|あの)\s*(人|子|方)\s*(は|が)?\s*誰/,
  /(这|那)\s*(个人|位)\s*是谁|他是谁|她是谁/,
];

export function v_55270a(v_9b6134): WhoIntent | null {
  const v_8d41d7 = (v_9b6134 ?? "").trim();
  if (!v_8d41d7) return null;
  if (v_26b635.some((v_cb35cb) => v_cb35cb.test(v_8d41d7))) return null;
  if (v_7cf5ee.some((v_cb35cb) => v_cb35cb.test(v_8d41d7))) return "other";
  if (v_1df298.some((v_cb35cb) => v_cb35cb.test(v_8d41d7))) return "self";
  return null;
}
