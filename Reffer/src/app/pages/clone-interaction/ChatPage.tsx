import { useNavigate, useParams } from "react-router";
import { useState } from "react";
import { ArrowLeft, Send, Mic, MoreVertical, Thermometer, MessagesSquare, Plus } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Progress } from "../../components/ui/progress";
import { PageHeader } from "../../components/common/PageHeader";
import profile1 from "figma:asset/1c1e3bed656961ad27fe0f9df28e4f656ab37c45.png";
import userProfileImage from "figma:asset/0c75e19943aae36a5d0c3c687d7c86518653563c.png";
import svgPaths from "../../../imports/svg-drf34ufkpk";
import grandfatherImage from "figma:asset/20146946046d36208cb800f20e245b496bf1e5db.png";
import grandmotherImage from "figma:asset/5c5d09ddff50c0eb605430b525fade289e4995ab.png";
import leesonjaeImage from "figma:asset/3b12bebcc0dca8516be4ec774a3fdf9f15213611.png";
import profile2Image from "figma:asset/a4f88cc3d7d88ec826bb9e7fcea5b5b0f72c77c3.png";
import profile3Image from "figma:asset/504b9a07b473bcf29e7f0ddb31712ad178a81480.png";
import economicExpertImage from "figma:asset/049062c0d59596d667408cb8e363226117444a45.png";
import yogaTeacherImage from "figma:asset/c503a78864b3876176f1283be90ed437e5322b3e.png";
import { myClones } from "../clones/MyClonesDashboardPage";

const allPersonasMap: Record<string, { name: string; image: string }> = {

  "short-1": { name: "할아버지", image: grandfatherImage },
  "short-2": { name: "할머니", image: grandmotherImage },
  "short-3": { name: "이선재", image: leesonjaeImage },

  "f1": { name: "경제전문가", image: economicExpertImage },
  "f2": { name: "요가선생님", image: yogaTeacherImage },
};

const mockMessages = [
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

const quickActions = [
  "더 구체적으로",
  "다른 주제로",
  "공연 세부 훈련",
];

export function ChatPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(mockMessages);

  const currentPersona = id 
    ? (myClones.find(clone => clone.id === id) || allPersonasMap[id])
    : allPersonasMap["1"];

  const personaName = currentPersona 
    ? ('name' in currentPersona ? currentPersona.name : allPersonasMap["1"].name)
    : "페르소나";

  const personaImage = currentPersona
    ? ('avatar' in currentPersona ? currentPersona.avatar : ('image' in currentPersona ? currentPersona.image : profile1))
    : profile1;

  const handleSend = () => {
    if (message.trim()) {
      const newMessage = {
        id: messages.length + 1,
        sender: "user" as const,
        text: message,
        timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages([...messages, newMessage]);
      setMessage("");

      setTimeout(() => {
        const aiResponse = {
          id: messages.length + 2,
          sender: "clone" as const,
          text: "네, 이해했습니다. 제가 도와드릴 수 있는 다른 것이 있나요?",
          timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages(prev => [...prev, aiResponse]);
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white text-zinc-900">
      {}
      <PageHeader
        avatar={{
          src: personaImage,
          alt: personaName,
          name: personaName,
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
                  <path d={svgPaths.p5b22b80} />
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
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-2">
            {msg.sender === "clone" && (
              <div className="text-xs text-zinc-400 font-medium tracking-wide mb-2">
                AI TRAINER
              </div>
            )}
            <div className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`${msg.sender === "user" ? "max-w-[85%]" : "max-w-[90%]"}`}>
                {msg.sender === "user" && (
                  <div className="flex items-center justify-end gap-2 mb-2">
                    <span className="text-xs text-zinc-500">{msg.userName || personaName}</span>
                  </div>
                )}
                <div
                  className={`rounded-2xl px-5 py-4 ${
                    msg.sender === "user"
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-50 text-zinc-900 border border-zinc-200 shadow-sm"
                  }`}
                >
                  <p className="text-[15px] leading-relaxed">{msg.text}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {}
      <div className="px-4 py-3 border-t border-zinc-200 bg-white">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-3">
          {quickActions.map((action, index) => (
            <button
              key={index}
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-full text-sm whitespace-nowrap transition-colors text-zinc-900 font-medium"
            >
              {action}
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
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              className="bg-zinc-100 border-zinc-200 text-zinc-900 h-12 pr-12 rounded-full"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900">
              <Mic className="w-5 h-5" />
            </button>
          </div>
          <Button
            onClick={handleSend}
            disabled={!message.trim()}
            className="h-12 w-12 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 disabled:bg-zinc-300 p-0 rounded-full"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}