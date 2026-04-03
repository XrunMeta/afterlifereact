import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Bell, BellOff } from "lucide-react";
import { motion } from "motion/react";
import { PageHeader } from "../../components/common/PageHeader";

export function Step6Creating() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [enableNotification, setEnableNotification] = useState(true);

  useEffect(() => {

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);

          setTimeout(() => {
            navigate("/clone/create/step7");
          }, 1000);
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {}
      <PageHeader
        onBack={() => navigate("/")}
        title="생성 요청 및 대기"
        stepInfo={{ current: 6, total: 7 }}
      />

      <div className="px-6 py-12 max-w-md mx-auto flex flex-col items-center justify-center">
        {}
        <div className="w-full mb-12">
          <div className="h-1 bg-zinc-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-indigo-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {}
        <div className="relative w-full max-w-sm aspect-square bg-zinc-50 rounded-3xl mb-8 flex items-center justify-center">
          {}
          <motion.div
            className="absolute inset-20 rounded-full border-2 border-indigo-200"
            animate={{ rotate: 360, scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-28 rounded-full border-2 border-indigo-300"
            animate={{ rotate: -360, scale: [1, 0.9, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          />

          {}
          <div className="w-32 h-32 rounded-full bg-white shadow-lg flex items-center justify-center">
            <div className="text-center">
              <motion.div
                className="w-12 h-12 mx-auto mb-2"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <svg className="w-full h-full text-indigo-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </motion.div>
            </div>
          </div>

          <div className="absolute bottom-8 left-0 right-0 text-center">
            <div className="inline-block px-4 py-2 bg-white rounded-full shadow-md">
              <span className="text-xs font-medium text-indigo-600">MUSETALK SYNC</span>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-3 text-center">AI 페르소나를 생성하고 있어요</h2>
        <p className="text-sm text-zinc-500 mb-6 text-center">
          약 2~5분 정도 소요될 예상입니다
        </p>

        {}
        <div className="w-full bg-white rounded-2xl p-6 border border-zinc-200 mb-12">
          <div className="flex items-start gap-3 mb-4">
            <Bell className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-sm mb-1">완료 알림 받기</h3>
              <p className="text-sm text-zinc-600">
                생성이 완료되면 푸시 알림으로 알려드릴 겁니다. 예을 잠시 닫으셔도 관잘됩니다.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-zinc-200">
            <span className="text-sm font-medium">푸시 알림 활성화</span>
            <button
              onClick={() => setEnableNotification(!enableNotification)}
              className="relative"
            >
              <div className={`w-12 h-6 rounded-full transition-colors ${
                enableNotification ? "bg-zinc-900" : "bg-zinc-300"
              }`}>
                <motion.div
                  className="absolute top-1 w-4 h-4 bg-white rounded-full"
                  animate={{ left: enableNotification ? "26px" : "4px" }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </button>
          </div>
        </div>

        <p className="text-xs text-zinc-400 text-center">
          네트워크 상태에 따라 시간이 더 걸릴 수 있습니다.
        </p>
      </div>
    </div>
  );
}