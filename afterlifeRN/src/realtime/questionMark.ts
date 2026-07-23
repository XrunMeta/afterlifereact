

const v_1ed6a7 =
  /(까|까요|니|냐|나요|가요|는가|은가|을까|을까요|ㄹ까요|을래|을래요|는지|건가|던가|맞지|맞죠|인가요|인가)$/;

const v_ca477d = /[?!.]$/;

export function v_fb305c(v_9b6134): string {
  const v_2f361a = v_9b6134.trim();
  if (v_2f361a === '') return v_2f361a;
  if (v_ca477d.test(v_2f361a)) return v_2f361a;
  if (v_1ed6a7.test(v_2f361a)) return `${v_2f361a}?`;
  return v_2f361a;
}
