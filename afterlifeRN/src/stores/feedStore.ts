import { create } from "zustand";
import type { FeedItem } from "../types/feed";
import { IMAGES } from "../mocks/images";

const mockFeeds: FeedItem[] = [
  {
    id: "feed-1",
    cloneId: "clone-1",
    author: "할아버지",
    username: "@member_01",
    authorAvatar: IMAGES.grandfatherAvatar,
    image: IMAGES.grandfatherPost,
    title: "할아버지",
    description: "오늘 하루는 어떠셨나요? 마음에 담아둔 이야기가 있다면 저에게 편하게 말씀주세요. 당신의 길을 함께 고민해 드릴께요.",
    type: "멤로우",
    mainCategory: "일상 및 감정 케어",
    interests: ["일상 대화", "감정 케어", "인생 조언"],
    likes: "12.4K",
    comments: 842,
  },
  {
    id: "feed-2",
    cloneId: "clone-2",
    author: "할머니",
    username: "@afterLife",
    authorAvatar: IMAGES.grandmotherAvatar,
    image: IMAGES.grandmotherPost,
    title: "할머니",
    description: "얘야, 힘든 일이 있어도 웃음을 잃지 말거라. 할머니가 항상 네 곁에서 응원하고 있단다.",
    type: "멤로우",
    mainCategory: "일상 및 감정 케어",
    interests: ["감정 케어", "인생 조언", "추억 공유"],
    likes: "8.7K",
    comments: 523,
  },
  {
    id: "feed-3",
    cloneId: "clone-3",
    author: "이선재",
    username: "@user_ex",
    authorAvatar: IMAGES.friendMale,
    image: IMAGES.friendMale,
    title: "이선재",
    description: "안녕하세요! 오늘도 함께 좋은 하루 만들어가요. 여러분의 이야기가 궁금해요.",
    type: "친구",
    mainCategory: "엔터테인먼트 및 취미",
    interests: ["엔터테인먼트", "일상 대화", "유머/재미"],
    likes: "15.2K",
    comments: 1204,
  },
];

interface FeedState {
  feeds: FeedItem[];
  likedIds: string[];
  bookmarkedIds: string[];
  followedIds: string[];
  selectedInterests: string[];
  toggleLike: (id: string) => void;
  toggleBookmark: (id: string) => void;
  toggleFollow: (id: string) => void;
  setSelectedInterests: (interests: string[]) => void;
  getFilteredFeeds: () => FeedItem[];
}

export const useFeedStore = create<FeedState>((set, get) => ({
  feeds: mockFeeds as FeedItem[],
  likedIds: [],
  bookmarkedIds: [],
  followedIds: [],
  selectedInterests: ["일상 대화", "감정 케어", "추억 공유"],

  toggleLike: (id) =>
    set((state) => ({
      likedIds: state.likedIds.includes(id)
        ? state.likedIds.filter((i) => i !== id)
        : [...state.likedIds, id],
    })),

  toggleBookmark: (id) =>
    set((state) => ({
      bookmarkedIds: state.bookmarkedIds.includes(id)
        ? state.bookmarkedIds.filter((i) => i !== id)
        : [...state.bookmarkedIds, id],
    })),

  toggleFollow: (id) =>
    set((state) => ({
      followedIds: state.followedIds.includes(id)
        ? state.followedIds.filter((i) => i !== id)
        : [...state.followedIds, id],
    })),

  setSelectedInterests: (interests) =>
    set({ selectedInterests: interests }),

  getFilteredFeeds: () => {
    const { feeds, selectedInterests } = get();
    if (selectedInterests.length === 0) return feeds;
    return feeds.filter((feed) =>
      feed.interests.some((i) => selectedInterests.includes(i))
    );
  },
}));
