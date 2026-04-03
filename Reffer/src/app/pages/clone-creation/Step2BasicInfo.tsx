import { useNavigate } from "react-router";
import { useState } from "react";
import { ArrowLeft, Calendar, Sparkles, MessageSquare, FileText } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { PageHeader } from "../../components/common/PageHeader";

const personalityTypes = [
  { id: "extrovert", label: "외향적인" },
  { id: "introvert", label: "내향적인" },
  { id: "logical", label: "논리적인" },
  { id: "emotional", label: "감정적인" },
  { id: "free", label: "자유로운" },
  { id: "organized", label: "지유분만" },
  { id: "passionate", label: "열정적인" },
  { id: "calm", label: "평온적인" },
];

const ageRanges = [
  { id: "10s", label: "10대" },
  { id: "20s", label: "20대" },
  { id: "30s", label: "30대" },
  { id: "40s", label: "40대" },
  { id: "50s", label: "50대" },
  { id: "60plus", label: "60대 이상" },
];

const mbtiTypes = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
  "모름"
];

export function Step2BasicInfo() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
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

  const handleNext = () => {
    navigate("/clone/create/step3");
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const togglePersonality = (personalityId: string) => {
    setFormData(prev => ({
      ...prev,
      personalities: prev.personalities.includes(personalityId)
        ? prev.personalities.filter(p => p !== personalityId)
        : [...prev.personalities, personalityId]
    }));
  };

  const isFormValid = formData.name && formData.ageRange && formData.gender;

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
              value={formData.name}
              onChange={(e) => updateFormData("name", e.target.value)}
              className="w-full h-12 px-4 bg-zinc-50 border-0 text-zinc-900 placeholder:text-zinc-400"
            />
          </div>

          {

}
          {}
          <div>
            <label className="block text-md font-medium text-zinc-900 mb-2">나이</label>
            <select
              value={formData.ageRange}
              onChange={(e) => updateFormData("ageRange", e.target.value)}
              className="w-full h-12 px-4 bg-zinc-50 border-0 rounded-lg text-zinc-900"
            >
              <option value="">나이대 선택</option>
              {ageRanges.map(range => (
                <option key={range.id} value={range.id}>{range.label}</option>
              ))}
            </select>
          </div>

          {}
          <div>
            <label className="block text-md font-medium text-zinc-900 mb-2">성별</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => updateFormData("gender", "남성")}
                className={`h-12 rounded-lg font-medium transition-all ${
                  formData.gender === "남성"
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-50 text-zinc-600"
                }`}
              >
                남성
              </button>
              <button
                onClick={() => updateFormData("gender", "여성")}
                className={`h-12 rounded-lg font-medium transition-all ${
                  formData.gender === "여성"
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
              {personalityTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => togglePersonality(type.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    formData.personalities.includes(type.id)
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  # {type.label}
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
              {mbtiTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => updateFormData("mbti", type)}
                  className={`h-12 rounded-lg text-sm font-medium transition-all ${
                    formData.mbti === type
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  {type}
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
              value={formData.personaDescription}
              onChange={(e) => updateFormData("personaDescription", e.target.value)}
              className="text-sm w-full h-32 px-4 py-3 bg-zinc-50 border-0 rounded-lg text-zinc-900 placeholder:text-zinc-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

        </div>

        {}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-zinc-200">
          <Button
            onClick={handleNext}
            disabled={!isFormValid}
            className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-base font-medium disabled:opacity-50 disabled:bg-zinc-300"
          >
            다음 단계로 이동
          </Button>
        </div>
      </div>
    </div>
  );
}