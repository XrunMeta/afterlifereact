import { useNavigate } from "react-router";
import { CheckCircle2, MessageCircle, LayoutDashboard, Sparkles, Shield, ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";
import successImage from "figma:asset/469421112bbdc914573a1e610fa528e0657ef998.png";
import { PageHeader } from "../../components/common/PageHeader";

export function Step7Complete() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {}
      <PageHeader
        onBack={() => navigate("/")}
        title="페르소나 생성 완료"
        stepInfo={{ current: 7, total: 7 }}
      />

      <div className="px-6 py-8 max-w-md mx-auto pb-32">
        {}
        <div className="mb-8">
          <div className="h-1 bg-zinc-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600" style={{ width: '100%' }} />
          </div>
        </div>

        {}
        <div className="relative mb-8">
          <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-zinc-900">
            <img 
              src="https://images.unsplash.com/photo-1756908992154-c8a89f5e517f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmdXR1cmlzdGljJTIwQUklMjBob2xvZ3JhbXxlbnwxfHx8fDE3NzQ1MjA0NjB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" 
              alt="Clone Complete" 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-6 right-6">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold mb-3 text-center">
          나만의 페르소나가<br />완성되었습니다!
        </h2>
        <p className="text-sm text-zinc-500 text-center mb-12">
          이제 당신의 목소리로 답장 페르소나와<br />
          첫 번째 대화를 시작해보세요.
        </p>

        {}
        <div className="w-full space-y-4 mb-8">
          <div className="flex items-start gap-4 bg-zinc-50 rounded-2xl p-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold mb-1">자동형 학습 최적화</p>
              <p className="text-sm text-zinc-600">
                데이터를 정밀하게 분석하여 당신의 특색할 방식을 생각
                작 으뜸를 성장작으로 구현합니다.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-zinc-50 rounded-2xl p-6">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold mb-1">안전한 데이터 보안</p>
              <p className="text-sm text-zinc-600">
                모든 데이터는 종단간 암호화로 보호됩니다. 페르소나의 권리
                은 전적으로 귀하에게 있습니다.
              </p>
            </div>
          </div>
        </div>

        {}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-zinc-200 space-y-3">
          <Button
            onClick={() => navigate("/clone/1/chat")}
            className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-base font-medium"
          >
            첫 대화 시작하기
          </Button>

          <button
            onClick={() => navigate("/oth-path")}
            className="w-full h-14 bg-white hover:bg-zinc-50 text-zinc-600 rounded-full text-base font-medium"
          >
            나의 페르소나로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}