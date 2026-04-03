import { v_a04f9c, v_1a1e9e } from "wtmgqhsnsiyp";
import { v_5ab095, v_c4deb2 } from "bapkr";
import { v_b0beab, v_b7a6da, v_514216, v_77b82e, v_706a68, v_30afce, v_84fd28, v_56d16a, v_143e48, v_a675a7, v_d55cb2 } from "nchqfqoebgwu";
import { v_329303, v_b8ccdc } from "otsflccxaqqe";
import v_108280 from "topvncoaogvlhrnmgtaxdnrazrwwaknqiszprwjqzmwtwotmwhndeahe";
import v_e179a0 from "pohqptvifeyqbkwnvdyhneaxuakhkqgxesukwpetqlgxygxpjkjjewcl";
import v_96567c from "kvrmtepzickqbtvrotkzltelaksibwpgprxpdugztzmjrcqkaogjtafx";
import v_723687 from "sndwvdajctbcxlnhlfbqbeywdbexzmsppjlyypsfhxwlwhmjtoolifdy";
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

const v_238aa5 = [
  {
    id: 1,
    name: "백합",
    price: 10,
    image: "https://images.unsplash.com/photo-1688312911062-9d54c7c3c38d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaWx5JTIwZmxvd2VyJTIwd2hpdGV8ZW58MXx8fHwxNzc0NTM3MDEzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    emoji: "🤍"
  },
  {
    id: 2,
    name: "카네이션",
    price: 10,
    image: "https://images.unsplash.com/photo-1673656866877-b615f9ca34c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaW5rJTIwY2FybmF0aW9uJTIwZmxvd2VyfGVufDF8fHx8MTc3NDUzNzAxNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    emoji: "💗"
  },
  {
    id: 3,
    name: "해바라기",
    price: 10,
    image: "https://images.unsplash.com/photo-1709183463848-f7a9d68db681?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdW5mbG93ZXIlMjB5ZWxsb3clMjBicmlnaHR8ZW58MXx8fHwxNzc0NTA2Mjc1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    emoji: "🌻"
  },
  {
    id: 4,
    name: "장미",
    price: 10,
    image: "https://images.unsplash.com/photo-1697842609343-0a839fff5d09?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWQlMjByb3NlJTIwZmxvd2VyfGVufDF8fHx8MTc3NDUwNDk1Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    emoji: "🌹"
  },
  {
    id: 5,
    name: "튤립",
    price: 10,
    image: "https://images.unsplash.com/photo-1624676515912-6cf0afb8af02?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0dWxpcCUyMHB1cnBsZSUyMGZsb3dlcnxlbnwxfHx8fDE3NzQ1MzcwMjN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    emoji: "🌷"
  },
  {
    id: 6,
    name: "난초",
    price: 10,
    image: "https://images.unsplash.com/photo-1663536480480-4f57359e1151?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmNoaWQlMjBwaW5rJTIwZmxvd2VyfGVufDF8fHx8MTc3NDQyMTU1OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    emoji: "🌸"
  }
];

interface FloatingGift {
  id: number;
  giftId: number;
  emoji: string;
  x: number;
  y: number;
}

export function v_9219ea() {
  const v_9b57fc = v_a04f9c();
  const { id: v_389afb } = v_1a1e9e();
  const [v_4e2aec, v_326ca4] = v_5ab095(false);
  const [v_9e64e1, v_e064ce] = v_5ab095(false);
  const [v_d416b8, v_2a4980] = v_5ab095(false);
  const [v_e2c945, v_06e986] = v_5ab095(5000);
  const [v_8282fa, v_15c939] = v_5ab095<string | null>(null);
  const [v_605664, v_0f07a9] = v_5ab095<FloatingGift[]>([]);
  const [v_69291f, v_9ef5ef] = v_5ab095(0);
  const [v_85c07b, v_ff0eb0] = v_5ab095(false);

  const v_3bb57f = v_389afb 
    ? (v_4cd149.find(v_eb25ce => v_eb25ce.id === v_389afb) || v_a906eb[v_389afb])
    : v_a906eb["1"];

  const v_dfb220 = v_3bb57f 
    ? ('name' in v_3bb57f ? v_3bb57f.name : v_a906eb["1"].name)
    : "페르소나";

  const v_0e38ad = v_3bb57f
    ? ('avatar' in v_3bb57f ? v_3bb57f.avatar : ('image' in v_3bb57f ? v_3bb57f.image : v_108280))
    : v_108280;

  const v_377af2 = () => {
    v_9b57fc(-1);
  };

  const v_348778 = (gift: typeof v_238aa5[0]) => {
    if (v_e2c945 < v_bbee9c.price) {
      v_15c939("크레딧이 부족합니다");
      return;
    }

    v_06e986(v_ba2215 => v_ba2215 - v_bbee9c.price);

    v_15c939(`${v_bbee9c.name}을 선물했습니다`);

    const v_90ca83 = {
      id: v_69291f,
      giftId: v_bbee9c.id,
      emoji: v_bbee9c.emoji,
      x: Math.random() * 60 - 30, 
      y: 0
    };
    v_0f07a9(v_ba2215 => [...v_ba2215, v_90ca83]);
    v_9ef5ef(v_ba2215 => v_ba2215 + 1);

    setTimeout(() => {
      v_0f07a9(v_ba2215 => v_ba2215.filter(v_206b88 => v_206b88.id !== v_90ca83.id));
    }, 3000);

    v_2a4980(false);
  };

  v_c4deb2(() => {
    if (v_8282fa) {
      const v_cb36b1 = setTimeout(() => {
        v_15c939(null);
      }, 2000);
      return () => clearTimeout(v_cb36b1);
    }
  }, [v_8282fa]);

  return (
    <div className="fixed inset-0 h-screen bg-zinc-950 overflow-hidden">
      {}
      <div className="absolute inset-0">
        <img
          src={v_0e38ad}
          alt="Clone Video"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-zinc-950/60" />
      </div>

      {}
      <div className="absolute top-4 left-4 w-28 h-40 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl z-10">
        {v_9e64e1 ? (
          <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
            <VideoOff className="w-8 h-8 text-zinc-600" />
          </div>
        ) : (
          <img
            src={v_723687}
            alt="You"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {}
      <div className="absolute top-4 right-4 z-20">
        <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
          <span className="text-white text-sm font-bold">{v_e2c945.toLocaleString()} XRUN</span>
        </div>
      </div>

      {}
      <div className="absolute top-8 left-0 right-0 text-center z-10">
        <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">{v_dfb220}</h2>
        <div className="inline-flex items-center gap-2 bg-green-500/90 px-4 py-2 rounded-full backdrop-blur-sm">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-white text-sm font-medium">통화 중 03:24</span>
        </div>
      </div>

      {}
      <div className="absolute right-4 bottom-40 flex flex-col gap-4 z-20">
        {}
        <button
          onClick={() => v_2a4980(!v_d416b8)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all backdrop-blur-md ${
            v_d416b8 ? "bg-violet-500" : "bg-black/30"
          } hover:bg-violet-500/80`}
        >
          <Gift className="w-6 h-6 text-white" />
        </button>

        {}
        <button
          onClick={() => v_ff0eb0(!v_85c07b)}
          className="w-14 h-14 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center hover:bg-red-500/50 transition-all"
        >
          <Heart className={`w-6 h-6 transition-all ${v_85c07b ? "fill-red-500 text-red-500" : "text-white"}`} />
        </button>

        {}
        <button className="w-14 h-14 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all">
          <MessageCircle className="w-6 h-6 text-white" />
        </button>

        {}
        <button className="w-14 h-14 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all">
          <Share2 className="w-6 h-6 text-white" />
        </button>
      </div>

      {}
      <AnimatePresence>
        {v_605664.map((v_bbee9c) => (
          <motion.div
            key={v_bbee9c.id}
            className="absolute text-6xl z-30 pointer-events-none"
            initial={{ 
              x: "50%", 
              y: "50%",
              scale: 0,
              opacity: 0
            }}
            animate={{ 
              x: `calc(50% + ${v_bbee9c.x}vw)`,
              y: "-20%",
              scale: [0, 1.2, 1],
              opacity: [0, 1, 1, 0],
              rotate: [0, 10, -10, 0]
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 2.5,
              ease: "easeOut"
            }}
          >
            {v_bbee9c.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {}
      <AnimatePresence>
        {v_d416b8 && (
          <>
            {}
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => v_2a4980(false)}
            />

            {}
            <motion.div
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[50vh] overflow-hidden"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              {}
              <div className="flex items-center justify-between p-6 border-b border-zinc-200">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-zinc-900">선물 보내기</h3>
                  <div className="px-3 py-1 bg-violet-100 rounded-full">
                    <span className="text-sm font-bold text-violet-600">{v_e2c945.toLocaleString()} XRUN</span>
                  </div>
                </div>
                <button
                  onClick={() => v_2a4980(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-600" />
                </button>
              </div>

              {}
              <div className="p-6 overflow-y-auto max-h-[calc(50vh-100px)]">
                <div className="grid grid-cols-3 gap-4">
                  {v_238aa5.map((v_bbee9c) => (
                    <button
                      key={v_bbee9c.id}
                      onClick={() => v_348778(v_bbee9c)}
                      className="flex flex-col items-center gap-2 p-4 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-all active:scale-95"
                    >
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-white shadow-md">
                        <img
                          src={v_bbee9c.image}
                          alt={v_bbee9c.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-sm font-medium text-zinc-900">{v_bbee9c.name}</span>
                      <span className="text-xs font-bold text-violet-600">{v_bbee9c.price} XRUN</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {}
      <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center gap-6">
            {}
            <button
              onClick={() => v_326ca4(!v_4e2aec)}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                v_4e2aec
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-zinc-900/80 hover:bg-zinc-800/80"
              } backdrop-blur-sm`}
            >
              {v_4e2aec ? (
                <MicOff className="w-7 h-7 text-white" />
              ) : (
                <Mic className="w-7 h-7 text-white" />
              )}
            </button>

            {}
            <button
              onClick={v_377af2}
              className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all shadow-2xl shadow-red-500/50"
            >
              <Phone className="w-8 h-8 text-white rotate-[135deg]" />
            </button>

            {}
            <button
              onClick={() => v_e064ce(!v_9e64e1)}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                v_9e64e1
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-zinc-900/80 hover:bg-zinc-800/80"
              } backdrop-blur-sm`}
            >
              {v_9e64e1 ? (
                <VideoOff className="w-7 h-7 text-white" />
              ) : (
                <Video className="w-7 h-7 text-white" />
              )}
            </button>
          </div>

          {

}
        </div>
      </div>

      {}
      {v_8282fa && (
        <motion.div
          className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-full shadow-lg z-50 backdrop-blur-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          {v_8282fa}
        </motion.div>
      )}
    </div>
  );
}