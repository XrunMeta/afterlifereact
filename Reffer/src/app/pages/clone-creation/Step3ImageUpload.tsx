import { useNavigate } from "react-router";
import { useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Box, Image as ImageIcon, Check, X, Camera } from "lucide-react";
import { Button } from "../../components/ui/button";
import { PageHeader } from "../../components/common/PageHeader";

const SAMPLE_IMAGE = "https://images.unsplash.com/photo-1734092916915-d16146c0726c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMHBvcnRyYWl0JTIwZnJvbnQlMjBmYWNpbmd8ZW58MXx8fHwxNzc0NTM0MjAwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

const guidelines = [
  { text: "눈, 코, 입이 가려지지 않은 선명한 사진", checked: false },
  { text: "정면을 응시하고 있는 균형 잡힌 구도", checked: false },
  { text: "밝고 고른 조명 조건 (그림자 잘 지지함)", checked: false },
];

export function Step3ImageUpload() {
  const navigate = useNavigate();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [show3DPopup, setShow3DPopup] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGallerySelect = () => {
    setUploadedImage(SAMPLE_IMAGE);
  };

  const handleNext = () => {
    navigate("/clone/create/step4");
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {}
      <PageHeader
        title="이미지 업로드"
        stepInfo={{ current: 3, total: 7 }}
      />

      <div className="px-6 py-8 max-w-md mx-auto pb-32">
        <h2 className="text-2xl font-bold mb-2">정면 얼굴 사진을<br />등록해주세요.</h2>
        <p className="text-sm text-zinc-500 mb-8">
          AI 페르소나를 생성을 위해 고해상도의 정면 사진이 필요합니다. 여러이나 모자 착용은 피해주세요.
        </p>

        {}
        <div className="relative mb-6">
          <div className="aspect-[3/4] rounded-3xl bg-zinc-50 flex items-center justify-center overflow-hidden">
            {uploadedImage ? (
              <img src={uploadedImage} alt="Uploaded" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 rounded-full border-4 border-dashed border-zinc-300 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                      <Camera className="w-6 h-6 text-indigo-600" />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-red-500">● 얼굴 인식대기 중</p>
              </div>
            )}
          </div>

          {uploadedImage && (
            <button
              onClick={() => setUploadedImage(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          )}
        </div>

        {}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <button 
            onClick={handleGallerySelect}
            className="flex items-center justify-center gap-2 h-14 bg-white border-2 border-zinc-900 rounded-2xl hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            <ImageIcon className="w-5 h-5" />
            <span className="font-medium">갤러리 선택</span>
          </button>

          <button 
            onClick={() => setShow3DPopup(true)}
            className="flex items-center justify-center gap-2 h-14 bg-zinc-900 rounded-2xl hover:bg-zinc-800 transition-colors cursor-pointer text-white"
          >
            <Box className="w-5 h-5" />
            <span className="font-medium">3D 이미지</span>
          </button>
        </div>

        {}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <h3 className="font-bold mb-4 text-indigo-600 text-sm">업로드 가이드</h3>
          <div className="space-y-3">
            {guidelines.map((guideline, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className={`w-5 h-5 flex items-center justify-center mt-0.5 shrink-0`}>
                  {guideline.checked ? (
                    <Check className="w-5 h-5 text-indigo-600" />
                  ) : (
                    <Check className="w-5 h-5 text-zinc-300" />
                  )}
                </div>
                <span className="text-sm text-zinc-600 leading-relaxed">
                  {guideline.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white">
          <Button
            onClick={handleNext}
            disabled={!uploadedImage}
            className={`w-full h-14 rounded-full text-base font-medium ${
              uploadedImage 
                ? 'bg-zinc-900 hover:bg-zinc-800 text-white' 
                : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
            }`}
          >
            업로드 진행하기
          </Button>
        </div>
      </div>

      {}
      {show3DPopup && createPortal(
        <>
          {}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
            onClick={() => setShow3DPopup(false)}
          />

          {}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-3rem)] max-w-sm bg-white rounded-3xl z-[110] p-8 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-indigo-100 rounded-full flex items-center justify-center">
                <Box className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-zinc-900">
                준비중입니다
              </h3>
              <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
                3D 이미지 기능은 현재 개발 중입니다.<br />
                곧 더 나은 경험으로 찾아뵙겠습니다.
              </p>
              <button
                onClick={() => setShow3DPopup(false)}
                className="w-full h-12 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}