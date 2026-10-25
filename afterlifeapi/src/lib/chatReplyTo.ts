

export const v_5bba7d = ["❤️", "😂", "😮", "😢", "👍", "🙏"] as const;

export function v_888068(v_81e2ef): v_81e2ef is (typeof v_5bba7d)[number] {
  return typeof v_81e2ef === "string" && (v_5bba7d as readonly string[]).includes(v_81e2ef);
}

const v_1c9af2 = 200;

export function v_10ee58(v_9b6134): string {
  const v_15168d = v_9b6134.replace(/\s+/g, " ").trim();
  return v_15168d.length > v_1c9af2 ? `${v_15168d.slice(0, v_1c9af2)}…` : v_15168d;
}

export function v_ea6521(v_715091, v_602e0f): string {

  return (
    `(네가 전에 한 말 "${v_10ee58(v_715091)}"에 대한 답장이야. 그 말에 이어서 대답해. ` +
    "이 괄호 안 내용은 언어 판단에 쓰지 마)\n" +
    v_602e0f
  );
}
