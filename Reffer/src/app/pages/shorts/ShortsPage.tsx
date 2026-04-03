import { useState, useMemo, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  Video,
  Share2,
  Bookmark,
  Phone,
  MoreVertical,
  X,
  Send,
  BookOpen,
  UserMinus,
  Zap,
  Thermometer,
  MessagesSquare,
  Search,
  Bell,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { useNavigate } from "react-router";
import Slider from "react-slick";
import logoImage from "figma:asset/b8073dfe43dc8bb9d0f8062410bb5c1bb4776d54.png";
import grandfatherImage from "figma:asset/20146946046d36208cb800f20e245b496bf1e5db.png";
import grandmotherImage from "figma:asset/5c5d09ddff50c0eb605430b525fade289e4995ab.png";
import profile1 from "figma:asset/1c1e3bed656961ad27fe0f9df28e4f656ab37c45.png";
import profile2Image from "figma:asset/a4f88cc3d7d88ec826bb9e7fcea5b5b0f72c77c3.png";
import profile3Image from "figma:asset/504b9a07b473bcf29e7f0ddb31712ad178a81480.png";
import economicExpertImage from "figma:asset/049062c0d59596d667408cb8e363226117444a45.png";
import yogaTeacherImage from "figma:asset/c503a78864b3876176f1283be90ed437e5322b3e.png";
import userProfileImage from "figma:asset/8ef462d0b1826696ebf238bf7e33ad6c3df3baa0.png";
import { myClones } from "../clones/MyClonesDashboardPage";
import svgPaths from "../../../imports/svg-drf34ufkpk";
import { PageHeader } from "../../components/common/PageHeader";

const followedPersonas = [
  {
    id: "f1",
    name: "경제전문가",
    avatar: economicExpertImage,
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
    avatar: yogaTeacherImage,
    type: "위안",
    userName: "@yoga_healer",
    interests: ["건강", "명상", "요가"],
    isMyPersona: false,
    creatorAccount: "@wellness_kim",
    intimacy: 82,
    interactions: 1567,
  },
];

const allPersonas = followedPersonas.map((persona) => ({
  ...persona,
  creatorAvatar: persona.avatar,
}));

const mockPosts = [
  {
    id: 3,
    personaId: "f1", 
    content:
      "부동산 시장의 새로운 트렌드를 분석했습니다. 지금이 기회일 수 있습니다.",
    image: economicExpertImage,
    likes: 2100,
    comments: 67,
  },
  {
    id: 5,
    personaId: "f2", 
    content:
      "아침 명상으로 하루를 시작하세요. 5분의 고요함이 당신의 하루를 바꿉니다.",
    image: yogaTeacherImage,
    likes: 1800,
    comments: 45,
  },
];

const mockComments: Record<
  number,
  Array<{
    id: string;
    author: string;
    authorAvatar: string;
    content: string;
    timestamp: string;
  }>
> = {
  1: [
    {
      id: "c1",
      author: "@investor_kim",
      authorAvatar: profile1,
      content: "정말 유익한 분석입니다! 감사합니다.",
      timestamp: "5분 전",
    },
    {
      id: "c2",
      author: "@market_lover",
      authorAvatar: profile2Image,
      content: "장기 투자 관점으로 접근하겠습니다.",
      timestamp: "12분 전",
    },
    {
      id: "c3",
      author: "@finance_pro",
      authorAvatar: profile3Image,
      content: "좋은 인사이트네요 👍",
      timestamp: "20분 전",
    },
  ],
  2: [
    {
      id: "c4",
      author: "@healing_soul",
      authorAvatar: profile2Image,
      content: "위로가 됩니다. 감사해요 💙",
      timestamp: "3분 전",
    },
    {
      id: "c5",
      author: "@mindful_life",
      authorAvatar: profile3Image,
      content: "오늘도 힘내세요!",
      timestamp: "15분 전",
    },
  ],
  3: [
    {
      id: "c6",
      author: "@realestate_king",
      authorAvatar: profile2Image,
      content: "부동산 트렌드 분석 잘 봤습니다!",
      timestamp: "1분 전",
    },
  ],
};

const formatInteractionCount = (count: number): string => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
};

const recentCalls = [
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

export function ShortsPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] =
    useState("전체");
  const [likedPosts, setLikedPosts] = useState<Set<number>>(
    new Set(),
  );
  const [bookmarkedPosts, setBookmarkedPosts] = useState<
    Set<number>
  >(new Set());
  const [toastMessage, setToastMessage] = useState<
    string | null
  >(null);
  const [commentModalPost, setCommentModalPost] = useState<
    number | null
  >(null);
  const [commentText, setCommentText] = useState("");
  const [unfollowedPersonas, setUnfollowedPersonas] = useState<
    Set<string>
  >(new Set());
  const [unfollowConfirmModal, setUnfollowConfirmModal] =
    useState<string | null>(null);
  const [showIntimacyInfo, setShowIntimacyInfo] =
    useState(false);
  const [showInteractionInfo, setShowInteractionInfo] =
    useState(false);
  const [showCallButton, setShowCallButton] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callSearchQuery, setCallSearchQuery] = useState("");

  const recentCallPersonas = useMemo(() => {
    return recentCalls
      .map((call) => {
        const persona = allPersonas.find(
          (p) => p.id === call.personaId,
        );
        return {
          ...call,
          persona,
        };
      })
      .filter((item) => item.persona);
  }, []);

  const filteredCallList = useMemo(() => {
    if (!callSearchQuery.trim()) {
      return allPersonas;
    }
    const query = callSearchQuery.toLowerCase();
    return allPersonas.filter(
      (persona) =>
        persona.name.toLowerCase().includes(query) ||
        persona.creatorAccount.toLowerCase().includes(query),
    );
  }, [callSearchQuery]);

  const allInterests = useMemo(() => {
    const interestsSet = new Set<string>();
    allPersonas.forEach((persona) => {
      persona.interests.forEach((interest) =>
        interestsSet.add(interest),
      );
    });
    return Array.from(interestsSet);
  }, []);

  const categories = useMemo(() => {
    return ["전체", ...allInterests];
  }, [allInterests]);

  const filteredPosts = useMemo(() => {
    let posts = mockPosts;

    posts = posts.filter(
      (post) => !unfollowedPersonas.has(post.personaId),
    );

    if (selectedCategory === "전체") {
      return posts;
    }

    if (selectedCategory === "내 페르소나") {
      const myPersonaIds = allPersonas
        .filter((p) => p.isMyPersona)
        .map((p) => p.id);
      return posts.filter((post) =>
        myPersonaIds.includes(post.personaId),
      );
    }

    const personasWithInterest = allPersonas
      .filter((p) => p.interests.includes(selectedCategory))
      .map((p) => p.id);
    return posts.filter((post) =>
      personasWithInterest.includes(post.personaId),
    );
  }, [selectedCategory, unfollowedPersonas]);

  const postsWithPersonaInfo = useMemo(() => {
    return filteredPosts.map((post) => {
      const persona = allPersonas.find(
        (p) => p.id === post.personaId,
      );
      return {
        ...post,
        personaName: persona?.name || "",
        personaAvatar: persona?.avatar || userProfileImage,
        personaUserName: persona?.userName || "",
        personaInterests: persona?.interests || [],
        creatorAccount: persona?.creatorAccount || "",
        creatorAvatar:
          persona?.creatorAvatar || userProfileImage,
        isMyPersona: persona?.isMyPersona || false,
        intimacy: persona?.intimacy || 0,
        interactions: persona?.interactions || 0,
      };
    });
  }, [filteredPosts]);

  const sliderSettings = {
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

  const toggleLike = (postId: number) => {
    setLikedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const toggleBookmark = (postId: number) => {
    setBookmarkedPosts((prev) => {
      const newSet = new Set(prev);
      const isBookmarked = newSet.has(postId);

      if (isBookmarked) {
        newSet.delete(postId);
        setToastMessage("저장 취소했습니다");
      } else {
        newSet.add(postId);
        setToastMessage("저장되었습니다");
      }
      return newSet;
    });
  };

  const handleCommentSubmit = () => {
    if (commentText.trim()) {

      console.log("댓글 전송:", commentText);
      setCommentText("");
    }
  };

  const handleUnfollowConfirm = () => {
    if (unfollowConfirmModal) {
      setUnfollowedPersonas((prev) => {
        const newSet = new Set(prev);
        newSet.add(unfollowConfirmModal);
        return newSet;
      });
      setUnfollowConfirmModal(null);
    }
  };

  const currentPost = commentModalPost
    ? postsWithPersonaInfo.find(
        (p) => p.id === commentModalPost,
      )
    : null;
  const currentComments = commentModalPost
    ? mockComments[commentModalPost] || []
    : [];

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY && currentY > 100) {
        setShowCallButton(false);
      } else {
        setShowCallButton(true);
      }
      setLastScrollY(currentY);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY]);

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
            {...sliderSettings}
            className="category-slider"
          >
            {categories.map((category) => (
              <div key={category}>
                <button
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all font-medium mr-2 ${
                    selectedCategory === category
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {category}
                </button>
              </div>
            ))}
          </Slider>
        </div>

      {}
      <div className="max-w-2xl mx-auto">
        {postsWithPersonaInfo.map((post) => (
          <div key={post.id} className="bg-white mb-4">
            {

}
            {}
            <div className="px-4">
              <div className="relative rounded-3xl overflow-hidden bg-zinc-100">
                <img
                  src={post.image}
                  alt="Post"
                  className="w-full aspect-[3/4] object-cover"
                />

                {}
                <div className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowIntimacyInfo(true);
                    }}
                    className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                  >
                    <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-white text-xs font-semibold">
                      {post.intimacy}°C
                    </span>
                  </button>
                  <div className="w-px h-3 bg-white/30" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowInteractionInfo(true);
                    }}
                    className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                  >
                    <MessagesSquare className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-white text-xs font-semibold">
                      {formatInteractionCount(
                        post.interactions,
                      )}
                    </span>
                  </button>
                </div>

                {}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />

                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-white font-medium">
                    {post.personaName}
                  </p>
                   <p className="text-xs text-white mb-2">
                    {post.creatorAccount}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {post.personaInterests.map(
                      (interest, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full"
                        >
                          #{interest}
                        </span>
                      ),
                    )}
                  </div>
                  <p className="text-white/90 text-sm mb-6 line-clamp-3">
                    {post.content}
                  </p>

                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        navigate(
                          `/clone/${post.personaId}/call`,
                        )
                      }
                      className="flex-1 h-12 bg-white hover:bg-zinc-100 text-zinc-900 rounded-full font-medium"
                    >
                      <Video className="w-4 h-4 mr-2" />
                      통화하기
                    </Button>
                    {post.isMyPersona ? (
                      <Button
                        onClick={() =>
                          navigate(
                            `/clone/${post.personaId}/chat`,
                          )
                        }
                        className="flex-1 h-12 bg-white/20 hover:bg-white/30 text-white border border-white/40 rounded-full font-medium backdrop-blur-sm"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="currentColor"
                          viewBox="0 0 17.894 18.9999"
                        >
                          <path d={svgPaths.p5b22b80} />
                        </svg>
                        학습하기
                      </Button>
                    ) : (
                      <Button
                        onClick={() =>
                          setUnfollowConfirmModal(
                            post.personaId,
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
                  onClick={() => toggleLike(post.id)}
                  className="flex items-center gap-1"
                >
                  <Heart
                    className={`w-6 h-6 transition-all ${
                      likedPosts.has(post.id)
                        ? "fill-red-500 text-red-500"
                        : "text-zinc-700"
                    }`}
                  />
                </button>

                <button
                  className="flex items-center gap-1"
                  onClick={() => setCommentModalPost(post.id)}
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
                  {post.likes +
                    (likedPosts.has(post.id) ? 1 : 0)}
                  개
                </p>
                <p className="text-zinc-500 text-xs mt-1">
                  댓글 {mockComments[post.id]?.length || 0}개
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {}
      {commentModalPost && (
        <div
          className="fixed inset-0 bg-black/50 z-150 flex items-end"
          onClick={() => setCommentModalPost(null)}
        >
          <div
            className="bg-white w-full rounded-t-3xl max-h-[80vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
              <h2 className="text-base font-semibold">
                댓글 {currentComments.length}개
              </h2>
              <button
                onClick={() => setCommentModalPost(null)}
                className="p-1"
              >
                <X className="w-6 h-6 text-zinc-600" />
              </button>
            </div>

            {}
            {currentPost && (
              <div className="flex items-start gap-3 px-4 py-3 border-b border-zinc-200">
                <img
                  src={currentPost.creatorAvatar}
                  alt={currentPost.creatorAccount}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">
                      {currentPost.personaName}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {currentPost.creatorAccount}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-700">
                    {currentPost.content}
                  </p>
                </div>
              </div>
            )}

            {}
            <div
              className="overflow-y-auto px-4 py-3"
              style={{ maxHeight: "calc(80vh - 250px)" }}
            >
              {currentComments.length > 0 ? (
                <div className="space-y-4">
                  {currentComments.map((comment) => (
                    <div
                      key={comment.id}
                      className="flex gap-3"
                    >
                      <img
                        src={comment.authorAvatar}
                        alt={comment.author}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">
                            {comment.author}
                          </span>
                          <span className="text-xs text-zinc-400">
                            {comment.timestamp}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-700">
                          {comment.content}
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
                src={userProfileImage}
                alt="My profile"
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1 flex items-center gap-2 bg-zinc-100 rounded-full px-4 py-2">
                <input
                  type="text"
                  placeholder="댓글 달기..."
                  value={commentText}
                  onChange={(e) =>
                    setCommentText(e.target.value)
                  }
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleCommentSubmit()
                  }
                  className="flex-1 bg-transparent outline-none text-sm"
                />
                <button
                  onClick={handleCommentSubmit}
                  disabled={!commentText.trim()}
                  className={`${
                    commentText.trim()
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
      {unfollowConfirmModal && (
        <div
          className="fixed inset-0 bg-black/50 z-150 flex items-center justify-center p-4"
          onClick={() => setUnfollowConfirmModal(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
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
                onClick={() => setUnfollowConfirmModal(null)}
                className="flex-1 h-11 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-full font-medium"
              >
                취소
              </Button>
              <Button
                onClick={handleUnfollowConfirm}
                className="flex-1 h-11 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium"
              >
                팔로우 취소
              </Button>
            </div>
          </div>
        </div>
      )}

      {}
      {toastMessage && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full z-160">
          {toastMessage}
        </div>
      )}

      {}
      {showIntimacyInfo && (
        <div
          className="fixed inset-0 bg-black/50 z-150 flex items-center justify-center p-4"
          onClick={() => setShowIntimacyInfo(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-orange-400" />
                <h3 className="text-lg font-semibold">
                  친밀도 온도
                </h3>
              </div>
              <button
                onClick={() => setShowIntimacyInfo(false)}
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
              onClick={() => setShowIntimacyInfo(false)}
              className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full font-medium mt-6"
            >
              확인
            </Button>
          </div>
        </div>
      )}

      {}
      {showInteractionInfo && (
        <div
          className="fixed inset-0 bg-black/50 z-150 flex items-center justify-center p-4"
          onClick={() => setShowInteractionInfo(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessagesSquare className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold">
                  상호작용 횟수
                </h3>
              </div>
              <button
                onClick={() => setShowInteractionInfo(false)}
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
              onClick={() => setShowInteractionInfo(false)}
              className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full font-medium"
            >
              확인
            </Button>
          </div>
        </div>
      )}

      {}
      <button
        onClick={() => setShowCallModal(true)}
        className={`fixed right-6 bottom-24 z-50 w-16 h-16 bg-black hover:bg-zinc-800 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          showCallButton
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-20 pointer-events-none"
        }`}
      >
        <Phone className="w-6 h-6" />
      </button>

      {}
      {showCallModal && (
        <div
          className="fixed inset-0 bg-black/50 z-150 flex items-end"
          onClick={() => setShowCallModal(false)}
        >
          <div
            className="bg-white w-full rounded-t-3xl max-h-[85vh] flex flex-col overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {}
            <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-200 flex-shrink-0">
              <h2 className="text-lg font-semibold">
                통화하기
              </h2>
              <button
                onClick={() => setShowCallModal(false)}
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
                  value={callSearchQuery}
                  onChange={(e) =>
                    setCallSearchQuery(e.target.value)
                  }
                  className="flex-1 bg-transparent outline-none text-sm placeholder:text-zinc-400"
                />
                {callSearchQuery && (
                  <button
                    onClick={() => setCallSearchQuery("")}
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
              {!callSearchQuery &&
                recentCallPersonas.length > 0 && (
                  <div className="px-4 py-4 border-b border-zinc-200">
                    <h3 className="text-sm font-semibold text-zinc-900 mb-3">
                      최근 통화
                    </h3>
                    <div className="space-y-3">
                      {recentCallPersonas.map((item) => (
                        <div
                          key={item.personaId}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <img
                              src={item.persona!.avatar}
                              alt={item.persona!.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm">
                                {item.persona!.name}
                              </h4>
                              <p className="text-xs text-zinc-500">
                                {item.persona!.creatorAccount}
                              </p>
                              <p className="text-xs text-zinc-400 mt-0.5">
                                {item.lastCallTime} •{" "}
                                {item.duration}
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => {
                              setShowCallModal(false);
                              navigate(
                                `/clone/${item.personaId}/call`,
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
                  {callSearchQuery ? "검색 결과" : "통화 목록"}
                </h3>
                {filteredCallList.length > 0 ? (
                  <div className="space-y-3">
                    {filteredCallList.map((persona) => (
                      <div
                        key={persona.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <img
                            src={persona.avatar}
                            alt={persona.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm">
                              {persona.name}
                            </h4>
                            <p className="text-xs text-zinc-500">
                              {persona.creatorAccount}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            setShowCallModal(false);
                            navigate(
                              `/clone/${persona.id}/call`,
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