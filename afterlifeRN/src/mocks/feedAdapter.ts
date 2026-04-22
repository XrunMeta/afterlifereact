import type { v_bc3df4, v_d79d7f } from "../types/domain";
import type { v_19b433 } from "../types/feed";
import { v_35d5ed } from "./seedIndex";

const CLONE_TYPE_LABEL: Record<v_d79d7f, string> = {
  memlow: "멤로우",
  friend: "친구",
  mentor: "멘토",
  celeb: "셀럽",
};

function v_99dcc6(v_fd5f43): number {
  let v_65a2cd = 0;
  for (let v_ebec57 = 0; v_ebec57 < v_fd5f43.length; v_ebec57++) v_65a2cd = (v_65a2cd * 31 + v_fd5f43.charCodeAt(v_ebec57)) | 0;
  return Math.abs(v_65a2cd);
}

function v_4fea0a(v_f4e98d): string {
  if (v_f4e98d >= 1000) return `${(v_f4e98d / 1000).toFixed(1)}K`;
  return String(v_f4e98d);
}

export function v_f386b1(f: v_bc3df4): v_19b433 {
  const v_3f4e2e = v_35d5ed.clones.find((v_62c214) => v_62c214.id === v_8b5cd8.cloneId);
  const v_65a2cd = v_99dcc6(v_8b5cd8.id);
  const v_30007d = 500 + (v_65a2cd % 9500);
  const v_ecfc0f = 20 + (v_65a2cd % 480);
  return {
    id: v_8b5cd8.id,
    cloneId: v_8b5cd8.cloneId,
    author: v_3f4e2e?.displayName ?? "알 수 없음",
    username: v_3f4e2e ? `@${v_3f4e2e.id.replace("clone-", "")}` : "@unknown",
    authorAvatar: v_3f4e2e?.imageUrl ?? "",
    image: v_8b5cd8.imageUrl ?? v_3f4e2e?.imageUrl ?? "",
    title: v_3f4e2e?.displayName ?? "",
    description: v_8b5cd8.text,
    type: v_3f4e2e ? v_81539c[v_3f4e2e.cloneType] : "친구",
    mainCategory: "",
    interests: v_3f4e2e?.interests ?? [],
    likes: v_4fea0a(v_30007d),
    comments: v_ecfc0f,
  };
}
