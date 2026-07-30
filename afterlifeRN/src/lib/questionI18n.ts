

import i18n from "../i18n";

const LABEL_TO_KEY: Record<string, string> = {
  "나이대가 어떻게 되세요?": "question.label.ageRange",
  "성별은요?": "question.label.gender",
  "어떤 MBTI를 가지고 있나요?": "question.label.mbti",
  "어떤 성격이셨나요?": "question.label.personalityCore",
  "어떤 말투로 말하셨나요?": "question.label.tone",
  "어느 지역 사투리였나요?": "question.label.dialectRegion",
  "사투리가 어느 정도였나요?": "question.label.dialectIntensity",

  "{name}을/를 한 단어로 정의한다면 무엇인가요?": "question.knowledgeLabel.coreIdentity",
  "{name}의 성격을 구성하는 가장 지배적인 특징 3가지는 무엇인가요?":
    "question.knowledgeLabel.mainTraits",
  "{name}이/가 겉으로 드러내는 모습과 내면의 솔직한 생각 사이에 어떤 차이(반전)가 있나요?":
    "question.knowledgeLabel.internalConflict",
  "{name}의 말투에서 가장 강하게 묻어나는 분위기나 감정 상태는 어떠한가요?":
    "question.knowledgeLabel.speechStyle",
  "{name}이/가 말을 할 때 무의식적으로 자주 쓰는 단어나 문장 부호 습관이 있나요?":
    "question.knowledgeLabel.verbalHabits",
  "{name}이/가 삶을 살아가는 데 있어 가장 중요하게 생각하는 인생관은 무엇인가요?":
    "question.knowledgeLabel.lifePhilosophy",
  "{name}이/가 어떤 상황에서도 절대 포기할 수 없는 단 하나의 핵심 가치는 무엇인가요?":
    "question.knowledgeLabel.coreValue",
  "{name}이/가 타인에게서 발견했을 때 가장 경멸하거나 싫어하는 성격적 태도는 무엇인가요?":
    "question.knowledgeLabel.hatedAttitude",
  "{name}의 도덕적 양심이나 정의감의 기준은 어느 정도인가요?":
    "question.knowledgeLabel.moralStandard",
  "누군가 이것만큼은 침범하면 {name}이/가 절대 참지 못하는 경계선은 무엇인가요?":
    "question.knowledgeLabel.unforgivableLine",
  "무엇이 {name}을/를 가장 귀찮고 무기력하게 만드나요?":
    "question.knowledgeLabel.lazyTrigger",
  "{name}은/는 매사에 계획을 꼼꼼하게 세우는 편인가요, 아니면 즉흥적으로 대처하는 편인가요?":
    "question.knowledgeLabel.actionStyle",
  "{name}은/는 물질적인 부나 성공에 대해 어떤 욕망이나 시선을 가지고 있나요?":
    "question.knowledgeLabel.moneyMindset",
  "{name}은/는 사회적 규칙, 권력, 상사의 통제나 명령에 대해 어떻게 반응하나요?":
    "question.knowledgeLabel.authorityView",
  "{name}은/는 눈앞의 현실을 냉정하게 보는 편인가요, 아니면 이상과 낭만을 좇는 편인가요?":
    "question.knowledgeLabel.realistOrDreamer",
  "{name}의 지금 성격이 형성된 결정적인 과거 계기가 있나요?":
    "question.knowledgeLabel.originStory",
  "{name}이/가 마음속 깊은 곳에 숨겨둔 가장 원초적인 공포나 불안은 무엇인가요?":
    "question.knowledgeLabel.deepestFear",
  "{name}이/가 가장 후회하고 있거나 다시 되돌리고 싶은 기억이 있다면 무엇인가요?":
    "question.knowledgeLabel.regretfulMemory",
  "{name}이/가 인생에서 가장 당당하고 스스로가 자랑스러웠던 기억은 무엇인가요?":
    "question.knowledgeLabel.proudMoment",
  "{name}이/가 쉽게 아물지 않는 마음속 깊은 감정적 상처나 결핍은 무엇인가요?":
    "question.knowledgeLabel.emotionalWound",
  "{name}은/는 타인을 쉽게 신뢰하고 받아들이는 편인가요, 아니면 오랫동안 경계하고 지켜보는 편인가요?":
    "question.knowledgeLabel.socialTrust",
  "{name}이/가 다른 사람과 다툼이나 갈등이 생겼을 때 주로 해결하는 행동 양식은 어떠한가요?":
    "question.knowledgeLabel.conflictApproach",
  "{name}이/가 정말 분노했을 때 평소와 다르게 말이나 행동이 어떻게 변하나요?":
    "question.knowledgeLabel.angryBehavior",
  "누군가 진심으로 칭찬해 줄 때 {name}은/는 이를 부끄러워하나요, 아니면 당연하다는 듯 즐기나요?":
    "question.knowledgeLabel.praiseResponse",
  "힘들어하는 사람을 마주했을 때 {name}만의 독특한 위로 방식은 무엇인가요?":
    "question.knowledgeLabel.comfortMethod",
  "{name}이/가 곁에 두고 싶어 하는 가장 편안한 인간상은 어떤 부류인가요?":
    "question.knowledgeLabel.friendshipCriteria",
  "남들은 잘 모르지만 {name}이/가 속으로 은근히 자부심을 느끼고 있는 장점은 무엇인가요?":
    "question.knowledgeLabel.secretPride",
  "극심한 스트레스를 받았을 때 {name}이/가 무의식적으로 하는 행동은 무엇인가요?":
    "question.knowledgeLabel.stressCoping",
  "대답하기 곤란한 질문을 받았을 때 {name}만의 위기 모면 요령은 무엇인가요?":
    "question.knowledgeLabel.difficultQuestions",
  "{name}은/는 혼자 있을 때 외로움을 심하게 타는 편인가요, 아니면 온전한 고독을 즐기는 편인가요?":
    "question.knowledgeLabel.lonelinessFeeling",
  "{name}이/가 정의하는 가장 이상적이고 완벽한 행복이란 어떤 상태인가요?":
    "question.knowledgeLabel.happinessDefinition",
  "우울하거나 슬픈 감정이 밀려올 때 {name}은/는 이를 밖으로 표현하나요, 안으로 꾹꾹 누르나요?":
    "question.knowledgeLabel.sadnessExpression",
  "{name}은/는 새로운 환경이나 갑작스러운 상황 변화에 유연하게 적응하는 편인가요, 거부감을 느끼나요?":
    "question.knowledgeLabel.changeReaction",
  "사소하지만 한 번 꽂히면 {name}이/가 유별날 정도로 고집스럽게 집착하는 영역이 있나요?":
    "question.knowledgeLabel.obsessionPoints",
  "타인의 무례한 비판이나 공격을 받았을 때 {name}이/가 마음을 보호하기 위해 작동하는 방어기제는 무엇인가요?":
    "question.knowledgeLabel.mentalDefense",
  "{name}에게 아직 자라지 못한 어린아이 같은 서툴거나 미성숙한 면모가 있다면 어느 부분인가요?":
    "question.knowledgeLabel.innerChild",
  "{name}은/는 평소 스스로를 높게 평가하며 자신만만한 편인가요, 아니면 끊임없이 스스로를 의심하나요?":
    "question.knowledgeLabel.selfEvaluation",
  "{name}은/는 남들의 조언이나 의견을 유연하게 수용하나요, 아니면 자기 고집을 끝까지 밀고 나가나요?":
    "question.knowledgeLabel.stubbornnessLevel",
  "{name}은/는 사람들과 어울릴 때 에너지를 얻는 편인가요, 아니면 기가 다 빨려서 방전되는 편인가요?":
    "question.knowledgeLabel.socialEnergy",
  "{name}이/가 인생을 바쳐 도달하고 싶어 하는 궁극적인 목적지는 어디인가요?":
    "question.knowledgeLabel.ultimateGoal",
  "{name}은/는 평소 장난을 치거나 유머를 던질 때 주로 어떤 유머 코드를 구사하나요?":
    "question.knowledgeLabel.jokeStyle",
  "누군가에게 질투나 시샘을 느낄 때 {name}은/는 이를 어떻게 드러내거나 숨기나요?":
    "question.knowledgeLabel.jealousyExpression",
  "누군가 힘든 고민을 털어놓을 때 {name}은/는 감정적 공감을 잘해주는 편인가요, 아니면 현실적 해결책을 먼저 주는 편인가요?":
    "question.knowledgeLabel.empathyOrSolution",
  "{name}은/는 상대방의 가식이나 거짓말을 직관적으로 빠르게 간파하는 편인가요?":
    "question.knowledgeLabel.liesDetection",
  "{name}은/는 평소 인내심이 강한 편인가요, 아니면 조금만 답답해도 화가 쉽게 치미는 편인가요?":
    "question.knowledgeLabel.patienceLimit",
  "{name}에게 심리적으로 가장 큰 안전감과 편안함을 가져다주는 생각이나 상상은 무엇인가요?":
    "question.knowledgeLabel.comfortZone",
  "수치스럽거나 창피한 일을 겪었을 때 {name}은/는 멘탈을 복구하기 위해 어떻게 행동하나요?":
    "question.knowledgeLabel.shameReaction",
  "{name}은/는 한번 신뢰하기 시작한 대상이나 익숙해진 것에 강한 애착을 보이는 편인가요?":
    "question.knowledgeLabel.attachmentStyle",
  "{name}에게 성격과 전혀 어울리지 않게 은밀히 즐기거나 관심 있어 하는 반전 취미가 있나요?":
    "question.knowledgeLabel.secretHobby",
  "하루 일과를 마치고 혼자 조용히 읊조릴 법한 {name}의 대표적인 혼잣말은 무엇인가요?":
    "question.knowledgeLabel.lastWords",
};

const OPTION_TO_KEY: Record<string, string> = {
  "10대": "question.option.age.10s",
  "20대": "question.option.age.20s",
  "30대": "question.option.age.30s",
  "40대": "question.option.age.40s",
  "50대": "question.option.age.50s",
  "60대 이상": "question.option.age.60plus",

  "남성": "question.option.gender.male",
  "여성": "question.option.gender.female",
  "기타": "question.option.gender.other",

  "조용한 성격": "question.option.personalityCore.quiet",
  "급한 성격": "question.option.personalityCore.impatient",

  "사투리": "question.option.tone.dialect",
  "평범한 말투": "question.option.tone.normal",

  "경상도": "question.option.dialectRegion.gyeongsang",
  "전라도": "question.option.dialectRegion.jeolla",
  "충청도": "question.option.dialectRegion.chungcheong",
  "제주": "question.option.dialectRegion.jeju",
  "강원": "question.option.dialectRegion.gangwon",
  "서울/경기": "question.option.dialectRegion.seoulGyeonggi",

  "약간": "question.option.dialectIntensity.slight",
  "보통": "question.option.dialectIntensity.moderate",
  "심함": "question.option.dialectIntensity.heavy",
};

export function translateQuestion(label: string | null | undefined): string {
  if (!label) return "";
  const trimmed = label.trim();
  const key = LABEL_TO_KEY[trimmed];
  if (!key) return label;
  const translated = i18n.t(key, { defaultValue: "" });
  if (translated && translated !== key) return translated;
  return label;
}

export function translateOption(option: string | null | undefined): string {
  if (!option) return "";
  const trimmed = option.trim();
  const key = OPTION_TO_KEY[trimmed];
  if (!key) return option;
  const translated = i18n.t(key, { defaultValue: "" });
  if (translated && translated !== key) return translated;
  return option;
}
