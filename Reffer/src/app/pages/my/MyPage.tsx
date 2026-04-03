import { Link, useNavigate } from "react-router";
import {
  ChevronRight,
  User,
  Bell,
  Shield,
  Edit2,
  BellRing,
  Bookmark,
  X,
  Coins,
  Plus,
  History,
  Users,
  LogOut,
  Settings,
} from "lucide-react";
import profileImage from "figma:asset/8ef462d0b1826696ebf238bf7e33ad6c3df3baa0.png";
import { useState } from "react";
import { PageHeader } from "../../components/common/PageHeader";

const settingsItems = [
  {
    icon: Bookmark,
    label: "저장됨",
    description: "저장된 페르소나 확인",
    path: "/settings/profile",
    isReady: false,
  },
  {
    icon: Users,
    label: "지인관리",
    description: "지인 페르소나 관리",
    path: "/settings/contacts",
    isReady: false,
  },
  {
    icon: User,
    label: "개인 정보 관리",
    description: "이메일 및 연동된 SNS 계정 관리",
    path: "/settings/profile",
    isReady: false,
  },
  {
    icon: BellRing,
    label: "알림 설정",
    description: "업데이트 및 페르소나 메시지 알림",
    path: "/settings/notifications",
    isReady: false,
  },
  {
    icon: Shield,
    label: "개인정보 및 공개 범위",
    description: "내 콘텐츠 공개 범위 설정",
    path: "/settings/privacy",
    isReady: false,
  },
];

export function MyPage() {
  const navigate = useNavigate();
  const [showComingSoon, setShowComingSoon] = useState(false);

  const handleLogout = () => {

    navigate("/oth-path");
  };

  const handleMenuClick = (item: (typeof settingsItems)[0]) => {
    if (!item.isReady) {
      setShowComingSoon(true);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-2">
      {}
      <PageHeader
        title="My Page"
        showBackButton={false}
        rightAction={
          <div className="flex items-center gap-2">
            <button className="p-2">
              <Bell className="w-6 h-6 text-zinc-700" />
            </button>
            <button className="p-2">
              <Settings className="w-6 h-6 text-zinc-700" />
            </button>
          </div>
        }
      />

      <div className="max-w-2xl mx-auto px-6 py-8">
        {}
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <img
              src={profileImage}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover"
            />
            <button className="absolute bottom-0 right-0 w-10 h-10 bg-black rounded-full flex items-center justify-center border-4 border-white">
              <Edit2 className="w-5 h-5 text-white" />
            </button>
          </div>

          <h2 className="text-2xl font-bold text-zinc-900 mb-1">
            김태희
          </h2>
          <p className="text-base text-zinc-500 mb-4">
            @SeniorConsultant_01
          </p>

          {

}
        </div>

        {}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-zinc-400 mb-2 px-1">
            xrun 코인
          </h3>

          {}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-gray-700" />
                <span className="text-gray-600 text-sm font-medium">
                  보유 코인
                </span>
              </div>
              <button
                onClick={() => setShowComingSoon(true)}
                className="px-3.5 py-1.5 bg-black hover:bg-gray-800 text-white text-sm font-bold rounded-full transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                충전
              </button>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">
                12,540
              </span>
              <span className="text-gray-500 text-base">
                xrun
              </span>
            </div>
            <p className="text-gray-500 text-xs mt-1.5">
              약 ₩12,540 상당
            </p>
          </div>

          {

}

          {}
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100">
              <h4 className="font-semibold text-zinc-900 text-sm">
                최근 거래
              </h4>
            </div>
            <div className="divide-y divide-zinc-100">
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-zinc-900 text-sm mb-0.5">
                    페르소나 생성
                  </div>
                  <div className="text-xs text-zinc-500">
                    2024.03.25 14:32
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-red-600 text-sm">
                    -500 xrun
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-zinc-900 text-sm mb-0.5">
                    영상 통화 (15분)
                  </div>
                  <div className="text-xs text-zinc-500">
                    2024.03.24 19:15
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-red-600 text-sm">
                    -300 xrun
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-zinc-900 text-sm mb-0.5">
                    코인 충전
                  </div>
                  <div className="text-xs text-zinc-500">
                    2024.03.23 10:20
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600 text-sm">
                    +10,000 xrun
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowComingSoon(true)}
              className="w-full py-4 text-center text-sm font-medium text-violet-600 hover:bg-violet-50 transition-colors"
            >
              전체 내역 보기
            </button>
          </div>
        </div>

        {}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-zinc-400 mb-2 px-1">
            설정
          </h3>

          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
            {settingsItems.map((item, index) => {
              const Icon = item.icon;
              const Component = item.isReady ? Link : "button";
              const componentProps = item.isReady
                ? { to: item.path }
                : { onClick: () => handleMenuClick(item) };

              return (
                <Component
                  key={index}
                  {...componentProps}
                  className="flex items-center gap-4 p-5 hover:bg-zinc-50 transition-colors border-b border-zinc-100 last:border-b-0 w-full text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-zinc-900" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-zinc-900 mb-0.5">
                      {item.label}
                    </div>
                    <div className="text-sm text-zinc-500">
                      {item.description}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                </Component>
              );
            })}
          </div>
        </div>

        {}
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 py-1 px-2 text-zinc-600 hover:text-zinc-900 transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          로그아웃
        </button>
      </div>

      {}
      {showComingSoon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full relative">
            <button
              onClick={() => setShowComingSoon(false)}
              className="absolute top-4 right-4 p-2 hover:bg-zinc-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>

            <div className="text-center pt-4">
              <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🚀</span>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-3">
                준비 중이에요
              </h3>
              <p className="text-sm text-zinc-600 mb-8">
                이 기능은 현재 개발 중입니다.
                <br />곧 만나볼 수 있어요!
              </p>
              <button
                onClick={() => setShowComingSoon(false)}
                className="w-full h-12 bg-black hover:bg-zinc-800 text-white font-bold rounded-full transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}