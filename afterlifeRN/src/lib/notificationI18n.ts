

import type { v_d9bc70 } from "../api/notifications";

type TFn = (key: string, opts?: Record<string, unknown>) => string;

const v_fb9c12 = {
  "신고 당함": "reports.adminMessages.reported",
  "신고당함": "reports.adminMessages.reported",
  "프로필 사용자로부터 신고 당했습니다": "reports.adminMessages.reportedByProfile",
};

const v_1cb55f = {
  user_follow: "notifications.types.user_follow.title",
  followee_new_clone: "notifications.types.followee_new_clone.title",
  clone_like: "notifications.types.clone_like.title",
  clone_comment: "notifications.types.clone_comment.title",
  clone_follow: "notifications.types.clone_follow.title",
  clone_gift: "notifications.types.clone_gift.title",
  intimacy_score: "notifications.types.intimacy_score.title",
  moderation: "notifications.types.moderation.title",
  invite_received: "notifications.types.invite_received.title",
  invite_accepted: "notifications.types.invite_accepted.title",
  share_kicked: "notifications.types.share_kicked.title",
  ownership_transferred: "notifications.types.ownership_transferred.title",
};

const v_f1d9a2 = {
  "신고당함": "notifications.types.reported.title",
  "신고 당함": "notifications.types.reported.title",
  "신고 처리 안내": "notifications.types.moderation.title",
  "신고 처리 완료": "notifications.types.moderation.reporterTitle",
  "활동 제재 안내": "notifications.types.moderation.penaltyTitle",
  "제재 해제 안내": "notifications.types.moderation.liftedTitle",
  "✨ 새 팔로워": "notifications.types.user_follow.title",
  "🌟 새 페르소나": "notifications.types.followee_new_clone.title",
  "❤️ 좋아요": "notifications.types.clone_like.title",
  "💬 새 댓글": "notifications.types.clone_comment.title",
  "✨ 새 구독": "notifications.types.clone_follow.title",
  "🎁 선물 도착": "notifications.types.clone_gift.title",
};

const v_d23148 = {
  ...v_fb9c12,
  "회원님에 대한 신고가 처리되었습니다.": "notifications.types.moderation.defaultBody",
  "회원님에 대한 제재가 적용되었습니다.": "notifications.types.moderation.penaltyBody",
};

const v_e4df0e = /^🌡(?:️)?\s*\+(\d+)°C\s*온도 상승$/;

export function v_feb78c(
  v_a8cd21,
  v_8d41d7,
): string {
  if (!v_a8cd21) return "";
  const v_2f361a = v_a8cd21.trim();
  const v_b24339 = v_fb9c12[v_2f361a];
  if (v_b24339) return v_8d41d7(v_b24339, { defaultValue: v_2f361a });
  return v_a8cd21;
}

export function v_1e31b6(
  item: v_d9bc70,
  v_8d41d7,
): { title: string | null; body: string | null } {
  let v_9f1622 = v_8c0b26.title;
  let v_4d33b2 = v_8c0b26.body;

  if (v_9f1622) {
    const v_dd064b = v_f1d9a2[v_9f1622.trim()];
    if (v_dd064b) {
      v_9f1622 = v_8d41d7(v_dd064b, { defaultValue: v_9f1622 });
    } else {
      const v_b74b9c = v_9f1622.trim().match(v_e4df0e);
      if (v_b74b9c) {
        v_9f1622 = v_8d41d7("notifications.types.intimacy_score.title", {
          score: v_b74b9c[1],
          defaultValue: v_9f1622,
        });
      } else if (v_1cb55f[v_8c0b26.type]) {
        const v_9390e8 = v_8c0b26.data ?? {};
        const v_740dd8 =
          typeof v_9390e8.score === "number" ? v_9390e8.score : undefined;
        v_9f1622 = v_8d41d7(v_1cb55f[v_8c0b26.type], {
          score: v_740dd8,
          defaultValue: v_9f1622,
        });
      }
    }
  } else if (v_1cb55f[v_8c0b26.type]) {
    const v_9390e8 = v_8c0b26.data ?? {};
    v_9f1622 = v_8d41d7(v_1cb55f[v_8c0b26.type], {
      score: typeof v_9390e8.score === "number" ? v_9390e8.score : undefined,
      defaultValue: "",
    }) || null;
  }

  if (v_4d33b2) {
    const v_dd064b = v_d23148[v_4d33b2.trim()];
    if (v_dd064b) {
      v_4d33b2 = v_8d41d7(v_dd064b, { defaultValue: v_4d33b2 });
    }
  }

  return { title: v_9f1622, body: v_4d33b2 };
}
