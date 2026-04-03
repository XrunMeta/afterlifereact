import { v_5ab095, v_df9f57, v_c4deb2 } from "bapkr";
import {
  v_56d16a,
  v_143e48,
  v_77b82e,
  v_a675a7,
  v_d29571,
  v_b0beab,
  v_d6f9c4,
  v_d55cb2,
  v_8d40c5,
  v_45a130,
  v_a9bae4,
  v_27dabc,
  v_6a968e,
  v_d9f2c0,
  v_66816c,
  v_0ae9ff,
} from "nchqfqoebgwu";
import { v_1a40c4 } from "../../components/ui/button";
import { v_a04f9c } from "wtmgqhsnsiyp";
import v_1710ec from "hygurqrseer";
import v_4c9b6e from "txiocjdesyjqcengktbobpczjevabwapkwspcrymjktdtmrcsnhycuwz";
import v_108280 from "topvncoaogvlhrnmgtaxdnrazrwwaknqiszprwjqzmwtwotmwhndeahe";
import v_e179a0 from "pohqptvifeyqbkwnvdyhneaxuakhkqgxesukwpetqlgxygxpjkjjewcl";
import v_723687 from "sndwvdajctbcxlnhlfbqbeywdbexzmsppjlyypsfhxwlwhmjtoolifdy";
import v_320df2 from "svqjcmpqsqetwpxhrexgsrmdmzathdgjznubcfchavpntqnoasnlinrs";
import v_07c83b from "yzupnvkhgaqjofepaxxnxnudmuvfphzymioglwvpoiooldfufpmwwpjp";
import v_5dc295 from "xealrpfzxygyrutzntfolwwcojmmoqtrwkgsebvzztlocjsfbylmdtvv";
import v_7398ff from "xhlbraqfvslpdoptlxgdbunynzymjpozerfhjdkikmjxdvggewdzppyz";
import v_452ab9 from "ednyahnmpzagkeqzxiwmwhcpaqetjtwdhlmbdqgscpnbyzdtgucacoax";
import { v_4cd149 } from "../clones/MyClonesDashboardPage";
import v_97ea8a from "../../../imports/svg-drf34ufkpk";
import { v_258c1c } from "../../components/common/PageHeader";

const v_a48e44 = [
  {
    id: "f1",
    name: "경제전문가",
    avatar: v_5dc295,
    type: "재미",
    userName: "@economic_master",
    interests: ["경제", "주식", "부동산"],
    isMyPersona: false,
    creatorAccount: "@economy_lover_99",
    intimacy: 68,
    interactions: 2340,
  },
  {
    id: "f2",
    name: "요가선생님",
    avatar: v_7398ff,
    type: "위안",
    userName: "@yoga_healer",
    interests: ["건강", "명상", "요가"],
    isMyPersona: false,
    creatorAccount: "@wellness_kim",
    intimacy: 82,
    interactions: 1567,
  },
];

const v_a2478a = v_a48e44.map((v_5ed063) => ({
  ...v_5ed063,
  creatorAvatar: v_5ed063.avatar,
}));

const v_09f9d7 = [
  {
    id: 3,
    personaId: "f1", 
    content:
      "부동산 시장의 새로운 트렌드를 분석했습니다. 지금이 기회일 수 있습니다.",
    image: v_5dc295,
    likes: 2100,
    comments: 67,
  },
  {
    id: 5,
    personaId: "f2", 
    content:
      "아침 명상으로 하루를 시작하세요. 5분의 고요함이 당신의 하루를 바꿉니다.",
    image: v_7398ff,
    likes: 1800,
    comments: 45,
  },
];

const v_5b3987 = {
  1: [
    {
      id: "c1",
      author: "@investor_kim",
      authorAvatar: v_723687,
      content: "정말 유익한 분석입니다! 감사합니다.",
      timestamp: "5분 전",
    },
    {
      id: "c2",
      author: "@market_lover",
      authorAvatar: v_320df2,
      content: "장기 투자 관점으로 접근하겠습니다.",
      timestamp: "12분 전",
    },
    {
      id: "c3",
      author: "@finance_pro",
      authorAvatar: v_07c83b,
      content: "좋은 인사이트네요 👍",
      timestamp: "20분 전",
    },
  ],
  2: [
    {
      id: "c4",
      author: "@healing_soul",
      authorAvatar: v_320df2,
      content: "위로가 됩니다. 감사해요 💙",
      timestamp: "3분 전",
    },
    {
      id: "c5",
      author: "@mindful_life",
      authorAvatar: v_07c83b,
      content: "오늘도 힘내세요!",
      timestamp: "15분 전",
    },
  ],
  3: [
    {
      id: "c6",
      author: "@realestate_king",
      authorAvatar: v_320df2,
      content: "부동산 트렌드 분석 잘 봤습니다!",
      timestamp: "1분 전",
    },
  ],
};

const v_3640ac = (v_9e8c70): string => {
  if (v_9e8c70 >= 1000) {
    return `${(v_9e8c70 / 1000).toFixed(1)}k`;
  }
  return v_9e8c70.toString();
};

const v_0e7586 = [
  {
    personaId: "1",
    lastCallTime: "2시간 전",
    duration: "15분 32초",
  },
  {
    personaId: "f2",
    lastCallTime: "어제",
    duration: "8분 21초",
  },
  {
    personaId: "2",
    lastCallTime: "3일 전",
    duration: "22분 45초",
  },
];

export function v_c7f3a8() {
  const v_9b57fc = v_a04f9c();
  const [v_69ddfb, v_09b78b] =
    v_5ab095("전체");
  const [v_c591dc, v_6f4b5a] = v_5ab095<Set<number>>(
    new Set(),
  );
  const [v_979611, v_4d5a2e] = v_5ab095<
    Set<number>
  >(new Set());
  const [v_8282fa, v_15c939] = v_5ab095<
    string | null
  >(null);
  const [v_4a9dbf, v_19a788] = v_5ab095<
    number | null
  >(null);
  const [v_48e7fe, v_856f84] = v_5ab095("");
  const [v_19d981, v_0b74f4] = v_5ab095<
    Set<string>
  >(new Set());
  const [v_ae1a69, v_69e056] =
    v_5ab095<string | null>(null);
  const [v_15a54d, v_649cb3] =
    v_5ab095(false);
  const [v_a24949, v_0af5ed] =
    v_5ab095(false);
  const [v_7a6173, v_b8e287] = v_5ab095(true);
  const [v_86b43f, v_ff095d] = v_5ab095(0);
  const [v_af84de, v_22a5cb] = v_5ab095(false);
  const [v_2116d2, v_83f9d3] = v_5ab095("");

  const v_e784f2 = v_df9f57(() => {
    return v_0e7586
      .map((v_51c3d2) => {
        const v_5ed063 = v_a2478a.find(
          (v_e2a85c) => v_e2a85c.id === v_51c3d2.personaId,
        );
        return {
          ...v_51c3d2,
          persona: v_5ed063,
        };
      })
      .filter((v_8c0b26) => v_8c0b26.persona);
  }, []);

  const v_94f30e = v_df9f57(() => {
    if (!v_2116d2.trim()) {
      return v_a2478a;
    }
    const v_7c5791 = v_2116d2.toLowerCase();
    return v_a2478a.filter(
      (v_5ed063) =>
        v_5ed063.name.toLowerCase().includes(v_7c5791) ||
        v_5ed063.creatorAccount.toLowerCase().includes(v_7c5791),
    );
  }, [v_2116d2]);

  const v_103d7a = v_df9f57(() => {
    const v_d3fd6e = new Set<string>();
    v_a2478a.forEach((v_5ed063) => {
      v_5ed063.interests.forEach((v_e4601c) =>
        v_d3fd6e.add(v_e4601c),
      );
    });
    return Array.from(v_d3fd6e);
  }, []);

  const v_8bc599 = v_df9f57(() => {
    return ["전체", ...v_103d7a];
  }, [v_103d7a]);

  const v_47f7a9 = v_df9f57(() => {
    let v_b94d82 = v_09f9d7;

    v_b94d82 = v_b94d82.filter(
      (v_4f438a) => !v_19d981.has(v_4f438a.personaId),
    );

    if (v_69ddfb === "전체") {
      return v_b94d82;
    }

    if (v_69ddfb === "내 페르소나") {
      const v_1100d2 = v_a2478a
        .filter((v_e2a85c) => v_e2a85c.isMyPersona)
        .map((v_e2a85c) => v_e2a85c.id);
      return v_b94d82.filter((v_4f438a) =>
        v_1100d2.includes(v_4f438a.personaId),
      );
    }

    const v_dfcd18 = v_a2478a
      .filter((v_e2a85c) => v_e2a85c.interests.includes(v_69ddfb))
      .map((v_e2a85c) => v_e2a85c.id);
    return v_b94d82.filter((v_4f438a) =>
      v_dfcd18.includes(v_4f438a.personaId),
    );
  }, [v_69ddfb, v_19d981]);

  const v_397c08 = v_df9f57(() => {
    return v_47f7a9.map((v_4f438a) => {
      const v_5ed063 = v_a2478a.find(
        (v_e2a85c) => v_e2a85c.id === v_4f438a.personaId,
      );
      return {
        ...v_4f438a,
        personaName: v_5ed063?.name || "",
        personaAvatar: v_5ed063?.avatar || v_452ab9,
        personaUserName: v_5ed063?.userName || "",
        personaInterests: v_5ed063?.interests || [],
        creatorAccount: v_5ed063?.creatorAccount || "",
        creatorAvatar:
          v_5ed063?.creatorAvatar || v_452ab9,
        isMyPersona: v_5ed063?.isMyPersona || false,
        intimacy: v_5ed063?.intimacy || 0,
        interactions: v_5ed063?.interactions || 0,
      };
    });
  }, [v_47f7a9]);

  const v_1b6c92 = {
    dots: false,
    infinite: false,
    speed: 300,
    slidesToShow: 1,
    slidesToScroll: 1,
    swipeToSlide: true,
    arrows: false,
    variableWidth: true,
    centerMode: false,
  };

  const v_a96ced = (v_e700e5) => {
    v_6f4b5a((v_ba2215) => {
      const v_d38aef = new Set(v_ba2215);
      if (v_d38aef.has(v_e700e5)) {
        v_d38aef.delete(v_e700e5);
      } else {
        v_d38aef.add(v_e700e5);
      }
      return v_d38aef;
    });
  };

  const v_38c943 = (v_e700e5) => {
    v_4d5a2e((v_ba2215) => {
      const v_d38aef = new Set(v_ba2215);
      const v_ef4892 = v_d38aef.has(v_e700e5);

      if (v_ef4892) {
        v_d38aef.delete(v_e700e5);
        v_15c939("저장 취소했습니다");
      } else {
        v_d38aef.add(v_e700e5);
        v_15c939("저장되었습니다");
      }
      return v_d38aef;
    });
  };

  const v_0c1b24 = () => {
    if (v_48e7fe.trim()) {

      console.log("댓글 전송:", v_48e7fe);
      v_856f84("");
    }
  };

  const v_716856 = () => {
    if (v_ae1a69) {
      v_0b74f4((v_ba2215) => {
        const v_d38aef = new Set(v_ba2215);
        v_d38aef.add(v_ae1a69);
        return v_d38aef;
      });
      v_69e056(null);
    }
  };

  const v_421a2e = v_4a9dbf
    ? v_397c08.find(
        (v_e2a85c) => v_e2a85c.id === v_4a9dbf,
      )
    : null;
  const v_3a63e7 = v_4a9dbf
    ? v_5b3987[v_4a9dbf] || []
    : [];

  v_c4deb2(() => {
    if (v_8282fa) {
      const v_cb36b1 = setTimeout(() => {
        v_15c939(null);
      }, 2000);
      return () => clearTimeout(v_cb36b1);
    }
  }, [v_8282fa]);

  v_c4deb2(() => {
    const v_941b26 = () => {
      const v_c1c8c6 = window.scrollY;
      if (v_c1c8c6 > v_86b43f && v_c1c8c6 > 100) {
        v_b8e287(false);
      } else {
        v_b8e287(true);
      }
      v_ff095d(v_c1c8c6);
    };

    window.addEventListener("scroll", v_941b26);

    return () => {
      window.removeEventListener("scroll", v_941b26);
    };
  }, [v_86b43f]);

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {}
      <PageHeader 
        title="Following"
        showBackButton={false}
        rightAction={
          <button className="p-2">
            <Bell className="w-6 h-6 text-zinc-700" />
          </button>
        }
      />

       {}
        <div className="pb-4 pt-4 px-4">
          <Slider
            {...v_1b6c92}
            className="category-slider"
          >
            {v_8bc599.map((v_8b9cd4) => (
              <div key={v_8b9cd4}>
                <button
                  onClick={() => v_09b78b(v_8b9cd4)}
                  className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all font-medium mr-2 ${
                    v_69ddfb === v_8b9cd4
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {v_8b9cd4}
                </button>
              </div>
            ))}
          </Slider>
        </div>

      {}
      <div className="max-w-2xl mx-auto">
        {v_397c08.map((v_4f438a) => (
          <div key={v_4f438a.id} className="bg-white mb-4">
            {

}
            {}
            <div className="px-4">
              <div className="relative rounded-3xl overflow-hidden bg-zinc-100">
                <img
                  src={v_4f438a.image}
                  alt="Post"
                  className="w-full aspect-[3/4] object-cover"
                />

                {}
                <div className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full">
                  <button
                    onClick={(v_9e86fd) => {
                      v_9e86fd.stopPropagation();
                      v_649cb3(true);
                    }}
                    className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                  >
                    <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-white text-xs font-semibold">
                      {v_4f438a.intimacy}°C
                    </span>
                  </button>
                  <div className="w-px h-3 bg-white/30" />
                  <button
                    onClick={(v_9e86fd) => {
                      v_9e86fd.stopPropagation();
                      v_0af5ed(true);
                    }}
                    className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                  >
                    <MessagesSquare className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-white text-xs font-semibold">
                      {v_3640ac(
                        v_4f438a.interactions,
                      )}
                    </span>
                  </button>
                </div>

                {}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />

                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-white font-medium">
                    {v_4f438a.personaName}
                  </p>
                   <p className="text-xs text-white mb-2">
                    {v_4f438a.creatorAccount}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {v_4f438a.personaInterests.map(
                      (v_e4601c, v_a56041) => (
                        <span
                          key={v_a56041}
                          className="px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full"
                        >
                          #{v_e4601c}
                        </span>
                      ),
                    )}
                  </div>
                  <p className="text-white/90 text-sm mb-6 line-clamp-3">
                    {v_4f438a.content}
                  </p>

                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        v_9b57fc(
                          `/clone/${v_4f438a.personaId}/call`,
                        )
                      }
                      className="flex-1 h-12 bg-white hover:bg-zinc-100 text-zinc-900 rounded-full font-medium"
                    >
                      <Video className="w-4 h-4 mr-2" />
                      통화하기
                    </Button>
                    {v_4f438a.isMyPersona ? (
                      <Button
                        onClick={() =>
                          v_9b57fc(
                            `/clone/${v_4f438a.personaId}/chat`,
                          )
                        }
                        className="flex-1 h-12 bg-white/20 hover:bg-white/30 text-white border border-white/40 rounded-full font-medium backdrop-blur-sm"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="currentColor"
                          viewBox="0 0 17.894 18.9999"
                        >
                          <path d={v_97ea8a.p5b22b80} />
                        </svg>
                        학습하기
                      </Button>
                    ) : (
                      <Button
                        onClick={() =>
                          v_69e056(
                            v_4f438a.personaId,
                          )
                        }
                        className="flex-1 h-12 bg-white/20 hover:bg-white/30 text-white border border-white/40 rounded-full font-medium backdrop-blur-sm"
                      >
                        <UserMinus className="w-4 h-4 mr-2" />
                        팔로우 취소
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {}
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => v_a96ced(v_4f438a.id)}
                  className="flex items-center gap-1"
                >
                  <Heart
                    className={`w-6 h-6 transition-all ${
                      v_c591dc.has(v_4f438a.id)
                        ? "fill-red-500 text-red-500"
                        : "text-zinc-700"
                    }`}
                  />
                </button>

                <button
                  className="flex items-center gap-1"
                  onClick={() => v_19a788(v_4f438a.id)}
                >
                  <MessageCircle className="w-6 h-6 text-zinc-700" />
                </button>

                <button className="flex items-center gap-1">
                  <Share2 className="w-6 h-6 text-zinc-700" />
                </button>
                {

}
              </div>

              {}
              <div className="px-4 flex-column items-center text-right">
                <p className="font-semibold text-xs">
                  좋아요{" "}
                  {v_4f438a.likes +
                    (v_c591dc.has(v_4f438a.id) ? 1 : 0)}
                  개
                </p>
                <p className="text-zinc-500 text-xs mt-1">
                  댓글 {v_5b3987[v_4f438a.id]?.length || 0}개
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {}
      {v_4a9dbf && (
        <div
          className="fixed inset-0 bg-black/50 z-150 flex items-end"
          onClick={() => v_19a788(null)}
        >
          <div
            className="bg-white w-full rounded-t-3xl max-h-[80vh] flex flex-col overflow-hidden"
            onClick={(v_9e86fd) => v_9e86fd.stopPropagation()}
          >
            {}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
              <h2 className="text-base font-semibold">
                댓글 {v_3a63e7.length}개
              </h2>
              <button
                onClick={() => v_19a788(null)}
                className="p-1"
              >
                <X className="w-6 h-6 text-zinc-600" />
              </button>
            </div>

            {}
            {v_421a2e && (
              <div className="flex items-start gap-3 px-4 py-3 border-b border-zinc-200">
                <img
                  src={v_421a2e.creatorAvatar}
                  alt={v_421a2e.creatorAccount}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">
                      {v_421a2e.personaName}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {v_421a2e.creatorAccount}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-700">
                    {v_421a2e.content}
                  </p>
                </div>
              </div>
            )}

            {}
            <div
              className="overflow-y-auto px-4 py-3"
              style={{ maxHeight: "calc(80vh - 250px)" }}
            >
              {v_3a63e7.length > 0 ? (
                <div className="space-y-4">
                  {v_3a63e7.map((v_61b01a) => (
                    <div
                      key={v_61b01a.id}
                      className="flex gap-3"
                    >
                      <img
                        src={v_61b01a.authorAvatar}
                        alt={v_61b01a.author}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">
                            {v_61b01a.author}
                          </span>
                          <span className="text-xs text-zinc-400">
                            {v_61b01a.timestamp}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-700">
                          {v_61b01a.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <MessageCircle className="w-12 h-12 text-zinc-300 mb-2" />
                  <p className="text-zinc-400 text-sm">
                    아직 댓글이 없습니다
                  </p>
                  <p className="text-zinc-400 text-xs">
                    첫 번째 댓글을 작성해보세요!
                  </p>
                </div>
              )}
            </div>

            {}
            <div className="border-t border-zinc-200 px-4 py-3 flex items-center gap-3 bg-white flex-shrink-0">
              <img
                src={v_452ab9}
                alt="My profile"
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1 flex items-center gap-2 bg-zinc-100 rounded-full px-4 py-2">
                <input
                  type="text"
                  placeholder="댓글 달기..."
                  value={v_48e7fe}
                  onChange={(v_9e86fd) =>
                    v_856f84(v_9e86fd.target.value)
                  }
                  onKeyPress={(v_9e86fd) =>
                    v_9e86fd.key === "Enter" && v_0c1b24()
                  }
                  className="flex-1 bg-transparent outline-none text-sm"
                />
                <button
                  onClick={v_0c1b24}
                  disabled={!v_48e7fe.trim()}
                  className={`${
                    v_48e7fe.trim()
                      ? "text-blue-500"
                      : "text-zinc-300"
                  }`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {}
      {v_ae1a69 && (
        <div
          className="fixed inset-0 bg-black/50 z-150 flex items-center justify-center p-4"
          onClick={() => v_69e056(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full"
            onClick={(v_9e86fd) => v_9e86fd.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-2 text-center">
              팔로우 취소
            </h3>
            <p className="text-sm text-zinc-600 mb-6 text-center">
              정말 이 페르소나의 팔로우를 취소하시겠습니까?
              <br />
              피드에서 해당 페르소나의 포스트가 더 이상 표시되지
              않습니다.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => v_69e056(null)}
                className="flex-1 h-11 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-full font-medium"
              >
                취소
              </Button>
              <Button
                onClick={v_716856}
                className="flex-1 h-11 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium"
              >
                팔로우 취소
              </Button>
            </div>
          </div>
        </div>
      )}

      {}
      {v_8282fa && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full z-160">
          {v_8282fa}
        </div>
      )}

      {}
      {v_15a54d && (
        <div
          className="fixed inset-0 bg-black/50 z-150 flex items-center justify-center p-4"
          onClick={() => v_649cb3(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full"
            onClick={(v_9e86fd) => v_9e86fd.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-orange-400" />
                <h3 className="text-lg font-semibold">
                  친밀도 온도
                </h3>
              </div>
              <button
                onClick={() => v_649cb3(false)}
              >
                <X className="w-6 h-6 text-zinc-400" />
              </button>
            </div>
            <p className="text-sm text-zinc-600 leading-relaxed mb-4">
              친밀도 온도는 페르소나와의 관계 깊이를 나타냅니다.
              대화를 나누고 상호작용할수록 온도가 올라가며, 더욱
              자연스럽고 개인화된 대화가 가능해집니다.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-16 font-medium text-zinc-700">
                  0-30°C
                </span>
                <span className="text-zinc-500">
                  처음 만나는 단계
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-16 font-medium text-zinc-700">
                  31-60°C
                </span>
                <span className="text-zinc-500">
                  친숙해지는 단계
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-16 font-medium text-zinc-700">
                  61-90°C
                </span>
                <span className="text-zinc-500">
                  깊은 유대감 형성
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-16 font-medium text-orange-500">
                  91-100°C
                </span>
                <span className="text-orange-500">
                  최고의 친밀도
                </span>
              </div>
            </div>
            <Button
              onClick={() => v_649cb3(false)}
              className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full font-medium mt-6"
            >
              확인
            </Button>
          </div>
        </div>
      )}

      {}
      {v_a24949 && (
        <div
          className="fixed inset-0 bg-black/50 z-150 flex items-center justify-center p-4"
          onClick={() => v_0af5ed(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full"
            onClick={(v_9e86fd) => v_9e86fd.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessagesSquare className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold">
                  상호작용 횟수
                </h3>
              </div>
              <button
                onClick={() => v_0af5ed(false)}
              >
                <X className="w-6 h-6 text-zinc-400" />
              </button>
            </div>
            <p className="text-sm text-zinc-600 leading-relaxed mb-4">
              상호작용 횟수는 페르소나와 나눈 대화, 통화, 학습
              활동의 총 횟수를 의미합니다. 많은 상호작용을 통해
              페르소나는 당신을 더 잘 이해하고, 더욱 정확하고
              의미 있는 대화를 제공할 수 있습니다.
            </p>
            <div className="bg-blue-50 rounded-xl p-4 mb-4">
              <p className="text-xs text-blue-600 mb-2 font-medium">
                포함되는 활동
              </p>
              <ul className="space-y-1 text-sm text-blue-900">
                <li>• 채팅 대화</li>
                <li>• 음성/영상 통화</li>
                <li>• 학습 세션</li>
                <li>• 피드 상호작용</li>
              </ul>
            </div>
            <Button
              onClick={() => v_0af5ed(false)}
              className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full font-medium"
            >
              확인
            </Button>
          </div>
        </div>
      )}

      {}
      <button
        onClick={() => v_22a5cb(true)}
        className={`fixed right-6 bottom-24 z-50 w-16 h-16 bg-black hover:bg-zinc-800 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          v_7a6173
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-20 pointer-events-none"
        }`}
      >
        <Phone className="w-6 h-6" />
      </button>

      {}
      {v_af84de && (
        <div
          className="fixed inset-0 bg-black/50 z-150 flex items-end"
          onClick={() => v_22a5cb(false)}
        >
          <div
            className="bg-white w-full rounded-t-3xl max-h-[85vh] flex flex-col overflow-hidden animate-slide-up"
            onClick={(v_9e86fd) => v_9e86fd.stopPropagation()}
          >
            {}
            <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-200 flex-shrink-0">
              <h2 className="text-lg font-semibold">
                통화하기
              </h2>
              <button
                onClick={() => v_22a5cb(false)}
                className="p-1"
              >
                <X className="w-6 h-6 text-zinc-600" />
              </button>
            </div>

            {}
            <div className="px-4 py-3 border-b border-zinc-200 flex-shrink-0">
              <div className="flex items-center gap-2 bg-zinc-100 rounded-full px-4 py-2.5">
                <Search className="w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="페르소나 검색..."
                  value={v_2116d2}
                  onChange={(v_9e86fd) =>
                    v_83f9d3(v_9e86fd.target.value)
                  }
                  className="flex-1 bg-transparent outline-none text-sm placeholder:text-zinc-400"
                />
                {v_2116d2 && (
                  <button
                    onClick={() => v_83f9d3("")}
                    className="text-zinc-400 hover:text-zinc-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {}
            <div className="flex-1 overflow-y-auto">
              {}
              {!v_2116d2 &&
                v_e784f2.length > 0 && (
                  <div className="px-4 py-4 border-b border-zinc-200">
                    <h3 className="text-sm font-semibold text-zinc-900 mb-3">
                      최근 통화
                    </h3>
                    <div className="space-y-3">
                      {v_e784f2.map((v_8c0b26) => (
                        <div
                          key={v_8c0b26.personaId}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <img
                              src={v_8c0b26.persona!.avatar}
                              alt={v_8c0b26.persona!.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm">
                                {v_8c0b26.persona!.name}
                              </h4>
                              <p className="text-xs text-zinc-500">
                                {v_8c0b26.persona!.creatorAccount}
                              </p>
                              <p className="text-xs text-zinc-400 mt-0.5">
                                {v_8c0b26.lastCallTime} •{" "}
                                {v_8c0b26.duration}
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => {
                              v_22a5cb(false);
                              v_9b57fc(
                                `/clone/${v_8c0b26.personaId}/call`,
                              );
                            }}
                            className="h-10 px-4 bg-black hover:bg-zinc-800 text-white rounded-full font-medium flex items-center gap-2"
                          >
                            <Video className="w-4 h-4" />
                            <span className="text-sm">
                              통화
                            </span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {}
              <div className="px-4 py-4">
                <h3 className="text-sm font-semibold text-zinc-900 mb-3">
                  {v_2116d2 ? "검색 결과" : "통화 목록"}
                </h3>
                {v_94f30e.length > 0 ? (
                  <div className="space-y-3">
                    {v_94f30e.map((v_5ed063) => (
                      <div
                        key={v_5ed063.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <img
                            src={v_5ed063.avatar}
                            alt={v_5ed063.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm">
                              {v_5ed063.name}
                            </h4>
                            <p className="text-xs text-zinc-500">
                              {v_5ed063.creatorAccount}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            v_22a5cb(false);
                            v_9b57fc(
                              `/clone/${v_5ed063.id}/call`,
                            );
                          }}
                          className="h-10 px-4 bg-black hover:bg-zinc-800 text-white rounded-full font-medium flex items-center gap-2"
                        >
                          <Video className="w-4 h-4" />
                          <span className="text-sm">통화</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Search className="w-12 h-12 text-zinc-300 mb-2" />
                    <p className="text-zinc-400 text-sm">
                      검색 결과가 없습니다
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}