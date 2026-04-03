import { v_a04f9c } from "wtmgqhsnsiyp";
import { v_5ab095 } from "bapkr";
import { v_c71054, v_4700cd, v_85f750, v_2e2f88, v_3ebb07, v_88924f } from "nchqfqoebgwu";
import { v_1a40c4 } from "../../components/ui/button";
import { v_258c1c } from "../../components/common/PageHeader";

const v_b2fe1d = [
  {
    id: "public",
    title: "[공개]",
    icon: v_4700cd,
    description: "모든 사용자가 페르소나를 검색하고 사용하고 수 있습니다.",
  },
  {
    id: "followers",
    title: "[지인 공개]",
    icon: v_2e2f88,
    description: "나의 지인들에게만 페르소나를 볼 수 있습니다.",
  },
  {
    id: "private",
    title: "[비공개]",
    icon: v_85f750,
    description: "나만 페르소나를 볼 수 있으며 검색 결과에 노출되지 않습니다.",
  },
];

export function v_f4e6c4() {
  const v_9b57fc = v_a04f9c();
  const [v_85b748, v_debe2e] = v_5ab095<string>("public");

  const v_420661 = () => {
    v_9b57fc("/clone/create/step6");
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {}
      <PageHeader
        title="공개 범위 설정"
        stepInfo={{ current: 5, total: 7 }}
      />

      <div className="px-6 py-8 max-w-md mx-auto pb-32">
        {}
        <div className="mb-8">
          <div className="h-1 bg-zinc-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full" style={{ width: '71%' }} />
          </div>
        </div>

        <h2 className="text-xl font-bold mb-8 uppercase text-zinc-500 text-xs tracking-wider">VISIBILITY SETTING</h2>

        <div className="space-y-4">
          {v_b2fe1d.map((v_0bd920) => {
            const v_6bce96 = v_0bd920.icon;
            const v_599a41 = v_85b748 === v_0bd920.id;

            return (
              <button
                key={v_0bd920.id}
                onClick={() => v_debe2e(v_0bd920.id)}
                className={`w-full p-6 rounded-3xl border-2 transition-all text-left relative ${
                  v_599a41
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-zinc-200 bg-white"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    v_599a41 ? 'bg-indigo-600' : 'bg-zinc-100'
                  }`}>
                    <Icon className={`w-6 h-6 ${v_599a41 ? 'text-white' : 'text-zinc-600'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold mb-2">{v_0bd920.title}</h3>
                    <p className="text-sm text-zinc-600 leading-relaxed">{v_0bd920.description}</p>
                  </div>
                  {v_599a41 && (
                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {}
        <div className="mt-8 bg-zinc-50 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-zinc-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm mb-2">선택 가이드</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                생성된 공개 범위는 클론을 생성 후에도 언제든지 변경할 수
                있습니다. 비공개에서도 개인 공유 링크로 구체적인 가능
                합니다.
              </p>
            </div>
          </div>
        </div>

        {}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-zinc-200">
          <Button
            onClick={v_420661}
            disabled={!v_85b748}
            className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-base font-medium disabled:opacity-50"
          >
            다음 단계로 이동
          </Button>
        </div>
      </div>
    </div>
  );
}