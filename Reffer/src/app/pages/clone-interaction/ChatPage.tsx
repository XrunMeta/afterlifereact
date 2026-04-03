import { v_a04f9c, v_1a1e9e } from "wtmgqhsnsiyp";
import { v_5ab095 } from "bapkr";
import { v_c71054, v_8d40c5, v_b7a6da, v_d6f9c4, v_6a968e, v_d9f2c0, v_a07c02 } from "nchqfqoebgwu";
import { v_1a40c4 } from "../../components/ui/button";
import { v_1b353f } from "../../components/ui/input";
import { v_94035f } from "../../components/ui/progress";
import { v_258c1c } from "../../components/common/PageHeader";
import v_723687 from "sndwvdajctbcxlnhlfbqbeywdbexzmsppjlyypsfhxwlwhmjtoolifdy";
import v_452ab9 from "kfyfjtcbkeuwpsitddjubxxexmdobgecypshoqyntxkppueipahtcvka";
import v_97ea8a from "../../../imports/svg-drf34ufkpk";
import v_108280 from "topvncoaogvlhrnmgtaxdnrazrwwaknqiszprwjqzmwtwotmwhndeahe";
import v_e179a0 from "pohqptvifeyqbkwnvdyhneaxuakhkqgxesukwpetqlgxygxpjkjjewcl";
import v_96567c from "kvrmtepzickqbtvrotkzltelaksibwpgprxpdugztzmjrcqkaogjtafx";
import v_320df2 from "svqjcmpqsqetwpxhrexgsrmdmzathdgjznubcfchavpntqnoasnlinrs";
import v_07c83b from "yzupnvkhgaqjofepaxxnxnudmuvfphzymioglwvpoiooldfufpmwwpjp";
import v_5dc295 from "xealrpfzxygyrutzntfolwwcojmmoqtrwkgsebvzztlocjsfbylmdtvv";
import v_7398ff from "xhlbraqfvslpdoptlxgdbunynzymjpozerfhjdkikmjxdvggewdzppyz";
import { v_4cd149 } from "../clones/MyClonesDashboardPage";

const v_a906eb = {

  "short-1": { name: "할아버지", image: v_108280 },
  "short-2": { name: "할머니", image: v_e179a0 },
  "short-3": { name: "이선재", image: v_96567c },

  "f1": { name: "경제전문가", image: v_5dc295 },
  "f2": { name: "요가선생님", image: v_7398ff },
};

const v_9b5835 = [
  {
    id: 1,
    sender: "clone",
    text: "AFTHER-V7 당신이 가장 소중하게 생각하는 어린 시절의 기억은 무엇인가요?",
    timestamp: "10:30",
  },
  {
    id: 2,
    sender: "user",
    text: "부모님과 함께 바닷가에서 보냈던 여름날이 기억 나요. 파도 소리와 모래의 촉감이 생생해요.",
    timestamp: "10:31",
  },
  {
    id: 3,
    sender: "clone",
    text: "아름다운 기억이네요. 특히 특별히 좋아하거나 싫어하는 음식이 있나요?",
    timestamp: "10:32",
  },
];

const v_03c87c = [
  "더 구체적으로",
  "다른 주제로",
  "공연 세부 훈련",
];

export function v_28984f() {
  const v_9b57fc = v_a04f9c();
  const { id: v_389afb } = v_1a1e9e();
  const [v_a8cd21, v_fd9c06] = v_5ab095("");
  const [v_fa56e0, v_41d55d] = v_5ab095(v_9b5835);

  const v_3bb57f = v_389afb 
    ? (v_4cd149.find(v_eb25ce => v_eb25ce.id === v_389afb) || v_a906eb[v_389afb])
    : v_a906eb["1"];

  const v_dfb220 = v_3bb57f 
    ? ('name' in v_3bb57f ? v_3bb57f.name : v_a906eb["1"].name)
    : "페르소나";

  const v_0e38ad = v_3bb57f
    ? ('avatar' in v_3bb57f ? v_3bb57f.avatar : ('image' in v_3bb57f ? v_3bb57f.image : v_723687))
    : v_723687;

  const v_465869 = () => {
    if (v_a8cd21.trim()) {
      const v_54d6ff = {
        id: v_fa56e0.length + 1,
        sender: "user" as const,
        text: v_a8cd21,
        timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
      };
      v_41d55d([...v_fa56e0, v_54d6ff]);
      v_fd9c06("");

      setTimeout(() => {
        const v_37c94a = {
          id: v_fa56e0.length + 2,
          sender: "clone" as const,
          text: "네, 이해했습니다. 제가 도와드릴 수 있는 다른 것이 있나요?",
          timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        };
        v_41d55d(v_ba2215 => [...v_ba2215, v_37c94a]);
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white text-zinc-900">
      {}
      <PageHeader
        avatar={{
          src: v_0e38ad,
          alt: v_dfb220,
          name: v_dfb220,
          subtitle: "AI 페르소나"
        }}
        rightAction={
          <button className="p-2">
            <MoreVertical className="w-6 h-6 text-zinc-600" />
          </button>
        }
        bottomContent={
          <div className="bg-gradient-to-br from-orange-50 to-blue-50 rounded-2xl p-4 border border-zinc-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 17.894 18.9999">
                  <path d={v_97ea8a.p5b22b80} />
                </svg>
                <span className="text-sm font-semibold text-zinc-900">페르소나 학습</span>
              </div>
              <span className="text-sm font-bold text-zinc-900">65%</span>
            </div>
            <div className="relative h-2 bg-white rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-400 to-blue-500 rounded-full transition-all" 
                style={{ width: "65%" }} 
              />
            </div>
            <p className="text-xs text-zinc-600 mt-2">대화를 통해 페르소나가 학습하고 있습니다</p>
          </div>
        }
      />

      {}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white">
        {v_fa56e0.map((v_badeaf) => (
          <div key={v_badeaf.id} className="space-y-2">
            {v_badeaf.sender === "clone" && (
              <div className="text-xs text-zinc-400 font-medium tracking-wide mb-2">
                AI TRAINER
              </div>
            )}
            <div className={`flex ${v_badeaf.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`${v_badeaf.sender === "user" ? "max-w-[85%]" : "max-w-[90%]"}`}>
                {v_badeaf.sender === "user" && (
                  <div className="flex items-center justify-end gap-2 mb-2">
                    <span className="text-xs text-zinc-500">{v_badeaf.userName || v_dfb220}</span>
                  </div>
                )}
                <div
                  className={`rounded-2xl px-5 py-4 ${
                    v_badeaf.sender === "user"
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-50 text-zinc-900 border border-zinc-200 shadow-sm"
                  }`}
                >
                  <p className="text-[15px] leading-relaxed">{v_badeaf.text}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {}
      <div className="px-4 py-3 border-t border-zinc-200 bg-white">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-3">
          {v_03c87c.map((v_9b064f, v_a56041) => (
            <button
              key={v_a56041}
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-full text-sm whitespace-nowrap transition-colors text-zinc-900 font-medium"
            >
              {v_9b064f}
            </button>
          ))}
        </div>

        {}
        <div className="flex items-center gap-3">
          <button className="h-12 w-12 bg-zinc-100 hover:bg-zinc-200 rounded-full flex items-center justify-center transition-colors">
            <Plus className="w-5 h-5 text-zinc-600" />
          </button>
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="메시지를 입력하세요..."
              value={v_a8cd21}
              onChange={(v_9e86fd) => v_fd9c06(v_9e86fd.target.value)}
              onKeyPress={(v_9e86fd) => v_9e86fd.key === "Enter" && v_465869()}
              className="bg-zinc-100 border-zinc-200 text-zinc-900 h-12 pr-12 rounded-full"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900">
              <Mic className="w-5 h-5" />
            </button>
          </div>
          <Button
            onClick={v_465869}
            disabled={!v_a8cd21.trim()}
            className="h-12 w-12 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 disabled:bg-zinc-300 p-0 rounded-full"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}