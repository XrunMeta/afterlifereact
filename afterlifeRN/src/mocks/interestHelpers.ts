import v_926598 from "./interests.json";

export type InterestItem = { id: string; label: string; icon: string };
export type InterestCategory = {
  id: string;
  label: string;
  emoji: string;
  subtitle: string;
  interests: InterestItem[];
};

export const v_6732dc = v_926598 as InterestCategory[];

export const v_d3a8b6 = 'etc';
export const v_6e79a1 = [
  ...v_6732dc.map((v_3f4e2e) => ({ id: v_3f4e2e.id, label: v_3f4e2e.label, emoji: v_3f4e2e.emoji })),
  { id: v_d3a8b6, label: '기타', emoji: '✏️' },
];

export const v_a3360a = {
  ...Object.fromEntries(
    v_6732dc.map((v_3f4e2e) => [v_3f4e2e.id, v_3f4e2e.interests.map((v_ebec57) => v_ebec57.label)])
  ),
  [v_d3a8b6]: [],
};

export const v_bf4124 = v_6732dc.flatMap((v_3f4e2e) =>
  v_3f4e2e.interests.map((v_ebec57) => v_ebec57.label)
);
