import { v_a04f9c } from "wtmgqhsnsiyp";
import { v_5ab095 } from "bapkr";
import { v_c71054, v_56d16a, v_466e75, v_45a130, v_357ea0, v_a07c02, v_3ebb07 } from "nchqfqoebgwu";
import { v_1a40c4 } from "../../components/ui/button";
import { v_258c1c } from "../../components/common/PageHeader";

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

export function v_618fb2() {
  const v_9b57fc = v_a04f9c();
  const [v_5ba743, v_5cc801] = v_5ab095<string>("");
  const [v_976e06, v_770327] = v_5ab095<string[]>([]);
  const [v_15a866, v_bbeee9] = v_5ab095<string[]>([]);
  const [v_2b1044, v_160b34] = v_5ab095(false);
  const [v_0f1d77, v_e887ea] = v_5ab095("");

  const v_d82a00 = (v_21d905) => {
    v_770327(v_ba2215 =>
      v_ba2215.includes(v_21d905) ? v_ba2215.filter(v_ebec57 => v_ebec57 !== v_21d905) : [...v_ba2215, v_21d905]
    );
  };

  const v_b6cf57 = (v_11a5aa) => {
    v_5cc801(v_11a5aa);
  };

  const v_ba88ae = () => {
    return v_926598.find(v_3f4e2e => v_3f4e2e.id === v_5ba743);
  };

  const v_afcd50 = (v_11a5aa) => {
    const v_8b9cd4 = v_926598.find(v_3f4e2e => v_3f4e2e.id === v_11a5aa);
    const v_6d069d = v_8b9cd4?.interests.map(v_ebec57 => v_ebec57.id) || [];
    return v_976e06.filter(v_389afb => v_6d069d.includes(v_389afb)).length;
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

  const v_420661 = () => {
    if (v_976e06.length > 0) {
      v_9b57fc("/clone/create/step2");
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {}
      <PageHeader
        onBack={() => v_9b57fc("/")}
        title="페르소나 생성"
        stepInfo={{ current: 1, total: 7 }}
      />

      <div className="px-6 py-8 max-w-md mx-auto pb-32">
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
                  <div className="flex gap-2 w-full">
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

        {}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-zinc-200">
          <div className="max-w-md mx-auto">
            {v_5ba743 && (
              <div className="text-center mb-2">
                <span className="text-sm text-zinc-500">
                  {v_976e06.length}개 선택됨
                </span>
              </div>
            )}
            <Button
              onClick={v_420661}
              disabled={v_976e06.length === 0}
              className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-base font-medium disabled:opacity-50 disabled:bg-zinc-200 disabled:text-zinc-400"
            >
              다음 단계로 이동
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}