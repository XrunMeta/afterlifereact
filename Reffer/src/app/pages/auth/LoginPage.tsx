import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import logoImage from "figma:asset/b8073dfe43dc8bb9d0f8062410bb5c1bb4776d54.png";

export function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    navigate("/");
  };

  const handleSocialLogin = (provider: string) => {

    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md relative z-10">
        {}
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-4">
            <img src={logoImage} alt="Afterlife" className="w-24 h-24 relative" />
          </div>

        </div>

        {}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <Input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-12 bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 h-14 rounded-xl focus:border-violet-500 focus:ring-violet-500 transition-colors shadow-sm"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-12 pr-12 bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 h-14 rounded-xl focus:border-violet-500 focus:ring-violet-500 transition-colors shadow-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-black hover:text-violet-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center justify-between text-sm pt-1">
            <label className="flex items-center gap-2 text-zinc-600 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-zinc-300 text-violet-500 focus:ring-violet-500 cursor-pointer"
              />
              자동 로그인
            </label>
            <button type="button" className="text-black hover:text-violet-600 transition-colors">
              비밀번호 찾기
            </button>
          </div>

          <Button
            type="submit"
            className="w-full h-14 bg-black hover:bg-zinc-800 text-white font-bold rounded-xl shadow-lg shadow-black/10 transition-all mt-6"
          >
            로그인
          </Button>
        </form>

        {}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-zinc-200" />
          <span className="text-zinc-400 text-sm">또는</span>
          <div className="flex-1 h-px bg-zinc-200" />
        </div>

        {}
        <div className="space-y-3">
          <Button
            onClick={() => handleSocialLogin("google")}
            variant="outline"
            className="w-full h-12 bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50 rounded-xl shadow-sm transition-all"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google로 계속하기
          </Button>

          <Button
            onClick={() => handleSocialLogin("apple")}
            variant="outline"
            className="w-full h-12 bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50 rounded-xl shadow-sm transition-all"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Apple로 계속하기
          </Button>

          <Button
            onClick={() => handleSocialLogin("telegram")}
            variant="outline"
            className="w-full h-12 bg-[#0088cc] border-[#0088cc] text-white hover:bg-[#0077b5] rounded-xl shadow-sm transition-all"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
            </svg>
            Telegram으로 계속하기
          </Button>
        </div>

        {}
        <div className="text-center mt-8">
          <span className="text-zinc-500">계정이 없으신가요? </span>
          <Link to="/oth-path" className="text-black hover:text-violet-600 font-semibold transition-colors">
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
}