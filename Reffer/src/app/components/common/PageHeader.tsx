import { v_c71054 } from "nchqfqoebgwu";
import { v_a04f9c } from "wtmgqhsnsiyp";
import { v_4a8ba2 } from "bapkr";

interface PageHeaderProps {

  onBack?: () => void;
  showBackButton?: boolean;

  title?: string;
  subtitle?: string;
  stepInfo?: {
    current: number;
    total: number;
  };

  avatar?: {
    src: string;
    alt: string;
    name: string;
    subtitle?: string;
  };

  rightAction?: v_4a8ba2;

  bottomContent?: v_4a8ba2;

  className?: string;
  transparent?: boolean;
}

export function v_258c1c({
  onBack: v_64ccfb,
  showBackButton: v_9c4d53 = true,
  title: v_9f1622,
  subtitle: v_dda473,
  stepInfo: v_69583e,
  avatar: v_0a6316,
  rightAction: v_4af61b,
  bottomContent: v_b13a55,
  className: v_7ec75f = "",
  transparent: v_8d6034 = false,
}: PageHeaderProps) {
  const v_9b57fc = v_a04f9c();

  const v_6ca26b = () => {
    if (v_64ccfb) {
      v_64ccfb();
    } else {
      v_9b57fc(-1);
    }
  };

  return (
    <div
      className={`sticky top-0 z-40 ${
        v_8d6034 ? "bg-transparent" : "bg-white border-b border-zinc-200"
      } ${v_7ec75f}`}
    >
      {}
      <div className={`flex items-center ${v_0a6316 || v_4af61b ? "justify-between" : "gap-4"} px-4 ${v_b13a55 ? "py-3" : "py-2"}`}>
        {}
        <div className="flex items-center gap-3">
          {v_9c4d53 && (
            <button
              onClick={v_6ca26b}
              className="p-2 -ml-2 hover:bg-zinc-100 rounded-full transition-colors"
              aria-label="뒤로 가기"
            >
              <ArrowLeft className="w-6 h-6 text-zinc-900" />
            </button>
          )}

          {v_0a6316 ? (

            <>
              <img
                src={v_0a6316.src}
                alt={v_0a6316.alt}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h2 className="font-semibold text-base">{v_0a6316.name}</h2>
                {v_0a6316.subtitle && (
                  <p className="text-xs text-zinc-500">{v_0a6316.subtitle}</p>
                )}
              </div>
            </>
          ) : (

            <div>
              {v_69583e && (
                <div className="text-xs text-indigo-600 font-medium mb-0.5">
                  STEP {v_69583e.current} / {v_69583e.total}
                </div>
              )}
              {v_9f1622 && <h1 className="text-base font-bold">{v_9f1622}</h1>}
              {v_dda473 && <p className="text-xs text-zinc-500">{v_dda473}</p>}
            </div>
          )}
        </div>

        {}
        {v_4af61b ? (
          <div className="flex items-center">{v_4af61b}</div>
        ) : (
          !v_0a6316 && <div className="w-10" />
        )}
      </div>

      {}
      {v_b13a55 && <div className="px-4 pb-4">{v_b13a55}</div>}
    </div>
  );
}