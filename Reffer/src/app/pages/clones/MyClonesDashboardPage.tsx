import { v_80cb8d, v_a04f9c } from "wtmgqhsnsiyp";
import {
  v_2e2f88,
  v_143e48,
  v_4b79e2,
  v_d6f9c4,
  v_77b82e,
  v_e91344,
  v_b0beab,
  v_0ae9ff,
  v_5dcc4b,
  v_a07c02,
  v_56d16a,
  v_d9f2c0,
  v_b0159d,
  v_1290fc,
  v_0d4f9d,
  v_a97629,
  v_7c25dd,
  v_d55cb2,
  v_82dea8,
  v_f98afd,
  v_bf60de,
} from "nchqfqoebgwu";
import { v_5ab095 } from "bapkr";
import v_320df2 from "svqjcmpqsqetwpxhrexgsrmdmzathdgjznubcfchavpntqnoasnlinrs";
import v_07c83b from "yzupnvkhgaqjofepaxxnxnudmuvfphzymioglwvpoiooldfufpmwwpjp";
import v_97ea8a from "../../../imports/svg-drf34ufkpk";
import { v_1a40c4 } from "../../components/ui/button";
import { v_258c1c } from "../../components/common/PageHeader";

export const v_4cd149 = [
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
    avatar: v_320df2,
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
    avatar: v_07c83b,
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

export function v_31e4c0() {
  const v_9b57fc = v_a04f9c();
  const [v_757ffe, v_5eb227] = v_5ab095<
    string | null
  >(null);
  const [v_16ef58, v_3e0da5] = v_5ab095<{
    cloneId: string;
    currentState: boolean;
  } | null>(null);
  const [v_7462ec, v_2dbd8f] = v_5ab095<{
    cloneId: string;
    currentVisibility: "public" | "private" | "friends";
  } | null>(null);
  const [v_c9d3fa, v_f32c49] = v_5ab095<string | null>(
    null,
  );
  const [v_699459, v_2bf327] = v_5ab095<
    Record<
      string,
      {
        isActive: boolean;
        visibility: "public" | "private" | "friends";
      }
    >
  >(
    v_4cd149.reduce(
      (v_9f1d92, v_eb25ce) => ({
        ...v_9f1d92,
        [v_eb25ce.id]: {
          isActive: v_eb25ce.isActive,
          visibility: v_eb25ce.visibility,
        },
      }),
      {},
    ),
  );

  const v_2ba0d1 = v_4cd149.filter(
    (v_eb25ce) =>
      v_699459[v_eb25ce.id]?.isActive ?? v_eb25ce.isActive,
  ).length;
  const v_ccd7bf = v_4cd149.length;

  const v_b06644 = (v_6e0fd3) => {
    const v_7d13fd =
      v_699459[v_6e0fd3]?.isActive ?? false;
    v_3e0da5({ cloneId: v_6e0fd3, currentState: v_7d13fd });
  };

  const v_a5c1a8 = () => {
    if (v_16ef58) {
      v_2bf327((v_ba2215) => ({
        ...v_ba2215,
        [v_16ef58.cloneId]: {
          ...v_ba2215[v_16ef58.cloneId],
          isActive: !v_16ef58.currentState,
        },
      }));
      v_3e0da5(null);
    }
  };

  const v_f85cb9 = (v_6e0fd3) => {
    const v_20c675 =
      v_699459[v_6e0fd3]?.visibility ?? "public";
    v_2dbd8f({ cloneId: v_6e0fd3, currentVisibility: v_20c675 });
    v_5eb227(null);
  };

  const v_c9f992 = (
    v_818579,
  ) => {
    if (v_7462ec) {
      v_2bf327((v_ba2215) => ({
        ...v_ba2215,
        [v_7462ec.cloneId]: {
          ...v_ba2215[v_7462ec.cloneId],
          visibility: v_818579,
        },
      }));
      v_2dbd8f(null);
    }
  };

  const v_11a1c9 = (v_6e0fd3) => {
    v_f32c49(v_6e0fd3);
    v_5eb227(null);
  };

  const v_6ff8af = () => {
    if (v_c9d3fa) {

      console.log("Deleting clone:", v_c9d3fa);
      v_f32c49(null);
    }
  };

  const v_82830c = (
    v_818579,
  ) => {
    switch (v_818579) {
      case "public":
        return "공개";
      case "private":
        return "비공개";
      case "friends":
        return "지인공개";
    }
  };

  const v_a6deb1 = (
    v_818579,
  ) => {
    switch (v_818579) {
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
                {v_2ba0d1}
              </span>
              <span className="text-3xl text-zinc-400">
                / {v_ccd7bf}
              </span>
            </div>
          </div>
        </div>

        {}
        <div className="space-y-4">
          {v_4cd149.map((v_eb25ce) => (
            <div
              key={v_eb25ce.id}
              className="bg-white rounded-3xl p-6 pt-2  border border-zinc-200 relative"
            >
              {}
              <div className=" flex items-center gap-1 justify-between mr-[-10px] mb-2">
                 <button
                    onClick={() => v_b06644(v_eb25ce.id)}
                    className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                  >
                    {(v_699459[v_eb25ce.id]?.isActive ?? v_eb25ce.isActive) ? (
                      <CircleDot className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-zinc-400" />
                    )}
                    <span className="text-xs font-medium text-zinc-600">
                      {(v_699459[v_eb25ce.id]?.isActive ?? v_eb25ce.isActive) ? "활동중" : "비활동중"}
                    </span>
                  </button>
                <div className="flex gap-2 items-center">
                  {}

                  {}
                  <div className="flex items-center gap-1 text-sm text-zinc-500 ">
                  {v_a6deb1(
                    v_699459[v_eb25ce.id]?.visibility ??
                      v_eb25ce.visibility,
                  )}
                  <span>
                    {v_82830c(
                      v_699459[v_eb25ce.id]?.visibility ??
                        v_eb25ce.visibility,
                    )}
                  </span>
                </div>
                  {}
                  <button
                    onClick={() =>
                      v_5eb227(
                        v_757ffe === v_eb25ce.id
                          ? null
                          : v_eb25ce.id,
                      )
                    }
                    className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-zinc-400" />
                  </button>
                </div>
                {}
                {v_757ffe === v_eb25ce.id && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => v_5eb227(null)}
                    />
                    <div className="absolute right-0 top-10 z-50 bg-white rounded-xl shadow-lg border border-zinc-200 py-1 min-w-[160px]">
                      <button
                        onClick={() => {
                          v_9b57fc(`/clone/${v_eb25ce.id}/edit`);
                          v_5eb227(null);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-zinc-50 flex items-center gap-3 text-zinc-700"
                      >
                        <Edit className="w-4 h-4" />
                        수정
                      </button>
                      <button
                        onClick={() =>
                          v_f85cb9(v_eb25ce.id)
                        }
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-zinc-50 flex items-center gap-3 text-zinc-700"
                      >
                        {v_a6deb1(
                          v_699459[v_eb25ce.id]?.visibility ??
                            v_eb25ce.visibility,
                        )}
                        공개설정
                      </button>
                      <button
                        onClick={() =>
                          v_11a1c9(v_eb25ce.id)
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
                    src={v_eb25ce.avatar}
                    alt={v_eb25ce.name}
                    className="w-12 h-12 rounded-2xl object-cover"
                  />
                  {(v_699459[v_eb25ce.id]?.isActive ??
                    v_eb25ce.isActive) && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white" />
                  )}
                </div>

                <div className="flex-1 pr-8">
                  <div className="flex flex-col gap-0.5">
                    <h3 className="font-bold text-base">
                      {v_eb25ce.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <span>{v_eb25ce.mainCategory}</span>
                    </div>
                  </div>
                </div>
              </div>

              {}
              <p className="text-sm text-zinc-600 leading-relaxed mb-4">
                {v_eb25ce.description}
              </p>

              {}
              <div className="flex items-center gap-4 mb-4 text-sm text-zinc-500">
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span>{v_eb25ce.likes}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessagesSquare className="w-4 h-4" />
                  <span>{v_eb25ce.interactions}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{v_eb25ce.followers}</span>
                </div>
              </div>

              {}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {v_eb25ce.interests.map((v_e4601c, v_a56041) => (
                  <span
                    key={v_a56041}
                    className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-xs rounded-full"
                  >
                    #{v_e4601c}
                  </span>
                ))}
              </div>

              {}
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    v_9b57fc(`/clone/${v_eb25ce.id}/chat`)
                  }
                  className="flex-1 h-10 rounded-xl bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 17.894 18.9999"
                  >
                    <path d={v_97ea8a.p5b22b80} />
                  </svg>
                  <span className="text-xs font-medium text-zinc-700">
                    학습하기
                  </span>
                </button>

                <Link
                  to={`/clone/${v_eb25ce.id}/call`}
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
      {v_16ef58 && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => v_3e0da5(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full"
            onClick={(v_9e86fd) => v_9e86fd.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-2 text-center">
              {v_16ef58.currentState
                ? "페르소나 비활성화"
                : "페르소나 활성화"}
            </h3>
            <p className="text-sm text-zinc-600 mb-6 text-center">
              {v_16ef58.currentState
                ? "페르소나를 비활성화하시겠습니까? 비활성화 시 다른 사용자에게 노출되지 않습니다."
                : "페르소나를 활성화하시겠습니까? 활성화 시 다른 사용자에게 노출됩니다."}
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => v_3e0da5(null)}
                className="flex-1 h-11 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-full font-medium"
              >
                취소
              </Button>
              <Button
                onClick={v_a5c1a8}
                className="flex-1 h-11 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full font-medium"
              >
                확인
              </Button>
            </div>
          </div>
        </div>
      )}

      {}
      {v_7462ec && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => v_2dbd8f(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full"
            onClick={(v_9e86fd) => v_9e86fd.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-2 text-center">
              공개 설정
            </h3>
            <p className="text-sm text-zinc-600 mb-6 text-center">
              페르소나의 공개 범위를 선택하세요
            </p>
            <div className="space-y-2">
              <button
                onClick={() => v_c9f992("public")}
                className={`w-full h-12 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  v_7462ec.currentVisibility === "public"
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                }`}
              >
                <Eye className="w-4 h-4" />
                공개
              </button>
              <button
                onClick={() => v_c9f992("friends")}
                className={`w-full h-12 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  v_7462ec.currentVisibility ===
                  "friends"
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                }`}
              >
                <UserCheck className="w-4 h-4" />
                지인공개
              </button>
              <button
                onClick={() => v_c9f992("private")}
                className={`w-full h-12 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  v_7462ec.currentVisibility ===
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
              onClick={() => v_2dbd8f(null)}
              className="w-full mt-4 h-11 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-full font-medium"
            >
              취소
            </Button>
          </div>
        </div>
      )}

      {}
      {v_c9d3fa && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => v_f32c49(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full"
            onClick={(v_9e86fd) => v_9e86fd.stopPropagation()}
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
                onClick={() => v_f32c49(null)}
                className="flex-1 h-11 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-full font-medium"
              >
                취소
              </Button>
              <Button
                onClick={v_6ff8af}
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