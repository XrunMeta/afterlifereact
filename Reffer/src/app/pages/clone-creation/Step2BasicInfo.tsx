import { v_a04f9c } from "wtmgqhsnsiyp";
import { v_5ab095 } from "bapkr";
import { v_c71054, v_429ab0, v_357ea0, v_182dba, v_32e130 } from "nchqfqoebgwu";
import { v_1a40c4 } from "../../components/ui/button";
import { v_1b353f } from "../../components/ui/input";
import { v_258c1c } from "../../components/common/PageHeader";

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

export function v_4fedcc() {
  const v_9b57fc = v_a04f9c();
  const [v_2e7cbb, v_90b546] = v_5ab095({
    name: "",
    relationship: "할버지",
    relationshipDetail: "",
    nickname: "",
    ageRange: "",
    gender: "남성",
    birthDate: "",
    anniversary: "",
    personalities: [] as string[],
    mbti: "",
    speechStyle: "",
    personaDescription: "",
  });

  const v_420661 = () => {
    v_9b57fc("/clone/create/step3");
  };

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

  const v_ae46ef = v_2e7cbb.name && v_2e7cbb.ageRange && v_2e7cbb.gender;

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {}
      <PageHeader
        title="기본 정보 입력"
        stepInfo={{ current: 2, total: 7 }}
      />

      <div className="px-6 py-8 max-w-md mx-auto pb-32">
        <div className="space-y-9">
          {}
          <div>
            <label className="block text-md font-medium text-zinc-900 mb-2">이름</label>
            <Input
              type="text"
              placeholder="이름을 입력해주세요"
              value={v_2e7cbb.name}
              onChange={(v_9e86fd) => v_6ff1f8("name", v_9e86fd.target.value)}
              className="w-full h-12 px-4 bg-zinc-50 border-0 text-zinc-900 placeholder:text-zinc-400"
            />
          </div>

          {

}
          {}
          <div>
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
          <div>
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
          <div>
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
          <div>
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
          <div>
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

        {}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-zinc-200">
          <Button
            onClick={v_420661}
            disabled={!v_ae46ef}
            className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-base font-medium disabled:opacity-50 disabled:bg-zinc-300"
          >
            다음 단계로 이동
          </Button>
        </div>
      </div>
    </div>
  );
}