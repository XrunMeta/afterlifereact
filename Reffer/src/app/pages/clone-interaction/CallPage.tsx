import { useNavigate, useParams } from "react-router";
import { useState, useEffect } from "react";
import { Phone, Mic, MicOff, Video, VideoOff, SwitchCamera, Gift, Heart, MessageCircle, Share2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import grandfatherImage from "figma:asset/20146946046d36208cb800f20e245b496bf1e5db.png";
import grandmotherImage from "figma:asset/5c5d09ddff50c0eb605430b525fade289e4995ab.png";
import leesonjaeImage from "figma:asset/3b12bebcc0dca8516be4ec774a3fdf9f15213611.png";
import profile1 from "figma:asset/1c1e3bed656961ad27fe0f9df28e4f656ab37c45.png";
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

const GIFTS = [
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

export function CallPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showGifts, setShowGifts] = useState(false);
  const [credits, setCredits] = useState(5000);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [floatingGifts, setFloatingGifts] = useState<FloatingGift[]>([]);
  const [giftCounter, setGiftCounter] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  const currentPersona = id 
    ? (myClones.find(clone => clone.id === id) || allPersonasMap[id])
    : allPersonasMap["1"];

  const personaName = currentPersona 
    ? ('name' in currentPersona ? currentPersona.name : allPersonasMap["1"].name)
    : "페르소나";

  const personaImage = currentPersona
    ? ('avatar' in currentPersona ? currentPersona.avatar : ('image' in currentPersona ? currentPersona.image : grandfatherImage))
    : grandfatherImage;

  const handleEndCall = () => {
    navigate(-1);
  };

  const handleGiftClick = (gift: typeof GIFTS[0]) => {
    if (credits < gift.price) {
      setToastMessage("크레딧이 부족합니다");
      return;
    }

    setCredits(prev => prev - gift.price);

    setToastMessage(`${gift.name}을 선물했습니다`);

    const newGift: FloatingGift = {
      id: giftCounter,
      giftId: gift.id,
      emoji: gift.emoji,
      x: Math.random() * 60 - 30, 
      y: 0
    };
    setFloatingGifts(prev => [...prev, newGift]);
    setGiftCounter(prev => prev + 1);

    setTimeout(() => {
      setFloatingGifts(prev => prev.filter(g => g.id !== newGift.id));
    }, 3000);

    setShowGifts(false);
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  return (
    <div className="fixed inset-0 h-screen bg-zinc-950 overflow-hidden">
      {}
      <div className="absolute inset-0">
        <img
          src={personaImage}
          alt="Clone Video"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-zinc-950/60" />
      </div>

      {}
      <div className="absolute top-4 left-4 w-28 h-40 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl z-10">
        {isVideoOff ? (
          <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
            <VideoOff className="w-8 h-8 text-zinc-600" />
          </div>
        ) : (
          <img
            src={profile1}
            alt="You"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {}
      <div className="absolute top-4 right-4 z-20">
        <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
          <span className="text-white text-sm font-bold">{credits.toLocaleString()} XRUN</span>
        </div>
      </div>

      {}
      <div className="absolute top-8 left-0 right-0 text-center z-10">
        <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">{personaName}</h2>
        <div className="inline-flex items-center gap-2 bg-green-500/90 px-4 py-2 rounded-full backdrop-blur-sm">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-white text-sm font-medium">통화 중 03:24</span>
        </div>
      </div>

      {}
      <div className="absolute right-4 bottom-40 flex flex-col gap-4 z-20">
        {}
        <button
          onClick={() => setShowGifts(!showGifts)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all backdrop-blur-md ${
            showGifts ? "bg-violet-500" : "bg-black/30"
          } hover:bg-violet-500/80`}
        >
          <Gift className="w-6 h-6 text-white" />
        </button>

        {}
        <button
          onClick={() => setIsLiked(!isLiked)}
          className="w-14 h-14 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center hover:bg-red-500/50 transition-all"
        >
          <Heart className={`w-6 h-6 transition-all ${isLiked ? "fill-red-500 text-red-500" : "text-white"}`} />
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
        {floatingGifts.map((gift) => (
          <motion.div
            key={gift.id}
            className="absolute text-6xl z-30 pointer-events-none"
            initial={{ 
              x: "50%", 
              y: "50%",
              scale: 0,
              opacity: 0
            }}
            animate={{ 
              x: `calc(50% + ${gift.x}vw)`,
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
            {gift.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {}
      <AnimatePresence>
        {showGifts && (
          <>
            {}
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGifts(false)}
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
                    <span className="text-sm font-bold text-violet-600">{credits.toLocaleString()} XRUN</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowGifts(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-600" />
                </button>
              </div>

              {}
              <div className="p-6 overflow-y-auto max-h-[calc(50vh-100px)]">
                <div className="grid grid-cols-3 gap-4">
                  {GIFTS.map((gift) => (
                    <button
                      key={gift.id}
                      onClick={() => handleGiftClick(gift)}
                      className="flex flex-col items-center gap-2 p-4 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-all active:scale-95"
                    >
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-white shadow-md">
                        <img
                          src={gift.image}
                          alt={gift.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-sm font-medium text-zinc-900">{gift.name}</span>
                      <span className="text-xs font-bold text-violet-600">{gift.price} XRUN</span>
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
              onClick={() => setIsMuted(!isMuted)}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                isMuted
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-zinc-900/80 hover:bg-zinc-800/80"
              } backdrop-blur-sm`}
            >
              {isMuted ? (
                <MicOff className="w-7 h-7 text-white" />
              ) : (
                <Mic className="w-7 h-7 text-white" />
              )}
            </button>

            {}
            <button
              onClick={handleEndCall}
              className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all shadow-2xl shadow-red-500/50"
            >
              <Phone className="w-8 h-8 text-white rotate-[135deg]" />
            </button>

            {}
            <button
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                isVideoOff
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-zinc-900/80 hover:bg-zinc-800/80"
              } backdrop-blur-sm`}
            >
              {isVideoOff ? (
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
      {toastMessage && (
        <motion.div
          className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-full shadow-lg z-50 backdrop-blur-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          {toastMessage}
        </motion.div>
      )}
    </div>
  );
}