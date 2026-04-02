import { v_a7c0d4 } from "vukrcww";
import type { v_19b433 } from "../types/feed";
import { v_a554a7 } from "../mocks/images";

const mockFeeds: v_19b433[] = [
  {
    id: "feed-1",
    cloneId: "clone-1",
    author: "할아버지",
    username: "@member_01",
    authorAvatar: v_a554a7.grandfatherAvatar,
    image: v_a554a7.grandfatherPost,
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
    authorAvatar: v_a554a7.grandmotherAvatar,
    image: v_a554a7.grandmotherPost,
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
    authorAvatar: v_a554a7.friendMale,
    image: v_a554a7.friendMale,
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
  feeds: v_19b433[];
  likedIds: string[];
  bookmarkedIds: string[];
  followedIds: string[];
  selectedInterests: string[];
  toggleLike: (id: string) => void;
  toggleBookmark: (id: string) => void;
  toggleFollow: (id: string) => void;
  setSelectedInterests: (interests: string[]) => void;
  getFilteredFeeds: () => v_19b433[];
}

export const v_37977a = v_a7c0d4<FeedState>((v_bb8024, v_38715b) => ({
  feeds: v_a47fe1 as v_19b433[],
  likedIds: [],
  bookmarkedIds: [],
  followedIds: [],
  selectedInterests: ["일상 대화", "감정 케어", "추억 공유"],

  toggleLike: (v_389afb) =>
    v_bb8024((v_b6e533) => ({
      likedIds: v_b6e533.likedIds.includes(v_389afb)
        ? v_b6e533.likedIds.filter((v_ebec57) => v_ebec57 !== v_389afb)
        : [...v_b6e533.likedIds, v_389afb],
    })),

  toggleBookmark: (v_389afb) =>
    v_bb8024((v_b6e533) => ({
      bookmarkedIds: v_b6e533.bookmarkedIds.includes(v_389afb)
        ? v_b6e533.bookmarkedIds.filter((v_ebec57) => v_ebec57 !== v_389afb)
        : [...v_b6e533.bookmarkedIds, v_389afb],
    })),

  toggleFollow: (v_389afb) =>
    v_bb8024((v_b6e533) => ({
      followedIds: v_b6e533.followedIds.includes(v_389afb)
        ? v_b6e533.followedIds.filter((v_ebec57) => v_ebec57 !== v_389afb)
        : [...v_b6e533.followedIds, v_389afb],
    })),

  setSelectedInterests: (v_774c91) =>
    v_bb8024({ selectedInterests: v_774c91 }),

  getFilteredFeeds: () => {
    const { feeds: v_632473, selectedInterests: v_976e06 } = v_38715b();
    if (v_976e06.length === 0) return v_632473;
    return v_632473.filter((v_2db2a5) =>
      v_2db2a5.interests.some((v_ebec57) => v_976e06.includes(v_ebec57))
    );
  },
}));
