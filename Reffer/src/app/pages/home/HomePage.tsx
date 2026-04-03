import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Phone,
  Filter,
  Video,
  X,
  MessagesSquare,
} from "lucide-react";
import grandfatherImage from "figma:asset/20146946046d36208cb800f20e245b496bf1e5db.png";
import grandmotherImage from "figma:asset/5c5d09ddff50c0eb605430b525fade289e4995ab.png";
import leesonjaeImage from "figma:asset/3b12bebcc0dca8516be4ec774a3fdf9f15213611.png";

const profile1 =
  "https://images.unsplash.com/photo-1701463387028-3947648f1337?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBhdmF0YXIlMjBwcm9maWxlJTIwcGhvdG98ZW58MXx8fHwxNzc0NTE3Mjg3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const profile2 =
  "https://images.unsplash.com/photo-1496672254107-b07a26403885?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGRlcmx5JTIwd29tYW4lMjBncmFuZG1vdGhlciUyMHBvcnRyYWl0fGVufDF8fHx8MTc3NDUxNzI4N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const profile3 =
  "https://images.unsplash.com/photo-1564783538911-cd6bb5d6bed2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMGFzaWFuJTIwbWFuJTIwcG9ydHJhaXQlMjBzbWlsZXxlbnwxfHx8fDE3NzQ0ODk1NDh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

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

const mockShorts = [
  {
    id: "short-1",
    author: "할아버지",
    username: "@member_01",
    authorAvatar: profile1,
    image: grandfatherImage,
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
    authorAvatar: profile2,
    image: grandmotherImage,
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
    authorAvatar: profile3,
    image: leesonjaeImage,
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

const userInterests = ["일상 대화", "감정 케어", "위로/위안"];

export function HomePage() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedShorts, setLikedShorts] = useState<Set<number>>(new Set());
  const [bookmarkedShorts, setBookmarkedShorts] = useState<Set<number>>(new Set());
  const [followedUsers, setFollowedUsers] = useState<Set<number>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<number>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [startY, setStartY] = useState(0);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(userInterests);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredShorts =
    selectedInterests.length > 0
      ? mockShorts.filter((short) =>
          short.interests.some((interest) =>
            selectedInterests.includes(interest),
          ),
        )
      : mockShorts;

  const currentShort = filteredShorts[currentIndex];

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest],
    );
  };

  const clearAllInterests = () => {
    setSelectedInterests([]);
  };

  const toggleLike = () => {
    setLikedShorts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(currentShort.id)) {
        newSet.delete(currentShort.id);
      } else {
        newSet.add(currentShort.id);
      }
      return newSet;
    });
  };

  const toggleBookmark = () => {
    setBookmarkedShorts((prev) => {
      const newSet = new Set(prev);
      const isBookmarked = newSet.has(currentShort.id);

      if (isBookmarked) {
        newSet.delete(currentShort.id);
        setToastMessage("저장 취소했습니다");
      } else {
        newSet.add(currentShort.id);
        setToastMessage("저장되었습니다");
      }
      return newSet;
    });
  };

  const toggleDescription = (shortId: number) => {
    setExpandedDescriptions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(shortId)) {
        newSet.delete(shortId);
      } else {
        newSet.add(shortId);
      }
      return newSet;
    });
  };

  const toggleFollow = (shortId: number) => {
    setFollowedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(shortId)) {
        newSet.delete(shortId);
      } else {
        newSet.add(shortId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {

    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []);

  const handleDragStart = (clientY: number) => {
    setIsDragging(true);
    setStartY(clientY);
  };

  const handleDragMove = (clientY: number) => {
    if (!isDragging) return;
    const diff = clientY - startY;
    setDragOffset(diff);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (
      dragOffset < -150 &&
      currentIndex < filteredShorts.length - 1
    ) {
      setCurrentIndex(currentIndex + 1);
    } else if (dragOffset > 150 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }

    setDragOffset(0);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientY);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientY);
  };

  const onMouseUp = () => {
    handleDragEnd();
  };

  const onMouseLeave = () => {
    if (isDragging) {
      handleDragEnd();
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientY);
  };

  const onTouchEnd = () => {
    handleDragEnd();
  };

  const translateY =
    -currentIndex * 100 +
    (dragOffset / window.innerHeight) * 100;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 h-screen bg-zinc-950 overflow-hidden cursor-grab active:cursor-grabbing"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {}
      <div className={`fixed top-6 left-0 right-0 z-40 w-full flex items-start gap-2 grow-1 px-2 pointer-events-none ${selectedInterests.length > 0 ? 'justify-between' : 'justify-end'}`}>
        {}
        {selectedInterests.length > 0 && (
          <div className="flex flex-wrap gap-2 width-full pointer-events-auto">
            {selectedInterests.map((interest) => (
              <div
                key={interest}
                className="px-3 py-1 bg-black/30 backdrop-blur-md rounded-full text-xs font-medium text-white flex items-center gap-1"
              >
                #{interest}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => setShowFilterModal(true)}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-10 h-10 shrink-0 flex items-center justify-center bg-black/30 backdrop-blur-md rounded-full transition-colors hover:bg-black/70 pointer-events-auto mt-[-10px]"
        >
          <Filter className="w-5 h-5 text-white" />
        </button>
      </div>

      {}
      <div
        className="absolute inset-0 transition-transform"
        style={{
          transform: `translateY(${translateY}vh)`,
          transitionDuration: isDragging ? "0ms" : "300ms",
          transitionTimingFunction:
            "cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {filteredShorts.map((short, index) => (
          <div
            key={short.id}
            className="relative h-screen w-full"
            style={{ height: "100vh" }}
          >
            {}
            <div className="absolute inset-0">
              <img
                src={short.image}
                alt={short.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
            </div>

            {}
            {index === currentIndex && (
              <div className="absolute bottom-24 left-0 right-0 px-6 z-10">

                {}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-white drop-shadow-lg">
                      {short.author}
                    </h3>
                    <p className="text-sm text-white/80 drop-shadow-lg">
                      {short.username}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFollow(short.id);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${
                      followedUsers.has(short.id)
                        ? "bg-white/20 text-white backdrop-blur-md"
                        : "bg-white text-zinc-900"
                    }`}
                  >
                    {followedUsers.has(short.id) ? "팔로잉" : "팔로우"}
                  </button>
                </div>

                {}
                <div className="flex items-center gap-4 mb-3 px-4 py-2 bg-black/30 backdrop-blur-md rounded-full w-fit">
                  <div className="flex items-center gap-1.5">
                    <MessagesSquare className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-bold text-white">{typeof short.comments === 'number' ? short.comments * 5 : '2.1K'}</span>
                  </div>
                  <div className="w-px h-4 bg-white/30" />
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-white" />
                    <span className="text-sm font-bold text-white">{short.likes}</span>
                  </div>
                  <div className="w-px h-4 bg-white/30" />
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-white" />
                    <span className="text-sm font-bold text-white">{short.comments}</span>
                  </div>
                </div>

                {}
                <div className="mb-4 ">
                  <div className="flex justify-between items-end mb-2">
                  <p
                    className={`text-sm text-white leading-relaxed drop-shadow-lg ${
                      !expandedDescriptions.has(short.id)
                        ? "line-clamp-2"
                        : ""
                    }`}
                  >
                    {short.description}
                  </p>
                  {short.description.length > 60 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDescription(short.id);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="text-xs text-white/80 font-medium mt-1 hover:text-white transition-colors shrink-0"
                    >
                      {expandedDescriptions.has(short.id)
                        ? "간략히"
                        : "더보기"}
                    </button>
                  )}
                </div>
                   {}
                <div className="flex flex-wrap gap-2 mb-3 ">
                  {short.interests.map((interest) => (
                    <span
                      key={interest}
                      className="px-3 py-1 bg-black/20 backdrop-blur-md rounded-full text-xs font-medium text-white"
                    >
                      #{interest}
                    </span>
                  ))}
                </div>
                </div>

                {}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/clone/${short.id}/call`);
                  }}
                  className="w-full h-14 bg-white/95 hover:bg-white rounded-full flex items-center justify-center gap-2 text-zinc-900 font-bold text-base transition-all shadow-lg"
                  onMouseDown={(e) => e.stopPropagation()}
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
      {showFilterModal && createPortal(
        <>
          {}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
            onClick={() => setShowFilterModal(false)}
          />

          {}
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[110] animate-slide-up max-h-[70vh] overflow-hidden">
            {}
            <div className="flex items-center justify-between p-6 border-b border-zinc-200">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-zinc-900">
                  관심사 필터
                </h2>
                {selectedInterests.length > 0 && (
                  <span className="px-2.5 py-1 bg-violet-100 text-violet-700 text-xs font-bold rounded-full">
                    {selectedInterests.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowFilterModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 transition-colors"
              >
                <X className="w-5 h-5 text-zinc-600" />
              </button>
            </div>

            {}
            <div className="p-6 overflow-y-auto max-h-[calc(70vh-160px)]">
              <div className="grid grid-cols-2 gap-3">
                {INTEREST_OPTIONS.map((interest) => {
                  const isSelected =
                    selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                        isSelected
                          ? "bg-violet-500 text-white shadow-lg"
                          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            {}
            <div className="p-6 border-t border-zinc-200 flex gap-3">
              <button
                onClick={clearAllInterests}
                className="flex-1 h-12 bg-zinc-100 text-zinc-700 rounded-xl font-bold hover:bg-zinc-200 transition-colors"
              >
                초기화
              </button>
              <button
                onClick={() => {
                  setCurrentIndex(0); 
                  setShowFilterModal(false);
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
      {toastMessage && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full shadow-lg z-50">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
