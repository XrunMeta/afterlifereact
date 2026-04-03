import { v_a04f9c, v_1a1e9e } from "wtmgqhsnsiyp";
import { v_5ab095, v_c4deb2 } from "bapkr";
import { v_c71054, v_3ebb07, v_a07c02 } from "nchqfqoebgwu";
import { v_1a40c4 } from "../../components/ui/button";
import { v_1b353f } from "../../components/ui/input";
import { v_258c1c } from "../../components/common/PageHeader";
import { v_4cd149 } from "./MyClonesDashboardPage";

const v_926598 = [
  {
    id: "emotional",
    title: "일상 및 감정 케어",
    subtitle: "Emotional & Daily",
    interests: [
      { id: "daily", label: "오늘의 하루", icon: "💬" },
      { id: "emotion", label: "감정 쓰레기통", icon: "😢" },
      { id: "praise", label: "칭찬/응원", icon: "💪" },
      { id: "relationship", label: "연애/인간관계", icon: "💕" },
    ],
  },
  {
    id: "hobby",
    title: "엔터테인먼트 및 취미",
    subtitle: "Hobby & Fun",
    interests: [
      { id: "fandom", label: "덕질(Fandom)", icon: "⭐" },
      { id: "game", label: "게임/스포츠", icon: "🎮" },
      { id: "travel", label: "여행/맛집", icon: "✈️" },
      { id: "imagination", label: "상상/IF", icon: "💭" },
    ],
  },
  {
    id: "expert",
    title: "전문 지식 및 자기계발",
    subtitle: "Expert & Growth",
    interests: [
      { id: "language", label: "언어 학습", icon: "🗣️" },
      { id: "career", label: "커리어/면접", icon: "💼" },
      { id: "reading", label: "독서/철학", icon: "📚" },
      { id: "finance", label: "경제/재테크", icon: "💰" },
    ],
  },
  {
    id: "special",
    title: "특수 페르소나",
    subtitle: "Special Persona",
    interests: [
      { id: "pet", label: "반려동물 모드", icon: "🐾" },
      { id: "memorial", label: "추모/기억", icon: "🕯️" },
      { id: "history", label: "역사/판권 인물", icon: "👑" },
      { id: "nag", label: "잔소리/갓생", icon: "⚡" },
      { id: "mbti", label: "MBTI", icon: "🧠" },
    ],
  },
];

const v_1f8019 = [
  { id: "extrovert", label: "외향적인" },
  { id: "introvert", label: "내향적인" },
  { id: "logical", label: "논리적인" },
  { id: "emotional", label: "감정적인" },
  { id: "free", label: "자유로운" },
  { id: "organized", label: "지유분만" },
  { id: "passionate", label: "열정적인" },
  { id: "calm", label: "평온적인" },
];

const v_5351c0 = [
  { id: "10s", label: "10대" },
  { id: "20s", label: "20대" },
  { id: "30s", label: "30대" },
  { id: "40s", label: "40대" },
  { id: "50s", label: "50대" },
  { id: "60plus", label: "60대 이상" },
];

const v_a47fc9 = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
  "모름"
];

export function v_f40b5e() {
  const v_9b57fc = v_a04f9c();
  const { id: v_389afb } = v_1a1e9e();
  const v_eb25ce = v_4cd149.find(v_3f4e2e => v_3f4e2e.id === v_389afb);

  const [v_5ba743, v_5cc801] = v_5ab095<string>("");
  const [v_976e06, v_770327] = v_5ab095<string[]>([]);
  const [v_15a866, v_bbeee9] = v_5ab095<string[]>([]);
  const [v_2b1044, v_160b34] = v_5ab095(false);
  const [v_0f1d77, v_e887ea] = v_5ab095("");

  const [v_2e7cbb, v_90b546] = v_5ab095({
    name: "",
    ageRange: "",
    gender: "남성",
    personalities: [] as string[],
    mbti: "",
    personaDescription: "",
  });

  v_c4deb2(() => {
    if (v_eb25ce) {

      const v_156c66 = {
        "일상 및 감정 케어": "emotional",
        "엔터테인먼트 및 취미": "hobby",
        "전문 지식 및 자기계발": "expert",
        "특수 페르소나": "special",
      };

      v_5cc801(v_156c66[v_eb25ce.mainCategory] || "");

      v_90b546({
        name: v_eb25ce.name,
        ageRange: "",
        gender: "남성",
        personalities: [],
        mbti: "",
        personaDescription: v_eb25ce.description,
      });
    }
  }, [v_eb25ce]);

  const v_6ff1f8 = (v_70c705, v_3b402b) => {
    v_90b546(v_ba2215 => ({ ...v_ba2215, [v_70c705]: v_3b402b }));
  };

  const v_ef6769 = (v_b7a7e5) => {
    v_90b546(v_ba2215 => ({
      ...v_ba2215,
      personalities: v_ba2215.personalities.includes(v_b7a7e5)
        ? v_ba2215.personalities.filter(v_e2a85c => v_e2a85c !== v_b7a7e5)
        : [...v_ba2215.personalities, v_b7a7e5]
    }));
  };

  const v_d82a00 = (v_21d905) => {
    v_770327(v_ba2215 =>
      v_ba2215.includes(v_21d905) ? v_ba2215.filter(v_ebec57 => v_ebec57 !== v_21d905) : [...v_ba2215, v_21d905]
    );
  };

  const v_b6cf57 = (v_11a5aa) => {
    v_5cc801(v_11a5aa);
    v_770327([]);
    v_bbeee9([]);
  };

  const v_ba88ae = () => {
    return v_926598.find(v_3f4e2e => v_3f4e2e.id === v_5ba743);
  };

  const v_d64dc0 = () => {
    if (v_0f1d77.trim()) {
      const v_d88083 = `custom_${Date.now()}`;
      v_bbeee9(v_ba2215 => [...v_ba2215, v_0f1d77.trim()]);
      v_770327(v_ba2215 => [...v_ba2215, v_d88083]);
      v_e887ea("");
      v_160b34(false);
    }
  };

  const v_1b8283 = () => {

    v_9b57fc("/oth-path");
  };

  if (!v_eb25ce) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-zinc-500">페르소나를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {}
      <PageHeader
        title="페르소나 수정"
        subtitle={v_eb25ce.name}
      />

      <div className="px-6 py-8 max-w-md mx-auto pb-32">
        <div className="space-y-9">
          {}
          <div>
            <h2 className="text-2xl font-bold mb-2">관심사를 선택해주세요</h2>
            <p className="text-sm text-zinc-500 mb-2">
              먼저 주 카테고리를 선택한 후, 관심사를 골라주세요.
            </p>
            <p className="text-xs text-zinc-400 mb-8">
              💡 선택한 카테고리의 관심사를 자유롭게 선택할 수 있습니다
            </p>

            {}
            {!v_5ba743 && (
              <div className="mb-8">
                <h3 className="font-bold text-lg mb-4">주 카테고리 선택</h3>
                <div className="space-y-3">
                  {v_926598.map((v_8b9cd4) => (
                    <button
                      key={v_8b9cd4.id}
                      onClick={() => v_b6cf57(v_8b9cd4.id)}
                      className="w-full p-5 rounded-2xl border-2 border-zinc-200 bg-white hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left"
                    >
                      <h4 className="font-bold text-base mb-1">{v_8b9cd4.title}</h4>
                      <p className="text-xs text-zinc-500">{v_8b9cd4.subtitle}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {}
            {v_5ba743 && v_ba88ae() && (
              <>
                <div className="space-y-8">
                  {}
                  <div>
                    <div className="mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-indigo-600">
                            {v_ba88ae()!.title}
                          </h3>
                          <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full font-medium">
                            주 카테고리
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            v_5cc801("");
                            v_770327([]);
                            v_bbeee9([]);
                          }}
                          className="px-3 py-1.5 border border-zinc-300 rounded-lg text-xs font-medium text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50"
                        >
                          변경
                        </button>
                      </div>
                      <p className="text-xs text-zinc-500">{v_ba88ae()!.subtitle}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {v_ba88ae()!.interests.map((v_e4601c) => {
                        const v_599a41 = v_976e06.includes(v_e4601c.id);

                        return (
                          <button
                            key={v_e4601c.id}
                            onClick={() => v_d82a00(v_e4601c.id)}
                            className={`relative p-4 rounded-2xl border-2 transition-all text-left ${
                              v_599a41
                                ? "border-indigo-600 bg-indigo-50"
                                : "border-zinc-200 bg-white hover:border-zinc-300"
                            }`}
                          >
                            <div className="text-2xl mb-2">{v_e4601c.icon}</div>
                            <div className="text-sm font-semibold text-zinc-900">{v_e4601c.label}</div>

                            {v_599a41 && (
                              <div className="absolute top-3 right-3 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {}
                  <div>
                    <h3 className="font-bold text-lg text-zinc-900 mb-4">그 외 관심사</h3>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {v_15a866.map((v_e4601c, v_a56041) => (
                        <span
                          key={v_a56041}
                          className="px-4 py-2 bg-indigo-50 border-2 border-indigo-600 rounded-full text-sm font-medium text-indigo-900"
                        >
                          {v_e4601c}
                        </span>
                      ))}
                    </div>

                    {v_2b1044 ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={v_0f1d77}
                          onChange={(v_9e86fd) => v_e887ea(v_9e86fd.target.value)}
                          onKeyPress={(v_9e86fd) => v_9e86fd.key === "Enter" && v_d64dc0()}
                          placeholder="관심사를 입력하세요"
                          className="flex-1 min-w-0 px-4 py-3 border-2 border-zinc-200 rounded-xl focus:border-indigo-600 focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={v_d64dc0}
                          className="shrink-0 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
                        >
                          추가
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => v_160b34(true)}
                        className="w-full p-4 border-2 border-dashed border-zinc-300 rounded-2xl hover:border-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 text-zinc-600 hover:text-indigo-600"
                      >
                        <Plus className="w-5 h-5" />
                        <span className="font-medium">관심사 추가하기</span>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {}
          <div className="border-t border-zinc-200 pt-9">
            <h2 className="text-lg font-bold mb-6">기본 정보</h2>

            {}
            <div className="mb-6">
              <label className="block text-md font-medium text-zinc-900 mb-2">이름</label>
              <Input
                type="text"
                placeholder="이름을 입력해주세요"
                value={v_2e7cbb.name}
                onChange={(v_9e86fd) => v_6ff1f8("name", v_9e86fd.target.value)}
                className="w-full h-12 px-4 bg-zinc-50 border-0 text-zinc-900 placeholder:text-zinc-400"
              />
            </div>

            {}
            <div className="mb-6">
              <label className="block text-md font-medium text-zinc-900 mb-2">나이</label>
              <select
                value={v_2e7cbb.ageRange}
                onChange={(v_9e86fd) => v_6ff1f8("ageRange", v_9e86fd.target.value)}
                className="w-full h-12 px-4 bg-zinc-50 border-0 rounded-lg text-zinc-900"
              >
                <option value="">나이대 선택</option>
                {v_5351c0.map(v_4f2c9c => (
                  <option key={v_4f2c9c.id} value={v_4f2c9c.id}>{v_4f2c9c.label}</option>
                ))}
              </select>
            </div>

            {}
            <div className="mb-6">
              <label className="block text-md font-medium text-zinc-900 mb-2">성별</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => v_6ff1f8("gender", "남성")}
                  className={`h-12 rounded-lg font-medium transition-all ${
                    v_2e7cbb.gender === "남성"
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-50 text-zinc-600"
                  }`}
                >
                  남성
                </button>
                <button
                  onClick={() => v_6ff1f8("gender", "여성")}
                  className={`h-12 rounded-lg font-medium transition-all ${
                    v_2e7cbb.gender === "여성"
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-50 text-zinc-600"
                  }`}
                >
                  여성
                </button>
              </div>
            </div>

            {}
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <label className="text-md font-medium text-zinc-900">성격 유형 선택</label>
              </div>
              <p className="text-xs text-zinc-500 mb-3">
                이 페르소나에 어울리는 성격 키워드를 모두 골라주세요.
              </p>
              <div className="flex flex-wrap gap-2">
                {v_1f8019.map((v_3b27d9) => (
                  <button
                    key={v_3b27d9.id}
                    onClick={() => v_ef6769(v_3b27d9.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      v_2e7cbb.personalities.includes(v_3b27d9.id)
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    # {v_3b27d9.label}
                  </button>
                ))}
              </div>
            </div>

            {}
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <label className="text-md font-medium text-zinc-900">MBTI</label>
              </div>
              <p className="text-xs text-zinc-500 mb-3">
                페르소나의 MBTI 유형을 선택해주세요.
              </p>
              <div className="grid grid-cols-4 gap-2">
                {v_a47fc9.map((v_3b27d9) => (
                  <button
                    key={v_3b27d9}
                    onClick={() => v_6ff1f8("mbti", v_3b27d9)}
                    className={`h-12 rounded-lg text-sm font-medium transition-all ${
                      v_2e7cbb.mbti === v_3b27d9
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    {v_3b27d9}
                  </button>
                ))}
              </div>
            </div>

            {}
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <label className="text-md font-medium text-zinc-900">페르소나 설명</label>
              </div>
              <p className="text-xs text-zinc-500 mb-3">
                이 페르소나의 정체성을 알 수 있게 설명해주세요. 
              </p>
              <textarea
                placeholder="이 페르소나의 전체적을 보여줄 수 있는 구체적인 곳이거나 나 이야기를 들려주세요..."
                value={v_2e7cbb.personaDescription}
                onChange={(v_9e86fd) => v_6ff1f8("personaDescription", v_9e86fd.target.value)}
                className="text-sm w-full h-32 px-4 py-3 bg-zinc-50 border-0 rounded-lg text-zinc-900 placeholder:text-zinc-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
          </div>
        </div>

        {}
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t border-zinc-200 z-30">
          <Button
            onClick={v_1b8283}
            disabled={!v_2e7cbb.name || !v_2e7cbb.ageRange}
            className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-base font-medium disabled:opacity-50 disabled:bg-zinc-300"
          >
            저장하기
          </Button>
        </div>
      </div>
    </div>
  );
}