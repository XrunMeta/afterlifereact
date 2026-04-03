import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { ReactNode } from "react";

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

  rightAction?: ReactNode;

  bottomContent?: ReactNode;

  className?: string;
  transparent?: boolean;
}

export function PageHeader({
  onBack,
  showBackButton = true,
  title,
  subtitle,
  stepInfo,
  avatar,
  rightAction,
  bottomContent,
  className = "",
  transparent = false,
}: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div
      className={`sticky top-0 z-40 ${
        transparent ? "bg-transparent" : "bg-white border-b border-zinc-200"
      } ${className}`}
    >
      {}
      <div className={`flex items-center ${avatar || rightAction ? "justify-between" : "gap-4"} px-4 ${bottomContent ? "py-3" : "py-2"}`}>
        {}
        <div className="flex items-center gap-3">
          {showBackButton && (
            <button
              onClick={handleBack}
              className="p-2 -ml-2 hover:bg-zinc-100 rounded-full transition-colors"
              aria-label="뒤로 가기"
            >
              <ArrowLeft className="w-6 h-6 text-zinc-900" />
            </button>
          )}

          {avatar ? (

            <>
              <img
                src={avatar.src}
                alt={avatar.alt}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h2 className="font-semibold text-base">{avatar.name}</h2>
                {avatar.subtitle && (
                  <p className="text-xs text-zinc-500">{avatar.subtitle}</p>
                )}
              </div>
            </>
          ) : (

            <div>
              {stepInfo && (
                <div className="text-xs text-indigo-600 font-medium mb-0.5">
                  STEP {stepInfo.current} / {stepInfo.total}
                </div>
              )}
              {title && <h1 className="text-base font-bold">{title}</h1>}
              {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
            </div>
          )}
        </div>

        {}
        {rightAction ? (
          <div className="flex items-center">{rightAction}</div>
        ) : (
          !avatar && <div className="w-10" />
        )}
      </div>

      {}
      {bottomContent && <div className="px-4 pb-4">{bottomContent}</div>}
    </div>
  );
}