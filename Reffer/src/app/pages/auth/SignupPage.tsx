import { v_80cb8d, v_a04f9c } from "wtmgqhsnsiyp";
import { v_5ab095 } from "bapkr";
import { v_1ddb60, v_d1d4c1, v_85f750, v_b0beab, v_0d4f9d, v_a97629, v_c71054 } from "nchqfqoebgwu";
import { v_1a40c4 } from "../../components/ui/button";
import { v_1b353f } from "../../components/ui/input";
import v_4c9b6e from "txiocjdesyjqcengktbobpczjevabwapkwspcrymjktdtmrcsnhycuwz";

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

export function v_e1f211() {
  const v_9b57fc = v_a04f9c();
  const [v_b5ab16, v_b7733b] = v_5ab095(false);
  const [v_0b85b1, v_3c4c2d] = v_5ab095(false);
  const [v_2e7cbb, v_90b546] = v_5ab095({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    gender: "",
    age: "",
  });
  const [v_976e06, v_770327] = v_5ab095<string[]>([]);

  const v_585b02 = (v_9e86fd) => {
    v_9e86fd.preventDefault();

    v_9b57fc("/oth-path");
  };

  const v_6ff1f8 = (v_70c705, v_3b402b) => {
    v_90b546(v_ba2215 => ({ ...v_ba2215, [v_70c705]: v_3b402b }));
  };

  const v_d82a00 = (v_e4601c) => {
    v_770327(v_ba2215 =>
      v_ba2215.includes(v_e4601c)
        ? v_ba2215.filter(v_ebec57 => v_ebec57 !== v_e4601c)
        : [...v_ba2215, v_e4601c]
    );
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 bg-white sticky top-0 z-10">
        <button onClick={() => v_9b57fc(-1)} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
          <ArrowLeft className="w-6 h-6 text-zinc-900" />
        </button>
        <h1 className="text-lg font-semibold text-zinc-900">회원가입</h1>
        <div className="w-10" />
      </div>

      <div className="px-6 py-8 max-w-md mx-auto">
        {}
        <div className="flex flex-col items-center mb-8">
          <img src={v_4c9b6e} alt="Afterlife" className="w-20 h-20 mb-3" />
          <p className="text-zinc-600 text-center">새로운 계정을 만들어보세요</p>
        </div>

        {}
        <form onSubmit={v_585b02} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <Input
              type="text"
              placeholder="이름"
              value={v_2e7cbb.name}
              onChange={(v_9e86fd) => v_6ff1f8("name", v_9e86fd.target.value)}
              className="pl-12 bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 h-14 rounded-xl focus:border-zinc-400 focus:ring-zinc-400 transition-colors"
              required
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <Input
              type="email"
              placeholder="이메일"
              value={v_2e7cbb.email}
              onChange={(v_9e86fd) => v_6ff1f8("email", v_9e86fd.target.value)}
              className="pl-12 bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 h-14 rounded-xl focus:border-zinc-400 focus:ring-zinc-400 transition-colors"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <Input
              type={v_b5ab16 ? "text" : "password"}
              placeholder="비밀번호"
              value={v_2e7cbb.password}
              onChange={(v_9e86fd) => v_6ff1f8("password", v_9e86fd.target.value)}
              className="pl-12 pr-12 bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 h-14 rounded-xl focus:border-zinc-400 focus:ring-zinc-400 transition-colors"
              required
            />
            <button
              type="button"
              onClick={() => v_b7733b(!v_b5ab16)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 transition-colors"
            >
              {v_b5ab16 ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <Input
              type={v_0b85b1 ? "text" : "password"}
              placeholder="비밀번호 확인"
              value={v_2e7cbb.confirmPassword}
              onChange={(v_9e86fd) => v_6ff1f8("confirmPassword", v_9e86fd.target.value)}
              className="pl-12 pr-12 bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 h-14 rounded-xl focus:border-zinc-400 focus:ring-zinc-400 transition-colors"
              required
            />
            <button
              type="button"
              onClick={() => v_3c4c2d(!v_0b85b1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 transition-colors"
            >
              {v_0b85b1 ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <Input
              type="tel"
              placeholder="전화번호"
              value={v_2e7cbb.phone}
              onChange={(v_9e86fd) => v_6ff1f8("phone", v_9e86fd.target.value)}
              className="pl-12 bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 h-14 rounded-xl focus:border-zinc-400 focus:ring-zinc-400 transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select
              value={v_2e7cbb.gender}
              onChange={(v_9e86fd) => v_6ff1f8("gender", v_9e86fd.target.value)}
              className="h-14 px-4 bg-white border border-zinc-200 rounded-xl text-zinc-900 focus:border-zinc-400 focus:ring-zinc-400 focus:outline-none transition-colors"
              required
            >
              <option value="">성별</option>
              <option value="male">남성</option>
              <option value="female">여성</option>
              <option value="other">기타</option>
            </select>

            <Input
              type="number"
              placeholder="나이"
              value={v_2e7cbb.age}
              onChange={(v_9e86fd) => v_6ff1f8("age", v_9e86fd.target.value)}
              className="bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 h-14 rounded-xl focus:border-zinc-400 focus:ring-zinc-400 transition-colors"
              required
              min="1"
              max="120"
            />
          </div>

          {}
          <div className="pt-2">
            <label className="block text-sm font-semibold text-zinc-900 mb-3">
              관심사 선택 (선택사항)
            </label>
            <div className="flex flex-wrap gap-2">
              {v_bbe45f.map((v_e4601c) => (
                <button
                  key={v_e4601c}
                  type="button"
                  onClick={() => v_d82a00(v_e4601c)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    v_976e06.includes(v_e4601c)
                      ? "bg-black text-white"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                  }`}
                >
                  {v_e4601c}
                </button>
              ))}
            </div>
          </div>

          {}
          <div className="space-y-3 pt-4">
            <label className="flex items-start gap-3 text-sm cursor-pointer">
              <input 
                type="checkbox" 
                className="mt-1 w-4 h-4 rounded border-zinc-300 text-black focus:ring-black cursor-pointer" 
                required 
              />
              <span className="text-zinc-600">
                <span className="text-black font-semibold">(필수)</span> 이용약관 및 개인정보 처리방침에 동의합니다
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm cursor-pointer">
              <input 
                type="checkbox" 
                className="mt-1 w-4 h-4 rounded border-zinc-300 text-black focus:ring-black cursor-pointer" 
              />
              <span className="text-zinc-600">
                <span className="text-zinc-400">(선택)</span> 마케팅 정보 수신에 동의합니다
              </span>
            </label>
          </div>

          <Button 
            type="submit" 
            className="w-full h-14 bg-black hover:bg-zinc-800 text-white font-bold rounded-xl shadow-lg shadow-black/10 transition-all mt-6"
          >
            가입하기
          </Button>
        </form>

        {}
        <div className="text-center mt-6">
          <span className="text-zinc-500">이미 계정이 있으신가요? </span>
          <Link to="/oth-path" className="text-black hover:text-zinc-700 font-semibold transition-colors">
            로그인
          </Link>
        </div>
      </div>
    </div>
  );
}