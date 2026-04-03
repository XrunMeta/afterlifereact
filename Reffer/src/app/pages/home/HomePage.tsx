import { v_5ab095, v_e662ae, v_c4deb2 } from "bapkr";
import { v_80d240 } from "kaiajcklz";
import { v_a04f9c } from "wtmgqhsnsiyp";
import {
  v_56d16a,
  v_143e48,
  v_a675a7,
  v_d29571,
  v_b0beab,
  v_de6bf5,
  v_77b82e,
  v_d55cb2,
  v_d9f2c0,
} from "nchqfqoebgwu";
import v_108280 from "topvncoaogvlhrnmgtaxdnrazrwwaknqiszprwjqzmwtwotmwhndeahe";
import v_e179a0 from "pohqptvifeyqbkwnvdyhneaxuakhkqgxesukwpetqlgxygxpjkjjewcl";
import v_96567c from "kvrmtepzickqbtvrotkzltelaksibwpgprxpdugztzmjrcqkaogjtafx";

const v_723687 =
  "https://images.unsplash.com/photo-1701463387028-3947648f1337?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBhdmF0YXIlMjBwcm9maWxlJTIwcGhvdG98ZW58MXx8fHwxNzc0NTE3Mjg3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const v_4edae9 =
  "https://images.unsplash.com/photo-1496672254107-b07a26403885?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGRlcmx5JTIwd29tYW4lMjBncmFuZG1vdGhlciUyMHBvcnRyYWl0fGVufDF8fHx8MTc3NDUxNzI4N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const v_e4eb05 =
  "https://images.unsplash.com/photo-1564783538911-cd6bb5d6bed2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMGFzaWFuJTIwbWFuJTIwcG9ydHJhaXQlMjBzbWlsZXxlbnwxfHx8fDE3NzQ0ODk1NDh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

const v_bbe45f = [
  "일상 대화",
  "감정 케어",
  "추억 공유",
  "인생 조언",
  "엔터테인먼트",
  "취미/여가",
  "위로/위안",
  "유머/재미",
];

const v_b1c61f = [
  {
    id: "short-1",
    author: "할아버지",
    username: "@member_01",
    authorAvatar: v_723687,
    image: v_108280,
    title: "할아버지",
    description:
      "오늘 하루는 어떠셨나요? 마음에 담아둔 이야기가 있다면 저에게 편하게 말씀주세요. 당신의 길을 함께 고민해 드릴께요.",
    type: "멤로우",
    mainCategory: "일상 및 감정 케어",
    interests: ["일상 대화", "감정 케어", "인생 조언"],
    likes: "12.4K",
    comments: 842,
  },
  {
    id: "short-2",
    author: "할머니",
    username: "@afterLife",
    authorAvatar: v_4edae9,
    image: v_e179a0,
    title: "할머니",
    description:
      "얘야, 힘든 일이 있어도 웃음을 잃지 말거라. 할머니가 항상 네 곁에서 응원하고 있단다.",
    type: "멤로우",
    mainCategory: "일상 및 감정 케어",
    interests: ["감정 케어", "위로/위안", "추억 공유"],
    likes: "8.7K",
    comments: 523,
  },
  {
    id: "short-3",
    author: "이선재",
    username: "@user_ex",
    authorAvatar: v_e4eb05,
    image: v_96567c,
    title: "이선재",
    description:
      "안녕하세요! 오늘도 함께 좋은 하루 만들어가요. 여러분의 이야기가 궁금해요.",
    type: "친구",
    mainCategory: "엔터테인먼트 및 취미",
    interests: ["엔터테인먼트", "일상 대화", "유머/재미"],
    likes: "15.2K",
    comments: 1204,
  },
];

const v_a38ade = ["일상 대화", "감정 케어", "위로/위안"];

export function v_f89e76() {
  const v_9b57fc = v_a04f9c();
  const [v_2bcb8f, v_ddecc4] = v_5ab095(0);
  const [v_41abc0, v_d51882] = v_5ab095<Set<number>>(new Set());
  const [v_130317, v_1be57e] = v_5ab095<Set<number>>(new Set());
  const [v_7501f0, v_55059a] = v_5ab095<Set<number>>(new Set());
  const [v_8282fa, v_15c939] = v_5ab095<string | null>(null);
  const [v_e60cdc, v_a9d9cc] = v_5ab095<Set<number>>(new Set());
  const [v_3d35b1, v_c774cf] = v_5ab095(false);
  const [v_c18397, v_4fe9ef] = v_5ab095(0);
  const [v_71524b, v_54b863] = v_5ab095(0);
  const [v_1c2f42, v_1358d1] = v_5ab095(false);
  const [v_976e06, v_770327] = v_5ab095<string[]>(v_a38ade);
  const v_2a4dda = v_e662ae<HTMLDivElement>(null);

  const v_4e0710 =
    v_976e06.length > 0
      ? v_b1c61f.filter((v_c0d7a5) =>
          v_c0d7a5.interests.some((v_e4601c) =>
            v_976e06.includes(v_e4601c),
          ),
        )
      : v_b1c61f;

  const v_f13f18 = v_4e0710[v_2bcb8f];

  const v_d82a00 = (v_e4601c) => {
    v_770327((v_ba2215) =>
      v_ba2215.includes(v_e4601c)
        ? v_ba2215.filter((v_ebec57) => v_ebec57 !== v_e4601c)
        : [...v_ba2215, v_e4601c],
    );
  };

  const v_5e8a54 = () => {
    v_770327([]);
  };

  const v_a96ced = () => {
    v_d51882((v_ba2215) => {
      const v_d38aef = new Set(v_ba2215);
      if (v_d38aef.has(v_f13f18.id)) {
        v_d38aef.delete(v_f13f18.id);
      } else {
        v_d38aef.add(v_f13f18.id);
      }
      return v_d38aef;
    });
  };

  const v_38c943 = () => {
    v_1be57e((v_ba2215) => {
      const v_d38aef = new Set(v_ba2215);
      const v_ef4892 = v_d38aef.has(v_f13f18.id);

      if (v_ef4892) {
        v_d38aef.delete(v_f13f18.id);
        v_15c939("저장 취소했습니다");
      } else {
        v_d38aef.add(v_f13f18.id);
        v_15c939("저장되었습니다");
      }
      return v_d38aef;
    });
  };

  const v_3b640a = (v_53aa09) => {
    v_a9d9cc((v_ba2215) => {
      const v_d38aef = new Set(v_ba2215);
      if (v_d38aef.has(v_53aa09)) {
        v_d38aef.delete(v_53aa09);
      } else {
        v_d38aef.add(v_53aa09);
      }
      return v_d38aef;
    });
  };

  const v_3094d4 = (v_53aa09) => {
    v_55059a((v_ba2215) => {
      const v_d38aef = new Set(v_ba2215);
      if (v_d38aef.has(v_53aa09)) {
        v_d38aef.delete(v_53aa09);
      } else {
        v_d38aef.add(v_53aa09);
      }
      return v_d38aef;
    });
  };

  v_c4deb2(() => {
    if (v_8282fa) {
      const v_cb36b1 = setTimeout(() => {
        v_15c939(null);
      }, 2000);
      return () => clearTimeout(v_cb36b1);
    }
  }, [v_8282fa]);

  v_c4deb2(() => {

    const v_fdb0e8 = document.body.style.overflow;
    const v_142e11 = document.body.style.position;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';

    return () => {
      document.body.style.overflow = v_fdb0e8;
      document.body.style.position = v_142e11;
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []);

  const v_2f08de = (v_123c9d) => {
    v_c774cf(true);
    v_54b863(v_123c9d);
  };

  const v_e50d28 = (v_123c9d) => {
    if (!v_3d35b1) return;
    const v_a41a1b = v_123c9d - v_71524b;
    v_4fe9ef(v_a41a1b);
  };

  const v_ca2e86 = () => {
    if (!v_3d35b1) return;
    v_c774cf(false);

    if (
      v_c18397 < -150 &&
      v_2bcb8f < v_4e0710.length - 1
    ) {
      v_ddecc4(v_2bcb8f + 1);
    } else if (v_c18397 > 150 && v_2bcb8f > 0) {
      v_ddecc4(v_2bcb8f - 1);
    }

    v_4fe9ef(0);
  };

  const v_59eda2 = (v_9e86fd) => {
    v_9e86fd.preventDefault();
    v_2f08de(v_9e86fd.clientY);
  };

  const v_1842bf = (v_9e86fd) => {
    v_e50d28(v_9e86fd.clientY);
  };

  const v_8e1688 = () => {
    v_ca2e86();
  };

  const v_9b6b24 = () => {
    if (v_3d35b1) {
      v_ca2e86();
    }
  };

  const v_2d7b73 = (v_9e86fd) => {
    v_2f08de(v_9e86fd.touches[0].clientY);
  };

  const v_51fd09 = (v_9e86fd) => {
    v_e50d28(v_9e86fd.touches[0].clientY);
  };

  const v_ca6856 = () => {
    v_ca2e86();
  };

  const v_5aac04 =
    -v_2bcb8f * 100 +
    (v_c18397 / window.innerHeight) * 100;

  return (
    <div
      ref={v_2a4dda}
      className="fixed inset-0 h-screen bg-zinc-950 overflow-hidden cursor-grab active:cursor-grabbing"
      onMouseDown={v_59eda2}
      onMouseMove={v_1842bf}
      onMouseUp={v_8e1688}
      onMouseLeave={v_9b6b24}
      onTouchStart={v_2d7b73}
      onTouchMove={v_51fd09}
      onTouchEnd={v_ca6856}
    >
      {}
      <div className={`fixed top-6 left-0 right-0 z-40 w-full flex items-start gap-2 grow-1 px-2 pointer-events-none ${v_976e06.length > 0 ? 'justify-between' : 'justify-end'}`}>
        {}
        {v_976e06.length > 0 && (
          <div className="flex flex-wrap gap-2 width-full pointer-events-auto">
            {v_976e06.map((v_e4601c) => (
              <div
                key={v_e4601c}
                className="px-3 py-1 bg-black/30 backdrop-blur-md rounded-full text-xs font-medium text-white flex items-center gap-1"
              >
                #{v_e4601c}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => v_1358d1(true)}
          onMouseDown={(v_9e86fd) => v_9e86fd.stopPropagation()}
          className="w-10 h-10 shrink-0 flex items-center justify-center bg-black/30 backdrop-blur-md rounded-full transition-colors hover:bg-black/70 pointer-events-auto mt-[-10px]"
        >
          <Filter className="w-5 h-5 text-white" />
        </button>
      </div>

      {}
      <div
        className="absolute inset-0 transition-transform"
        style={{
          transform: `translateY(${v_5aac04}vh)`,
          transitionDuration: v_3d35b1 ? "0ms" : "300ms",
          transitionTimingFunction:
            "cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {v_4e0710.map((v_c0d7a5, v_a56041) => (
          <div
            key={v_c0d7a5.id}
            className="relative h-screen w-full"
            style={{ height: "100vh" }}
          >
            {}
            <div className="absolute inset-0">
              <img
                src={v_c0d7a5.image}
                alt={v_c0d7a5.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
            </div>

            {}
            {v_a56041 === v_2bcb8f && (
              <div className="absolute bottom-24 left-0 right-0 px-6 z-10">

                {}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-white drop-shadow-lg">
                      {v_c0d7a5.author}
                    </h3>
                    <p className="text-sm text-white/80 drop-shadow-lg">
                      {v_c0d7a5.username}
                    </p>
                  </div>
                  <button
                    onClick={(v_9e86fd) => {
                      v_9e86fd.stopPropagation();
                      v_3094d4(v_c0d7a5.id);
                    }}
                    onMouseDown={(v_9e86fd) => v_9e86fd.stopPropagation()}
                    className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${
                      v_7501f0.has(v_c0d7a5.id)
                        ? "bg-white/20 text-white backdrop-blur-md"
                        : "bg-white text-zinc-900"
                    }`}
                  >
                    {v_7501f0.has(v_c0d7a5.id) ? "팔로잉" : "팔로우"}
                  </button>
                </div>

                {}
                <div className="flex items-center gap-4 mb-3 px-4 py-2 bg-black/30 backdrop-blur-md rounded-full w-fit">
                  <div className="flex items-center gap-1.5">
                    <MessagesSquare className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-bold text-white">{typeof v_c0d7a5.comments === 'number' ? v_c0d7a5.comments * 5 : '2.1K'}</span>
                  </div>
                  <div className="w-px h-4 bg-white/30" />
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-white" />
                    <span className="text-sm font-bold text-white">{v_c0d7a5.likes}</span>
                  </div>
                  <div className="w-px h-4 bg-white/30" />
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-white" />
                    <span className="text-sm font-bold text-white">{v_c0d7a5.comments}</span>
                  </div>
                </div>

                {}
                <div className="mb-4 ">
                  <div className="flex justify-between items-end mb-2">
                  <p
                    className={`text-sm text-white leading-relaxed drop-shadow-lg ${
                      !v_e60cdc.has(v_c0d7a5.id)
                        ? "line-clamp-2"
                        : ""
                    }`}
                  >
                    {v_c0d7a5.description}
                  </p>
                  {v_c0d7a5.description.length > 60 && (
                    <button
                      onClick={(v_9e86fd) => {
                        v_9e86fd.stopPropagation();
                        v_3b640a(v_c0d7a5.id);
                      }}
                      onMouseDown={(v_9e86fd) => v_9e86fd.stopPropagation()}
                      className="text-xs text-white/80 font-medium mt-1 hover:text-white transition-colors shrink-0"
                    >
                      {v_e60cdc.has(v_c0d7a5.id)
                        ? "간략히"
                        : "더보기"}
                    </button>
                  )}
                </div>
                   {}
                <div className="flex flex-wrap gap-2 mb-3 ">
                  {v_c0d7a5.interests.map((v_e4601c) => (
                    <span
                      key={v_e4601c}
                      className="px-3 py-1 bg-black/20 backdrop-blur-md rounded-full text-xs font-medium text-white"
                    >
                      #{v_e4601c}
                    </span>
                  ))}
                </div>
                </div>

                {}
                <button
                  onClick={(v_9e86fd) => {
                    v_9e86fd.stopPropagation();
                    v_9b57fc(`/clone/${v_c0d7a5.id}/call`);
                  }}
                  className="w-full h-14 bg-white/95 hover:bg-white rounded-full flex items-center justify-center gap-2 text-zinc-900 font-bold text-base transition-all shadow-lg"
                  onMouseDown={(v_9e86fd) => v_9e86fd.stopPropagation()}
                >
                  <Video className="w-5 h-5" />
                  통화하기
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {

}
      {}
      {v_1c2f42 && v_80d240(
        <>
          {}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
            onClick={() => v_1358d1(false)}
          />

          {}
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[110] animate-slide-up max-h-[70vh] overflow-hidden">
            {}
            <div className="flex items-center justify-between p-6 border-b border-zinc-200">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-zinc-900">
                  관심사 필터
                </h2>
                {v_976e06.length > 0 && (
                  <span className="px-2.5 py-1 bg-violet-100 text-violet-700 text-xs font-bold rounded-full">
                    {v_976e06.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => v_1358d1(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 transition-colors"
              >
                <X className="w-5 h-5 text-zinc-600" />
              </button>
            </div>

            {}
            <div className="p-6 overflow-y-auto max-h-[calc(70vh-160px)]">
              <div className="grid grid-cols-2 gap-3">
                {v_bbe45f.map((v_e4601c) => {
                  const v_599a41 =
                    v_976e06.includes(v_e4601c);
                  return (
                    <button
                      key={v_e4601c}
                      onClick={() => v_d82a00(v_e4601c)}
                      className={`px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                        v_599a41
                          ? "bg-violet-500 text-white shadow-lg"
                          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                      }`}
                    >
                      {v_e4601c}
                    </button>
                  );
                })}
              </div>
            </div>

            {}
            <div className="p-6 border-t border-zinc-200 flex gap-3">
              <button
                onClick={v_5e8a54}
                className="flex-1 h-12 bg-zinc-100 text-zinc-700 rounded-xl font-bold hover:bg-zinc-200 transition-colors"
              >
                초기화
              </button>
              <button
                onClick={() => {
                  v_ddecc4(0); 
                  v_1358d1(false);
                }}
                className="flex-1 h-12 bg-violet-500 text-white rounded-xl font-bold hover:bg-violet-600 transition-colors"
              >
                적용하기
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

      {}
      {v_8282fa && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full shadow-lg z-50">
          {v_8282fa}
        </div>
      )}
    </div>
  );
}
