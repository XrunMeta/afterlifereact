import interestCategories from "./interests.json";

export type InterestItem = { id: string; label: string; icon: string };
export type InterestCategory = {
  id: string;
  label: string;
  emoji: string;
  subtitle: string;
  interests: InterestItem[];
};

export const INTEREST_CATEGORIES = interestCategories as InterestCategory[];

export const ETC_CATEGORY_ID = 'etc';
export const CATEGORIES = [
  ...INTEREST_CATEGORIES.map((c) => ({ id: c.id, label: c.label, emoji: c.emoji })),
  { id: ETC_CATEGORY_ID, label: '기타', emoji: '✏️' },
];

export const INTEREST_MAP: Record<string, string[]> = {
  ...Object.fromEntries(
    INTEREST_CATEGORIES.map((c) => [c.id, c.interests.map((i) => i.label)])
  ),
  [ETC_CATEGORY_ID]: [],
};

export const ALL_INTERESTS: string[] = INTEREST_CATEGORIES.flatMap((c) =>
  c.interests.map((i) => i.label)
);
