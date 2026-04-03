import { Link, useNavigate } from "react-router";
import {
  Users,
  MessageCircle,
  Activity,
  MoreVertical,
  Video,
  TrendingUp,
  Phone,
  Bell,
  Settings,
  Plus,
  Heart,
  MessagesSquare,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  UserCheck,
  X,
  UserPlus,
  CircleDot,
  Circle,
} from "lucide-react";
import { useState } from "react";
import profile2Image from "figma:asset/a4f88cc3d7d88ec826bb9e7fcea5b5b0f72c77c3.png";
import profile3Image from "figma:asset/504b9a07b473bcf29e7f0ddb31712ad178a81480.png";
import svgPaths from "../../../imports/svg-drf34ufkpk";
import { Button } from "../../components/ui/button";
import { PageHeader } from "../../components/common/PageHeader";

export const myClones = [
  {
    id: "1",
    name: "설독왕",
    avatar:
      "https://images.unsplash.com/photo-1738566061505-556830f8b8f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25maWRlbnQlMjBhc2lhbiUyMGJ1c2luZXNzbWFuJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzc0NTI3MTM1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    type: "추모",
    mainCategory: "전문 지식 및 자기계발",
    description:
      "시장의 변동성이 대한 위험에 대한한 위치에도 리스트입니다.",
    isActive: true,
    likes: "2.4k",
    interactions: "4.5k",
    followers: "15.2k",
    interests: ["경제", "투자", "금융"],
    visibility: "public" as "public" | "private" | "friends",
  },
  {
    id: "2",
    name: "착착박사",
    avatar: profile2Image,
    type: "위안",
    mainCategory: "일상 및 감정 케어",
    description:
      "내일은 분석과 논리적 추론 지원을 천대 다가 모릅니다.",
    isActive: false,
    likes: "842",
    interactions: "3.9k",
    followers: "4.1k",
    interests: ["심리", "상담", "명상"],
    visibility: "public" as "public" | "private" | "friends",
  },
  {
    id: "3",
    name: "타로마스터",
    avatar: profile3Image,
    type: "그리움",
    mainCategory: "엔터테인먼트 및 취미",
    description:
      "일상의 고민과 예측 영적으로 살펴보 도와드릴 수 있습니다.",
    isActive: true,
    likes: "5.9k",
    interactions: "2.2k",
    followers: "32.8k",
    interests: ["타로", "운세", "영성"],
    visibility: "friends" as "public" | "private" | "friends",
  },
];

export function MyClonesDashboardPage() {
  const navigate = useNavigate();
  const [openDropdownId, setOpenDropdownId] = useState<
    string | null
  >(null);
  const [toggleModal, setToggleModal] = useState<{
    cloneId: string;
    currentState: boolean;
  } | null>(null);
  const [visibilityModal, setVisibilityModal] = useState<{
    cloneId: string;
    currentVisibility: "public" | "private" | "friends";
  } | null>(null);
  const [deleteModal, setDeleteModal] = useState<string | null>(
    null,
  );
  const [cloneStates, setCloneStates] = useState<
    Record<
      string,
      {
        isActive: boolean;
        visibility: "public" | "private" | "friends";
      }
    >
  >(
    myClones.reduce(
      (acc, clone) => ({
        ...acc,
        [clone.id]: {
          isActive: clone.isActive,
          visibility: clone.visibility,
        },
      }),
      {},
    ),
  );

  const activeCount = myClones.filter(
    (clone) =>
      cloneStates[clone.id]?.isActive ?? clone.isActive,
  ).length;
  const totalCount = myClones.length;

  const handleToggleClick = (cloneId: string) => {
    const currentState =
      cloneStates[cloneId]?.isActive ?? false;
    setToggleModal({ cloneId, currentState });
  };

  const confirmToggle = () => {
    if (toggleModal) {
      setCloneStates((prev) => ({
        ...prev,
        [toggleModal.cloneId]: {
          ...prev[toggleModal.cloneId],
          isActive: !toggleModal.currentState,
        },
      }));
      setToggleModal(null);
    }
  };

  const handleVisibilityClick = (cloneId: string) => {
    const currentVisibility =
      cloneStates[cloneId]?.visibility ?? "public";
    setVisibilityModal({ cloneId, currentVisibility });
    setOpenDropdownId(null);
  };

  const confirmVisibility = (
    visibility: "public" | "private" | "friends",
  ) => {
    if (visibilityModal) {
      setCloneStates((prev) => ({
        ...prev,
        [visibilityModal.cloneId]: {
          ...prev[visibilityModal.cloneId],
          visibility,
        },
      }));
      setVisibilityModal(null);
    }
  };

  const handleDeleteClick = (cloneId: string) => {
    setDeleteModal(cloneId);
    setOpenDropdownId(null);
  };

  const confirmDelete = () => {
    if (deleteModal) {

      console.log("Deleting clone:", deleteModal);
      setDeleteModal(null);
    }
  };

  const getVisibilityLabel = (
    visibility: "public" | "private" | "friends",
  ) => {
    switch (visibility) {
      case "public":
        return "공개";
      case "private":
        return "비공개";
      case "friends":
        return "지인공개";
    }
  };

  const getVisibilityIcon = (
    visibility: "public" | "private" | "friends",
  ) => {
    switch (visibility) {
      case "public":
        return <Eye className="w-4 h-4" />;
      case "private":
        return <EyeOff className="w-4 h-4" />;
      case "friends":
        return <UserCheck className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 pb-2">
      {}
      <PageHeader 
        title="My Persona"
        showBackButton={false}
        rightAction={
          <button className="p-2">
            <Bell className="w-6 h-6 text-zinc-700" />
          </button>
        }
      />

      <div className="max-w-2xl mx-auto px-4 py-2">
        {}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-1">
            페르소나 대시보드
          </h2>
          <p className="text-sm text-zinc-500">
            생성된 AI 페르소나의 성과를 활용을 관리합니다.
          </p>
        </div>

        {}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-zinc-50 rounded-3xl p-6">
            <div className="flex items-center gap-2">
              <MessagesSquare className="w-4 h-4 text-zinc-400" />
              <span className="text-xs text-zinc-500">
                총 상호작용
              </span>
            </div>
            <div className="text-3xl font-bold mb-1">12.8k</div>
            <div className="text-xs text-green-600 font-medium">
              +14% 지난주 대비
            </div>
          </div>

          <div className="bg-zinc-900 rounded-3xl p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-zinc-400" />
              <span className="text-zinc-400 text-xs">
                페르소나 활동
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-bold text-white">
                {activeCount}
              </span>
              <span className="text-3xl text-zinc-400">
                / {totalCount}
              </span>
            </div>
          </div>
        </div>

        {}
        <div className="space-y-4">
          {myClones.map((clone) => (
            <div
              key={clone.id}
              className="bg-white rounded-3xl p-6 pt-2  border border-zinc-200 relative"
            >
              {}
              <div className=" flex items-center gap-1 justify-between mr-[-10px] mb-2">
                 <button
                    onClick={() => handleToggleClick(clone.id)}
                    className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                  >
                    {(cloneStates[clone.id]?.isActive ?? clone.isActive) ? (
                      <CircleDot className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-zinc-400" />
                    )}
                    <span className="text-xs font-medium text-zinc-600">
                      {(cloneStates[clone.id]?.isActive ?? clone.isActive) ? "활동중" : "비활동중"}
                    </span>
                  </button>
                <div className="flex gap-2 items-center">
                  {}

                  {}
                  <div className="flex items-center gap-1 text-sm text-zinc-500 ">
                  {getVisibilityIcon(
                    cloneStates[clone.id]?.visibility ??
                      clone.visibility,
                  )}
                  <span>
                    {getVisibilityLabel(
                      cloneStates[clone.id]?.visibility ??
                        clone.visibility,
                    )}
                  </span>
                </div>
                  {}
                  <button
                    onClick={() =>
                      setOpenDropdownId(
                        openDropdownId === clone.id
                          ? null
                          : clone.id,
                      )
                    }
                    className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-zinc-400" />
                  </button>
                </div>
                {}
                {openDropdownId === clone.id && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setOpenDropdownId(null)}
                    />
                    <div className="absolute right-0 top-10 z-50 bg-white rounded-xl shadow-lg border border-zinc-200 py-1 min-w-[160px]">
                      <button
                        onClick={() => {
                          navigate(`/clone/${clone.id}/edit`);
                          setOpenDropdownId(null);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-zinc-50 flex items-center gap-3 text-zinc-700"
                      >
                        <Edit className="w-4 h-4" />
                        수정
                      </button>
                      <button
                        onClick={() =>
                          handleVisibilityClick(clone.id)
                        }
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-zinc-50 flex items-center gap-3 text-zinc-700"
                      >
                        {getVisibilityIcon(
                          cloneStates[clone.id]?.visibility ??
                            clone.visibility,
                        )}
                        공개설정
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteClick(clone.id)
                        }
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-zinc-50 flex items-center gap-3 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                        삭제
                      </button>
                    </div>
                  </>
                )}
              </div>

              {}
              <div className="flex items-center gap-4 mb-3">
                <div className="relative">
                  <img
                    src={clone.avatar}
                    alt={clone.name}
                    className="w-12 h-12 rounded-2xl object-cover"
                  />
                  {(cloneStates[clone.id]?.isActive ??
                    clone.isActive) && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white" />
                  )}
                </div>

                <div className="flex-1 pr-8">
                  <div className="flex flex-col gap-0.5">
                    <h3 className="font-bold text-base">
                      {clone.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <span>{clone.mainCategory}</span>
                    </div>
                  </div>
                </div>
              </div>

              {}
              <p className="text-sm text-zinc-600 leading-relaxed mb-4">
                {clone.description}
              </p>

              {}
              <div className="flex items-center gap-4 mb-4 text-sm text-zinc-500">
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span>{clone.likes}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessagesSquare className="w-4 h-4" />
                  <span>{clone.interactions}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{clone.followers}</span>
                </div>
              </div>

              {}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {clone.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-xs rounded-full"
                  >
                    #{interest}
                  </span>
                ))}
              </div>

              {}
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    navigate(`/clone/${clone.id}/chat`)
                  }
                  className="flex-1 h-10 rounded-xl bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 17.894 18.9999"
                  >
                    <path d={svgPaths.p5b22b80} />
                  </svg>
                  <span className="text-xs font-medium text-zinc-700">
                    학습하기
                  </span>
                </button>

                <Link
                  to={`/clone/${clone.id}/call`}
                  className="flex-1 h-10 rounded-xl bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Video className="w-4 h-4 text-zinc-700" />
                  <span className="text-xs font-medium text-zinc-700">
                    통화하기
                  </span>
                </Link>

                <button className="flex-1 h-10 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-xs font-medium text-zinc-700 transition-colors flex items-center justify-center gap-1.5">
                  <UserPlus className="w-4 h-4" />
                  초대
                </button>
              </div>
            </div>
          ))}
        </div>

        {}
        <button className="w-full mt-6 h-12 bg-white hover:bg-zinc-50 rounded-xl text-sm font-medium transition-colors border border-zinc-200">
          더보기
        </button>
      </div>

      {}
      {toggleModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setToggleModal(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-2 text-center">
              {toggleModal.currentState
                ? "페르소나 비활성화"
                : "페르소나 활성화"}
            </h3>
            <p className="text-sm text-zinc-600 mb-6 text-center">
              {toggleModal.currentState
                ? "페르소나를 비활성화하시겠습니까? 비활성화 시 다른 사용자에게 노출되지 않습니다."
                : "페르소나를 활성화하시겠습니까? 활성화 시 다른 사용자에게 노출됩니다."}
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setToggleModal(null)}
                className="flex-1 h-11 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-full font-medium"
              >
                취소
              </Button>
              <Button
                onClick={confirmToggle}
                className="flex-1 h-11 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full font-medium"
              >
                확인
              </Button>
            </div>
          </div>
        </div>
      )}

      {}
      {visibilityModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setVisibilityModal(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-2 text-center">
              공개 설정
            </h3>
            <p className="text-sm text-zinc-600 mb-6 text-center">
              페르소나의 공개 범위를 선택하세요
            </p>
            <div className="space-y-2">
              <button
                onClick={() => confirmVisibility("public")}
                className={`w-full h-12 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  visibilityModal.currentVisibility === "public"
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                }`}
              >
                <Eye className="w-4 h-4" />
                공개
              </button>
              <button
                onClick={() => confirmVisibility("friends")}
                className={`w-full h-12 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  visibilityModal.currentVisibility ===
                  "friends"
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                }`}
              >
                <UserCheck className="w-4 h-4" />
                지인공개
              </button>
              <button
                onClick={() => confirmVisibility("private")}
                className={`w-full h-12 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  visibilityModal.currentVisibility ===
                  "private"
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                }`}
              >
                <EyeOff className="w-4 h-4" />
                비공개
              </button>
            </div>
            <Button
              onClick={() => setVisibilityModal(null)}
              className="w-full mt-4 h-11 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-full font-medium"
            >
              취소
            </Button>
          </div>
        </div>
      )}

      {}
      {deleteModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setDeleteModal(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-2 text-center">
              페르소나 삭제
            </h3>
            <p className="text-sm text-zinc-600 mb-6 text-center">
              정말 이 페르소나를 삭제하시겠습니까?
              <br />
              삭제된 페르소나는 복구할 수 없습니다.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setDeleteModal(null)}
                className="flex-1 h-11 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-full font-medium"
              >
                취소
              </Button>
              <Button
                onClick={confirmDelete}
                className="flex-1 h-11 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium"
              >
                삭제
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}