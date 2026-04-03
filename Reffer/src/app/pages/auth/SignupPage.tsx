import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { User, Mail, Lock, Phone, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import logoImage from "figma:asset/b8073dfe43dc8bb9d0f8062410bb5c1bb4776d54.png";

const INTEREST_OPTIONS = [
  "일상 대화",
  "감정 케어",
  "추억 공유",
  "인생 조언",
  "엔터테인먼트",
  "취미/여가",
  "위로/위안",
  "유머/재미",
];

export function SignupPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    gender: "",
    age: "",
  });
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    navigate("/oth-path");
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 bg-white sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
          <ArrowLeft className="w-6 h-6 text-zinc-900" />
        </button>
        <h1 className="text-lg font-semibold text-zinc-900">회원가입</h1>
        <div className="w-10" />
      </div>

      <div className="px-6 py-8 max-w-md mx-auto">
        {}
        <div className="flex flex-col items-center mb-8">
          <img src={logoImage} alt="Afterlife" className="w-20 h-20 mb-3" />
          <p className="text-zinc-600 text-center">새로운 계정을 만들어보세요</p>
        </div>

        {}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <Input
              type="text"
              placeholder="이름"
              value={formData.name}
              onChange={(e) => updateFormData("name", e.target.value)}
              className="pl-12 bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 h-14 rounded-xl focus:border-zinc-400 focus:ring-zinc-400 transition-colors"
              required
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <Input
              type="email"
              placeholder="이메일"
              value={formData.email}
              onChange={(e) => updateFormData("email", e.target.value)}
              className="pl-12 bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 h-14 rounded-xl focus:border-zinc-400 focus:ring-zinc-400 transition-colors"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="비밀번호"
              value={formData.password}
              onChange={(e) => updateFormData("password", e.target.value)}
              className="pl-12 pr-12 bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 h-14 rounded-xl focus:border-zinc-400 focus:ring-zinc-400 transition-colors"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <Input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="비밀번호 확인"
              value={formData.confirmPassword}
              onChange={(e) => updateFormData("confirmPassword", e.target.value)}
              className="pl-12 pr-12 bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 h-14 rounded-xl focus:border-zinc-400 focus:ring-zinc-400 transition-colors"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <Input
              type="tel"
              placeholder="전화번호"
              value={formData.phone}
              onChange={(e) => updateFormData("phone", e.target.value)}
              className="pl-12 bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 h-14 rounded-xl focus:border-zinc-400 focus:ring-zinc-400 transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select
              value={formData.gender}
              onChange={(e) => updateFormData("gender", e.target.value)}
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
              value={formData.age}
              onChange={(e) => updateFormData("age", e.target.value)}
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
              {INTEREST_OPTIONS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedInterests.includes(interest)
                      ? "bg-black text-white"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                  }`}
                >
                  {interest}
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