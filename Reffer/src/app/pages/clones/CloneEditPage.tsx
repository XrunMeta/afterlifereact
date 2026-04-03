import { useNavigate, useParams } from "react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Check, Plus } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { PageHeader } from "../../components/common/PageHeader";
import { myClones } from "./MyClonesDashboardPage";

const interestCategories = [
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

export function CloneEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const clone = myClones.find(c => c.id === id);

  const [primaryCategory, setPrimaryCategory] = useState<string>("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [customInterests, setCustomInterests] = useState<string[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInput, setCustomInput] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    ageRange: "",
    gender: "남성",
    personalities: [] as string[],
    mbti: "",
    personaDescription: "",
  });

  useEffect(() => {
    if (clone) {

      const categoryMapping: Record<string, string> = {
        "일상 및 감정 케어": "emotional",
        "엔터테인먼트 및 취미": "hobby",
        "전문 지식 및 자기계발": "expert",
        "특수 페르소나": "special",
      };

      setPrimaryCategory(categoryMapping[clone.mainCategory] || "");

      setFormData({
        name: clone.name,
        ageRange: "",
        gender: "남성",
        personalities: [],
        mbti: "",
        personaDescription: clone.description,
      });
    }
  }, [clone]);

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

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev =>
      prev.includes(interestId) ? prev.filter(i => i !== interestId) : [...prev, interestId]
    );
  };

  const selectPrimaryCategory = (categoryId: string) => {
    setPrimaryCategory(categoryId);
    setSelectedInterests([]);
    setCustomInterests([]);
  };

  const getPrimaryCategory = () => {
    return interestCategories.find(c => c.id === primaryCategory);
  };

  const addCustomInterest = () => {
    if (customInput.trim()) {
      const customId = `custom_${Date.now()}`;
      setCustomInterests(prev => [...prev, customInput.trim()]);
      setSelectedInterests(prev => [...prev, customId]);
      setCustomInput("");
      setShowCustomInput(false);
    }
  };

  const handleSave = () => {

    navigate("/oth-path");
  };

  if (!clone) {
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
        subtitle={clone.name}
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
            {!primaryCategory && (
              <div className="mb-8">
                <h3 className="font-bold text-lg mb-4">주 카테고리 선택</h3>
                <div className="space-y-3">
                  {interestCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => selectPrimaryCategory(category.id)}
                      className="w-full p-5 rounded-2xl border-2 border-zinc-200 bg-white hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left"
                    >
                      <h4 className="font-bold text-base mb-1">{category.title}</h4>
                      <p className="text-xs text-zinc-500">{category.subtitle}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {}
            {primaryCategory && getPrimaryCategory() && (
              <>
                <div className="space-y-8">
                  {}
                  <div>
                    <div className="mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-indigo-600">
                            {getPrimaryCategory()!.title}
                          </h3>
                          <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full font-medium">
                            주 카테고리
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setPrimaryCategory("");
                            setSelectedInterests([]);
                            setCustomInterests([]);
                          }}
                          className="px-3 py-1.5 border border-zinc-300 rounded-lg text-xs font-medium text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50"
                        >
                          변경
                        </button>
                      </div>
                      <p className="text-xs text-zinc-500">{getPrimaryCategory()!.subtitle}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {getPrimaryCategory()!.interests.map((interest) => {
                        const isSelected = selectedInterests.includes(interest.id);

                        return (
                          <button
                            key={interest.id}
                            onClick={() => toggleInterest(interest.id)}
                            className={`relative p-4 rounded-2xl border-2 transition-all text-left ${
                              isSelected
                                ? "border-indigo-600 bg-indigo-50"
                                : "border-zinc-200 bg-white hover:border-zinc-300"
                            }`}
                          >
                            <div className="text-2xl mb-2">{interest.icon}</div>
                            <div className="text-sm font-semibold text-zinc-900">{interest.label}</div>

                            {isSelected && (
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
                      {customInterests.map((interest, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-indigo-50 border-2 border-indigo-600 rounded-full text-sm font-medium text-indigo-900"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>

                    {showCustomInput ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customInput}
                          onChange={(e) => setCustomInput(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && addCustomInterest()}
                          placeholder="관심사를 입력하세요"
                          className="flex-1 min-w-0 px-4 py-3 border-2 border-zinc-200 rounded-xl focus:border-indigo-600 focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={addCustomInterest}
                          className="shrink-0 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
                        >
                          추가
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowCustomInput(true)}
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
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                className="w-full h-12 px-4 bg-zinc-50 border-0 text-zinc-900 placeholder:text-zinc-400"
              />
            </div>

            {}
            <div className="mb-6">
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
            <div className="mb-6">
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
            <div className="mb-6">
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
            <div className="mb-6">
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
            <div className="mb-6">
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
        </div>

        {}
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t border-zinc-200 z-30">
          <Button
            onClick={handleSave}
            disabled={!formData.name || !formData.ageRange}
            className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-base font-medium disabled:opacity-50 disabled:bg-zinc-300"
          >
            저장하기
          </Button>
        </div>
      </div>
    </div>
  );
}