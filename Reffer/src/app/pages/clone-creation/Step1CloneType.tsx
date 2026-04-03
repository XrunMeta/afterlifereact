import { useNavigate } from "react-router";
import { useState } from "react";
import { ArrowLeft, Heart, Gamepad2, BookOpen, Sparkles, Plus, Check } from "lucide-react";
import { Button } from "../../components/ui/button";
import { PageHeader } from "../../components/common/PageHeader";

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

export function Step1CloneType() {
  const navigate = useNavigate();
  const [primaryCategory, setPrimaryCategory] = useState<string>("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [customInterests, setCustomInterests] = useState<string[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInput, setCustomInput] = useState("");

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev =>
      prev.includes(interestId) ? prev.filter(i => i !== interestId) : [...prev, interestId]
    );
  };

  const selectPrimaryCategory = (categoryId: string) => {
    setPrimaryCategory(categoryId);
  };

  const getPrimaryCategory = () => {
    return interestCategories.find(c => c.id === primaryCategory);
  };

  const getSelectedCountInCategory = (categoryId: string) => {
    const category = interestCategories.find(c => c.id === categoryId);
    const categoryInterestIds = category?.interests.map(i => i.id) || [];
    return selectedInterests.filter(id => categoryInterestIds.includes(id)).length;
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

  const handleNext = () => {
    if (selectedInterests.length > 0) {
      navigate("/clone/create/step2");
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {}
      <PageHeader
        onBack={() => navigate("/")}
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
                  <div className="flex gap-2 w-full">
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

        {}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-zinc-200">
          <div className="max-w-md mx-auto">
            {primaryCategory && (
              <div className="text-center mb-2">
                <span className="text-sm text-zinc-500">
                  {selectedInterests.length}개 선택됨
                </span>
              </div>
            )}
            <Button
              onClick={handleNext}
              disabled={selectedInterests.length === 0}
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