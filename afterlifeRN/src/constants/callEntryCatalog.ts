

export const RELATION_CATALOG: {
  id: string;
  label: string;
  subtypes: { id: string; label: string }[];
}[] = [
  {
    id: "family",
    label: "가족",
    subtypes: [
      { id: "father", label: "아빠" },
      { id: "mother", label: "엄마" },
      { id: "grandfather", label: "할아버지" },
      { id: "grandmother", label: "할머니" },
      { id: "maternal_grandfather", label: "외할아버지" },
      { id: "maternal_grandmother", label: "외할머니" },
      { id: "older_brother_male", label: "형" },
      { id: "older_brother_female", label: "오빠" },
      { id: "older_sister_male", label: "누나" },
      { id: "older_sister_female", label: "언니" },
      { id: "younger_sibling", label: "동생" },
      { id: "paternal_uncle", label: "삼촌" },
      { id: "maternal_aunt", label: "이모" },
      { id: "paternal_aunt", label: "고모" },
      { id: "maternal_uncle_husband", label: "이모부" },
      { id: "paternal_aunt_husband", label: "고모부" },
      { id: "cousin", label: "사촌" },
      { id: "other", label: "기타" },
    ],
  },
  {
    id: "friend",
    label: "친구",
    subtypes: [
      { id: "best_friend", label: "절친/베프" },
      { id: "childhood_friend", label: "소꿉친구" },
      { id: "school_friend", label: "학창 시절 동창" },
      { id: "college_friend", label: "대학 동기" },
      { id: "neighbor_friend", label: "동네 친구" },
      { id: "other", label: "기타" },
    ],
  },
  {
    id: "romance",
    label: "연인",
    subtypes: [
      { id: "husband", label: "남편" },
      { id: "wife", label: "아내" },
      { id: "boyfriend", label: "남자친구" },
      { id: "girlfriend", label: "여자친구" },
      { id: "crush_mutual", label: "썸남/썸녀" },
      { id: "unrequited_love", label: "짝사랑 상대" },
      { id: "other", label: "기타" },
    ],
  },
  {
    id: "workplace",
    label: "직장",
    subtypes: [
      { id: "boss", label: "상사/팀장" },
      { id: "mentor", label: "사수" },
      { id: "senior", label: "선배" },
      { id: "peer", label: "입사 동기" },
      { id: "junior", label: "후배/부사수" },
      { id: "business_partner", label: "사업 파트너" },
      { id: "other", label: "기타" },
    ],
  },
  {
    id: "celebrity",
    label: "유명인",
    subtypes: [
      { id: "actor", label: "배우" },
      { id: "singer", label: "가수/아이돌" },
      { id: "youtuber", label: "유튜버/인플루언서" },
      { id: "streamer", label: "스트리머" },
      { id: "athlete", label: "운동선수" },
      { id: "webtoon_artist", label: "웹툰 작가" },
      { id: "other", label: "기타" },
    ],
  },
];

export const SPEECH_FORM_OPTIONS = [
  { id: "informal", label: "반말" },
  { id: "formal", label: "존댓말" },
];

export const JOB_CATEGORY_OPTIONS = [
  { id: "doctor", label: "의사" },
  { id: "teacher", label: "교사/교수" },
  { id: "developer", label: "개발자" },
  { id: "lawyer", label: "변호사" },
  { id: "public_servant", label: "공무원" },
  { id: "entertainer", label: "연예인" },
  { id: "creator", label: "크리에이터/인플루언서" },
  { id: "officer", label: "경찰관/소방관" },
  { id: "journalist", label: "기자/아나운서" },
  { id: "chef", label: "요리사" },
  { id: "other", label: "기타" },
];

export function findRelationCategoryLabel(id: string | undefined): string | undefined {
  return RELATION_CATALOG.find((c) => c.id === id)?.label;
}
export function findRelationSubtypeLabel(
  categoryId: string | undefined,
  subtypeId: string | undefined,
): string | undefined {
  const cat = RELATION_CATALOG.find((c) => c.id === categoryId);
  return cat?.subtypes.find((s) => s.id === subtypeId)?.label;
}
export function findSpeechFormLabel(id: string | undefined): string | undefined {
  return SPEECH_FORM_OPTIONS.find((o) => o.id === id)?.label;
}
export function findJobCategoryLabel(id: string | undefined): string | undefined {
  return JOB_CATEGORY_OPTIONS.find((o) => o.id === id)?.label;
}
