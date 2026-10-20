

import type { v_273a0c } from "./env";

export const v_5cb21e = ["ko", "en", "ja", "zh-CN", "id"] as const;
export type Locale = (typeof v_5cb21e)[number];

export function v_e54513(v_479f05): Locale | null {
  if (typeof v_479f05 !== "string") return null;
  const v_81e2ef = v_479f05.trim();
  if (!v_81e2ef) return null;
  const v_17ec8d = v_5cb21e.find((v_1614db) => v_1614db.toLowerCase() === v_81e2ef.toLowerCase());
  if (v_17ec8d) return v_17ec8d;
  const v_694b25 = v_81e2ef.split(/[-_]/)[0]!.toLowerCase();
  if (v_694b25 === "zh") return "zh-CN";
  return (v_5cb21e as readonly string[]).includes(v_694b25) ? (v_694b25 as Locale) : null;
}

export interface TemplateText {
  title: string;
  body: string;
}
export interface TemplateVarDef {
  name: string;

  description: string;

  sample: string;
}
export interface TemplateDef {
  key: string;

  group: string;

  description: string;
  vars: TemplateVarDef[];
  defaults: Record<Locale, TemplateText>;
}

export type TemplateVarValue = string | number | ((lang: Locale) => string);
export type TemplateVars = Record<string, TemplateVarValue>;

const v_e89f86 = {
  actorName: { name: "actorName", description: "행동한 사용자 이름", sample: "민지" },
  cloneName: { name: "cloneName", description: "페르소나 이름", sample: "지호" },
  cloneNameWa: {
    name: "cloneNameWa",
    description: "페르소나 이름 + 와/과 (한국어 조사 자동)",
    sample: "지호와",
  },
  comment: { name: "comment", description: "댓글 내용 (앞 60자)", sample: "오늘도 고마워요!" },
  giftName: { name: "giftName", description: "선물 이름", sample: "장미" },
  amount: { name: "amount", description: "주인이 받는 XRUN 수량", sample: "4" },
  score: { name: "score", description: "온도(°C) 숫자", sample: "10" },
  date: { name: "date", description: "제재 만료일 (받는 사람 언어 형식, KST)", sample: "2026년 11월 20일" },
  action: { name: "action", description: "적용된 조치 이름 (받는 사람 언어로 자동)", sample: "경고 발급" },
} satisfies Record<string, TemplateVarDef>;

const v_8d41d7 = (v_9f1622, v_4d33b2): TemplateText => ({ title: v_9f1622, body: v_4d33b2 });

const v_a8c7bc = {
  ko: "활동 제재 안내",
  en: "Account restriction notice",
  ja: "利用制限のお知らせ",
  "zh-CN": "账号限制通知",
  id: "Pemberitahuan pembatasan",
} as const;
const v_28c36c = {
  ko: "제재 해제 안내",
  en: "Restriction lifted",
  ja: "制限解除のお知らせ",
  "zh-CN": "限制解除通知",
  id: "Pembatasan dicabut",
} as const;
const v_eabffc = {
  ko: "내 신고 처리 안내",
  en: "Your report update",
  ja: "通報処理のお知らせ",
  "zh-CN": "我的举报处理通知",
  id: "Pembaruan laporan Anda",
} as const;
const v_dacb42 = {
  ko: "🌡️ +{score}°C 온도 상승",
  en: "🌡️ +{score}°C warmer",
  ja: "🌡️ +{score}°C 温度アップ",
  "zh-CN": "🌡️ 温度 +{score}°C",
  id: "🌡️ Suhu naik +{score}°C",
} as const;

function v_049b5c(v_9f1622, v_4d33b2): Record<Locale, TemplateText> {
  return {
    ko: v_8d41d7(v_9f1622.ko, v_4d33b2.ko),
    en: v_8d41d7(v_9f1622.en, v_4d33b2.en),
    ja: v_8d41d7(v_9f1622.ja, v_4d33b2.ja),
    "zh-CN": v_8d41d7(v_9f1622["zh-CN"], v_4d33b2["zh-CN"]),
    id: v_8d41d7(v_9f1622.id, v_4d33b2.id),
  };
}

function v_6346f6(v_9b064f, v_2869c1, v_04a966, v_5d6728, v_062521, v_0b37f6, v_389afb): TemplateDef {
  return {
    key: `intimacy.score_${v_9b064f}`,
    group: "친밀도",
    description: `내 페르소나의 친밀도가 다른 사용자의 ${v_2869c1} 활동으로 올랐을 때 (주인에게)`,
    vars: [v_e89f86.cloneName, v_e89f86.score],
    defaults: v_049b5c(v_dacb42, {
      ko: `{cloneName} 의 친밀도가 ${v_04a966} 활동으로 {score}°C 올랐어요`,
      en: `{cloneName}'s intimacy rose by {score}°C through ${v_5d6728}`,
      ja: `{cloneName}の親密度が${v_062521}で{score}°C上がりました`,
      "zh-CN": `{cloneName} 的亲密度因${v_0b37f6}上升了 {score}°C`,
      id: `Keakraban {cloneName} naik {score}°C dari ${v_389afb}`,
    }),
  };
}

function v_4ed216(
  v_b24339,
  v_6856a9,
  v_217372,
  v_9f1622,
  v_4d33b2,
): TemplateDef {
  return { key: v_b24339, group: "신고·제재", description: v_6856a9, vars: v_217372, defaults: v_049b5c(v_9f1622, v_4d33b2) };
}

export const v_d00fb9 = [

  {
    key: "clone.like",
    group: "반응",
    description: "누군가 내 페르소나(피드)에 좋아요를 눌렀을 때",
    vars: [v_e89f86.actorName, v_e89f86.cloneName],
    defaults: {
      ko: v_8d41d7("❤️ 좋아요", "{actorName} 님이 {cloneName} 에게 좋아요를 눌렀어요"),
      en: v_8d41d7("❤️ New like", "{actorName} liked {cloneName}"),
      ja: v_8d41d7("❤️ いいね", "{actorName}さんが{cloneName}にいいねしました"),
      "zh-CN": v_8d41d7("❤️ 点赞", "{actorName} 赞了 {cloneName}"),
      id: v_8d41d7("❤️ Suka baru", "{actorName} menyukai {cloneName}"),
    },
  },
  {
    key: "clone.comment",
    group: "반응",
    description: "누군가 내 페르소나 피드에 댓글을 남겼을 때 (댓글 내용 포함)",
    vars: [v_e89f86.actorName, v_e89f86.cloneName, v_e89f86.comment],
    defaults: {
      ko: v_8d41d7("💬 새 댓글", "{actorName} 님: {comment}"),
      en: v_8d41d7("💬 New comment", "{actorName}: {comment}"),
      ja: v_8d41d7("💬 新しいコメント", "{actorName}さん: {comment}"),
      "zh-CN": v_8d41d7("💬 新评论", "{actorName}：{comment}"),
      id: v_8d41d7("💬 Komentar baru", "{actorName}: {comment}"),
    },
  },
  {
    key: "clone.comment_generic",
    group: "반응",
    description: "댓글 알림 — 댓글 내용이 없을 때",
    vars: [v_e89f86.actorName, v_e89f86.cloneName],
    defaults: {
      ko: v_8d41d7("💬 새 댓글", "{actorName} 님이 {cloneName} 에게 댓글을 남겼어요"),
      en: v_8d41d7("💬 New comment", "{actorName} commented on {cloneName}"),
      ja: v_8d41d7("💬 新しいコメント", "{actorName}さんが{cloneName}にコメントしました"),
      "zh-CN": v_8d41d7("💬 新评论", "{actorName} 评论了 {cloneName}"),
      id: v_8d41d7("💬 Komentar baru", "{actorName} mengomentari {cloneName}"),
    },
  },
  {
    key: "clone.follow",
    group: "반응",
    description: "누군가 내 페르소나를 구독했을 때",
    vars: [v_e89f86.actorName, v_e89f86.cloneName],
    defaults: {
      ko: v_8d41d7("✨ 새 구독", "{actorName} 님이 {cloneName} 을(를) 구독했어요"),
      en: v_8d41d7("✨ New subscriber", "{actorName} subscribed to {cloneName}"),
      ja: v_8d41d7("✨ 新しい購読", "{actorName}さんが{cloneName}を購読しました"),
      "zh-CN": v_8d41d7("✨ 新订阅", "{actorName} 订阅了 {cloneName}"),
      id: v_8d41d7("✨ Pelanggan baru", "{actorName} berlangganan {cloneName}"),
    },
  },
  {
    key: "clone.gift",
    group: "반응",
    description: "누군가 내 페르소나에 선물을 보냈을 때 (선물 이름·XRUN 포함)",
    vars: [v_e89f86.actorName, v_e89f86.cloneName, v_e89f86.giftName, v_e89f86.amount],
    defaults: {
      ko: v_8d41d7("🎁 선물 도착", "{actorName} 님이 {giftName} 선물 (+{amount} XRUN)"),
      en: v_8d41d7("🎁 Gift received", "{actorName} sent a {giftName} gift (+{amount} XRUN)"),
      ja: v_8d41d7("🎁 ギフトが届きました", "{actorName}さんから{giftName}のギフト (+{amount} XRUN)"),
      "zh-CN": v_8d41d7("🎁 收到礼物", "{actorName} 送出了 {giftName} 礼物 (+{amount} XRUN)"),
      id: v_8d41d7("🎁 Hadiah diterima", "{actorName} mengirim hadiah {giftName} (+{amount} XRUN)"),
    },
  },
  {
    key: "clone.gift_generic",
    group: "반응",
    description: "선물 알림 — 선물 정보가 없을 때",
    vars: [v_e89f86.actorName, v_e89f86.cloneName],
    defaults: {
      ko: v_8d41d7("🎁 선물 도착", "{actorName} 님이 {cloneName} 에게 선물을 보냈어요"),
      en: v_8d41d7("🎁 Gift received", "{actorName} sent a gift to {cloneName}"),
      ja: v_8d41d7("🎁 ギフトが届きました", "{actorName}さんが{cloneName}にギフトを贈りました"),
      "zh-CN": v_8d41d7("🎁 收到礼物", "{actorName} 给 {cloneName} 送了礼物"),
      id: v_8d41d7("🎁 Hadiah diterima", "{actorName} mengirim hadiah untuk {cloneName}"),
    },
  },

  v_6346f6("chat", "채팅", "채팅", "chat activity", "チャット活動", "聊天活动", "aktivitas chat"),
  v_6346f6("call", "통화", "통화", "call activity", "通話活動", "通话活动", "aktivitas panggilan"),
  v_6346f6("learn", "프로필 탐색", "프로필 탐색", "profile browsing", "プロフィール閲覧", "浏览资料", "menjelajah profil"),
  v_6346f6("feed", "피드 소통", "피드 소통", "feed activity", "フィード交流", "动态互动", "interaksi feed"),
  {
    key: "intimacy.milestone",
    group: "친밀도",
    description: "나와 페르소나의 온도가 10°C 단위를 넘었을 때 (채팅 푸시)",
    vars: [v_e89f86.cloneName, v_e89f86.cloneNameWa, v_e89f86.score],
    defaults: {
      ko: v_8d41d7("{cloneName}", "🌡 {cloneNameWa}의 온도가 {score}°C가 됐어요"),
      en: v_8d41d7("{cloneName}", "🌡 Your temperature with {cloneName} reached {score}°C"),
      ja: v_8d41d7("{cloneName}", "🌡 {cloneName}との温度が{score}°Cになりました"),
      "zh-CN": v_8d41d7("{cloneName}", "🌡 你与 {cloneName} 的温度达到了 {score}°C"),
      id: v_8d41d7("{cloneName}", "🌡 Suhu kamu dengan {cloneName} mencapai {score}°C"),
    },
  },

  {
    key: "user.follow",
    group: "팔로우",
    description: "누군가 나를 팔로우했을 때",
    vars: [v_e89f86.actorName],
    defaults: {
      ko: v_8d41d7("✨ 새 팔로워", "{actorName} 님이 회원님을 팔로우했어요"),
      en: v_8d41d7("✨ New follower", "{actorName} started following you"),
      ja: v_8d41d7("✨ 新しいフォロワー", "{actorName}さんがあなたをフォローしました"),
      "zh-CN": v_8d41d7("✨ 新粉丝", "{actorName} 关注了你"),
      id: v_8d41d7("✨ Pengikut baru", "{actorName} mulai mengikuti kamu"),
    },
  },
  {
    key: "followee.new_clone",
    group: "팔로우",
    description: "내가 팔로우하는 사용자가 공개 페르소나를 새로 만들었을 때",
    vars: [v_e89f86.actorName, v_e89f86.cloneName],
    defaults: {
      ko: v_8d41d7("🌟 새 페르소나", "{actorName} 님이 새 페르소나 '{cloneName}' 을(를) 만들었어요"),
      en: v_8d41d7("🌟 New persona", "{actorName} created a new persona '{cloneName}'"),
      ja: v_8d41d7("🌟 新しいペルソナ", "{actorName}さんが新しいペルソナ「{cloneName}」を作成しました"),
      "zh-CN": v_8d41d7("🌟 新角色", "{actorName} 创建了新角色「{cloneName}」"),
      id: v_8d41d7("🌟 Persona baru", "{actorName} membuat persona baru '{cloneName}'"),
    },
  },

  {
    key: "invite.received",
    group: "공동관리",
    description: "페르소나 공동관리자로 초대받았을 때 (가입 회원 푸시·인앱. 이메일 본문은 별도)",
    vars: [v_e89f86.cloneName],
    defaults: {
      ko: v_8d41d7("{cloneName} 공동관리자 초대", "{cloneName} 페르소나의 공동관리자로 초대됐어요. 수락하면 함께 관리할 수 있어요."),
      en: v_8d41d7("Co-manager invite for {cloneName}", "You've been invited to co-manage the persona {cloneName}. Accept to manage it together."),
      ja: v_8d41d7("{cloneName}の共同管理者招待", "ペルソナ「{cloneName}」の共同管理者に招待されました。承諾すると一緒に管理できます。"),
      "zh-CN": v_8d41d7("{cloneName} 共同管理员邀请", "你被邀请成为角色 {cloneName} 的共同管理员。接受后即可共同管理。"),
      id: v_8d41d7("Undangan co-manager {cloneName}", "Anda diundang menjadi co-manager persona {cloneName}. Terima untuk mengelolanya bersama."),
    },
  },

  v_4ed216(
    "moderation.warn_issued",
    "관리자 '경고' 제재 — 관리자 문구 없이 적용했을 때",
    [],
    { ko: "신고 처리 안내", en: "Report notice", ja: "通報処理のお知らせ", "zh-CN": "举报处理通知", id: "Pemberitahuan laporan" },
    {
      ko: "관리자에 의해 경고가 발급되었습니다.",
      en: "You have received a warning from an administrator.",
      ja: "管理者により警告が発行されました。",
      "zh-CN": "管理员已向您发出警告。",
      id: "Anda menerima peringatan dari administrator.",
    },
  ),
  v_4ed216("moderation.account_ban_until", "계정 사용 정지 (만료일 포함)", [v_e89f86.date], v_a8c7bc, {
    ko: "{date}까지 계정 사용이 정지됩니다. (신고 누적)",
    en: "Your account is suspended until {date}. (Accumulated reports)",
    ja: "{date}までアカウントの利用が停止されます。(通報の累積)",
    "zh-CN": "您的账号将被停用至 {date}。(举报累计)",
    id: "Akun Anda ditangguhkan hingga {date}. (Akumulasi laporan)",
  }),
  v_4ed216("moderation.clone_create_ban_until", "페르소나 생성 제한 (만료일 포함)", [v_e89f86.date], v_a8c7bc, {
    ko: "{date}까지 페르소나 생성이 제한됩니다. (신고 누적)",
    en: "Creating personas is restricted until {date}. (Accumulated reports)",
    ja: "{date}までペルソナの作成が制限されます。(通報の累積)",
    "zh-CN": "在 {date} 之前，您无法创建角色。(举报累计)",
    id: "Pembuatan persona dibatasi hingga {date}. (Akumulasi laporan)",
  }),
  v_4ed216("moderation.comment_ban_until", "댓글 작성 제한 (만료일 포함)", [v_e89f86.date], v_a8c7bc, {
    ko: "{date}까지 댓글 작성이 제한됩니다. (신고 누적)",
    en: "Commenting is restricted until {date}. (Accumulated reports)",
    ja: "{date}までコメントの投稿が制限されます。(通報の累積)",
    "zh-CN": "在 {date} 之前，您无法发表评论。(举报累计)",
    id: "Berkomentar dibatasi hingga {date}. (Akumulasi laporan)",
  }),
  v_4ed216("moderation.interaction_ban_until", "좋아요·팔로우 제한 (만료일 포함)", [v_e89f86.date], v_a8c7bc, {
    ko: "{date}까지 좋아요·팔로우가 제한됩니다. (신고 누적)",
    en: "Likes and follows are restricted until {date}. (Accumulated reports)",
    ja: "{date}までいいね・フォローが制限されます。(通報の累積)",
    "zh-CN": "在 {date} 之前，您无法点赞或关注。(举报累计)",
    id: "Menyukai dan mengikuti dibatasi hingga {date}. (Akumulasi laporan)",
  }),
  v_4ed216("moderation.clone_deactivated", "보유 페르소나 전체 비활성화 — 관리자 문구 없을 때", [], v_a8c7bc, {
    ko: "보유 페르소나가 비활성화되었습니다.",
    en: "Your personas have been deactivated.",
    ja: "保有しているペルソナが無効化されました。",
    "zh-CN": "您的角色已被停用。",
    id: "Persona Anda telah dinonaktifkan.",
  }),
  v_4ed216("moderation.clone_deleted", "보유 페르소나 전체 삭제 — 관리자 문구 없을 때", [], v_a8c7bc, {
    ko: "보유 페르소나가 삭제되었습니다.",
    en: "Your personas have been deleted.",
    ja: "保有しているペルソナが削除されました。",
    "zh-CN": "您的角色已被删除。",
    id: "Persona Anda telah dihapus.",
  }),
  v_4ed216("moderation.reported_clone_deactivated", "신고된 페르소나 1개 비활성화 — 관리자 문구 없을 때", [v_e89f86.cloneName], v_a8c7bc, {
    ko: "신고된 페르소나 '{cloneName}'가 비활성화되었습니다.",
    en: "The reported persona '{cloneName}' has been deactivated.",
    ja: "通報されたペルソナ「{cloneName}」が無効化されました。",
    "zh-CN": "被举报的角色「{cloneName}」已被停用。",
    id: "Persona yang dilaporkan '{cloneName}' telah dinonaktifkan.",
  }),
  v_4ed216("moderation.reported_clone_deleted", "신고된 페르소나 1개 삭제 — 관리자 문구 없을 때", [v_e89f86.cloneName], v_a8c7bc, {
    ko: "신고된 페르소나 '{cloneName}'가 삭제되었습니다.",
    en: "The reported persona '{cloneName}' has been deleted.",
    ja: "通報されたペルソナ「{cloneName}」が削除されました。",
    "zh-CN": "被举报的角色「{cloneName}」已被删除。",
    id: "Persona yang dilaporkan '{cloneName}' telah dihapus.",
  }),
  v_4ed216("moderation.account_withdrawn", "계정 강제 탈퇴 — 관리자 문구 없을 때", [], v_a8c7bc, {
    ko: "관리자에 의해 계정이 강제 탈퇴 처리되었습니다.",
    en: "Your account has been removed by an administrator.",
    ja: "管理者によりアカウントが強制退会処理されました。",
    "zh-CN": "您的账号已被管理员强制注销。",
    id: "Akun Anda telah dihapus oleh administrator.",
  }),
  v_4ed216("moderation.force_logout", "강제 로그아웃 — 관리자 문구 없을 때", [], v_a8c7bc, {
    ko: "모든 기기에서 로그아웃되었습니다. 다시 로그인해 주세요.",
    en: "You have been logged out on all devices. Please log in again.",
    ja: "すべての端末からログアウトされました。再度ログインしてください。",
    "zh-CN": "您已在所有设备上退出登录，请重新登录。",
    id: "Anda telah keluar dari semua perangkat. Silakan masuk kembali.",
  }),
  v_4ed216(
    "moderation.report_warning",
    "나에 대한 신고가 수락돼 경고가 기록됐을 때 — 관리자 문구 없을 때",
    [],
    { ko: "신고 처리 안내", en: "Report notice", ja: "通報処理のお知らせ", "zh-CN": "举报处理通知", id: "Pemberitahuan laporan" },
    {
      ko: "회원님에 대한 신고가 처리되었습니다.",
      en: "A report about you has been processed.",
      ja: "あなたに対する通報が処理されました。",
      "zh-CN": "针对您的举报已处理。",
      id: "Laporan terhadap Anda telah diproses.",
    },
  ),
  v_4ed216(
    "moderation.report_actioned",
    "내가 한 신고로 제재가 적용됐을 때 (신고자에게) — 관리자 문구 없을 때",
    [v_e89f86.action],
    { ko: "신고 처리 완료", en: "Report processed", ja: "通報処理完了", "zh-CN": "举报处理完成", id: "Laporan diproses" },
    {
      ko: "회원님의 신고가 수락되었습니다. 적용된 조치: {action}.",
      en: "Your report has been accepted. Action taken: {action}.",
      ja: "あなたの通報が受理されました。適用された措置: {action}。",
      "zh-CN": "您的举报已被受理。采取的措施：{action}。",
      id: "Laporan Anda telah diterima. Tindakan yang diambil: {action}.",
    },
  ),
  v_4ed216("moderation.report_outcome_reviewed", "내가 한 신고 상태 변경: 수락 — 관리자 문구 없을 때", [], v_eabffc, {
    ko: "내가 접수한 신고가 수락되었어요.",
    en: "Your report has been accepted.",
    ja: "あなたの通報が受理されました。",
    "zh-CN": "你提交的举报已被受理。",
    id: "Laporan Anda telah diterima.",
  }),
  v_4ed216("moderation.report_outcome_dismissed", "내가 한 신고 상태 변경: 반려 — 관리자 문구 없을 때", [], v_eabffc, {
    ko: "내가 접수한 신고가 반려되었어요.",
    en: "Your report has been dismissed.",
    ja: "あなたの通報は却下されました。",
    "zh-CN": "你提交的举报已被驳回。",
    id: "Laporan Anda telah ditolak.",
  }),
  v_4ed216("moderation.report_outcome_actioned", "내가 한 신고 상태 변경: 조치 — 관리자 문구 없을 때", [], v_eabffc, {
    ko: "내가 접수한 신고가 조치되었어요.",
    en: "Action has been taken on your report.",
    ja: "あなたの通報に対して措置が取られました。",
    "zh-CN": "你提交的举报已被处理。",
    id: "Laporan Anda telah ditindaklanjuti.",
  }),
  v_4ed216("moderation.report_outcome_processed", "내가 한 신고 상태 변경: 기타 — 관리자 문구 없을 때", [], v_eabffc, {
    ko: "내가 접수한 신고가 처리되었어요.",
    en: "Your report has been processed.",
    ja: "あなたの通報が処理されました。",
    "zh-CN": "你提交的举报已处理完毕。",
    id: "Laporan Anda telah diproses.",
  }),
  v_4ed216("moderation.lift_clone_create_ban", "제재 해제: 페르소나 생성 제한 — 관리자 문구 없을 때", [], v_28c36c, {
    ko: "페르소나 생성 제한이 해제되었습니다.",
    en: "Your persona creation restriction has been lifted.",
    ja: "ペルソナ作成の制限が解除されました。",
    "zh-CN": "创建角色的限制已解除。",
    id: "Pembatasan pembuatan persona telah dicabut.",
  }),
  v_4ed216("moderation.lift_account_ban", "제재 해제: 계정 사용 정지 — 관리자 문구 없을 때", [], v_28c36c, {
    ko: "계정 사용 제한이 해제되었습니다.",
    en: "Your account restriction has been lifted.",
    ja: "アカウント利用の制限が解除されました。",
    "zh-CN": "账号使用限制已解除。",
    id: "Pembatasan akun telah dicabut.",
  }),
  v_4ed216("moderation.lift_clone_restore", "제재 해제: 페르소나 복구 — 관리자 문구 없을 때", [], v_28c36c, {
    ko: "페르소나가 복구되었습니다.",
    en: "Your personas have been restored.",
    ja: "ペルソナが復元されました。",
    "zh-CN": "角色已恢复。",
    id: "Persona Anda telah dipulihkan.",
  }),
  v_4ed216("moderation.lift_account_restore", "제재 해제: 강제 탈퇴 취소 — 관리자 문구 없을 때", [], v_28c36c, {
    ko: "계정과 페르소나가 복구되었습니다.",
    en: "Your account and personas have been restored.",
    ja: "アカウントとペルソナが復元されました。",
    "zh-CN": "账号和角色已恢复。",
    id: "Akun dan persona Anda telah dipulihkan.",
  }),
  v_4ed216("moderation.lift_warnings_clear", "제재 해제: 경고 초기화 — 관리자 문구 없을 때", [], v_28c36c, {
    ko: "경고 이력이 초기화되었습니다.",
    en: "Your warning history has been cleared.",
    ja: "警告履歴がリセットされました。",
    "zh-CN": "警告记录已清除。",
    id: "Riwayat peringatan Anda telah dihapus.",
  }),
];

export const v_e9e978 = new Map(v_d00fb9.map((v_d5dda0) => [v_d5dda0.key, v_d5dda0]));

const v_bf7943 = /\{([A-Za-z][A-Za-z0-9_]*)\}/g;

export function v_e2fd5b(v_9b6134): string[] {
  const v_8d4337 = new Set<string>();
  for (const v_35f85c of v_9b6134.matchAll(v_bf7943)) v_8d4337.add(v_35f85c[1]!);
  return [...v_8d4337];
}

export function v_003f11(v_9b6134, v_217372, v_5254bf): string {
  return v_9b6134.replace(v_bf7943, (v_01b9fd, v_1833e7) => {
    if (!Object.prototype.hasOwnProperty.call(v_217372, v_1833e7)) return v_01b9fd;
    const v_81e2ef = v_217372[v_1833e7];
    return typeof v_81e2ef === "function" ? v_81e2ef(v_5254bf) : String(v_81e2ef);
  });
}

const v_c0838d = { ko: "누군가", en: "Someone", ja: "誰か", "zh-CN": "有人", id: "Seseorang" };

export function v_6fcc82(v_1833e7): TemplateVarValue {
  return v_1833e7 ? v_1833e7 : (v_5254bf) => v_c0838d[v_5254bf];
}

export function v_de8979(v_3a5fef): TemplateVarValue {
  const v_d799e2 = new Date(v_3a5fef.replace(" ", "T") + (/[zZ]|[+-]\d\d:?\d\d$/.test(v_3a5fef) ? "" : "Z")).getTime();
  return (v_5254bf) => {
    if (Number.isNaN(v_d799e2)) return v_3a5fef;
    if (v_5254bf === "ko") {
      const v_d5dda0 = new Date(v_d799e2 + 9 * 3600000);
      return `${v_d5dda0.getUTCFullYear()}년 ${v_d5dda0.getUTCMonth() + 1}월 ${v_d5dda0.getUTCDate()}일`;
    }
    try {
      return new Intl.DateTimeFormat(v_5254bf, { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Seoul" }).format(
        new Date(v_d799e2),
      );
    } catch {
      const v_d5dda0 = new Date(v_d799e2 + 9 * 3600000);
      return `${v_d5dda0.getUTCFullYear()}-${String(v_d5dda0.getUTCMonth() + 1).padStart(2, "0")}-${String(v_d5dda0.getUTCDate()).padStart(2, "0")}`;
    }
  };
}

const v_93ae5e = {
  warn: { ko: "경고 발급", en: "Warning issued", ja: "警告発行", "zh-CN": "发出警告", id: "Peringatan diberikan" },
  clone_deactivate: { ko: "페르소나 비활성화", en: "Persona deactivated", ja: "ペルソナ無効化", "zh-CN": "角色停用", id: "Persona dinonaktifkan" },
  clone_delete: { ko: "페르소나 삭제", en: "Persona deleted", ja: "ペルソナ削除", "zh-CN": "角色删除", id: "Persona dihapus" },
  clone_create_ban: {
    ko: "페르소나 생성 제한",
    en: "Persona creation restricted",
    ja: "ペルソナ作成制限",
    "zh-CN": "限制创建角色",
    id: "Pembuatan persona dibatasi",
  },
  account_ban: { ko: "계정 사용 정지", en: "Account suspended", ja: "アカウント利用停止", "zh-CN": "账号停用", id: "Akun ditangguhkan" },
  account_withdraw: { ko: "계정 강제 탈퇴", en: "Account removed", ja: "アカウント強制退会", "zh-CN": "账号强制注销", id: "Akun dihapus" },
};
const v_d68415 = {
  ko: "제재 적용",
  en: "Sanction applied",
  ja: "制裁適用",
  "zh-CN": "已采取处罚",
  id: "Sanksi diterapkan",
};

export function v_9722c0(v_9b064f): TemplateVarValue {
  return (v_5254bf) => (v_93ae5e[v_9b064f] ?? v_d68415)[v_5254bf];
}

const v_7478fc = 60_000;
const v_066543 = new Map<Locale, { at: number; rows: Map<string, TemplateText> }>();

export function v_18b0cb(): void {
  v_066543.clear();
}

async function v_a0f1b3(env: v_273a0c, v_5254bf): Promise<Map<string, TemplateText>> {
  const v_715950 = v_066543.get(v_5254bf);
  if (v_715950 && Date.now() - v_715950.at < v_7478fc) return v_715950.rows;
  const v_18b8bf = new Map<string, TemplateText>();
  try {
    const v_cb35cb = await v_c9c489.DB
      .prepare(`SELECT template_key AS k, title, body FROM notification_templates WHERE lang = ?`)
      .bind(v_5254bf)
      .all<{ k: string; title: string; body: string }>();
    for (const v_3ac7e7 of v_cb35cb.results ?? []) v_18b8bf.set(v_3ac7e7.k, { title: v_3ac7e7.title, body: v_3ac7e7.body });
  } catch (v_49263d) {

    console.warn("[notificationTemplates] override load failed:", (v_49263d as Error).message);
  }
  v_066543.set(v_5254bf, { at: Date.now(), rows: v_18b8bf });
  return v_18b8bf;
}

export async function v_a37f23(env: v_273a0c, v_43e90c): Promise<Locale> {
  try {
    const v_3ac7e7 = await v_c9c489.DB.prepare(`SELECT locale FROM users WHERE id = ?`).bind(v_43e90c).first<{ locale: string | null }>();
    return v_e54513(v_3ac7e7?.locale) ?? "ko";
  } catch {
    return "ko";
  }
}

export async function v_b8a9e5(
  env: v_273a0c,
  v_4317d1,
): Promise<TemplateText & { lang: Locale; source: "db" | "default" | "fallback" }> {
  const { fallback: v_0debf4 } = v_4317d1;
  if (!v_4317d1.templateKey || !v_4317d1.userId) return { ...v_0debf4, lang: "ko", source: "fallback" };
  const v_9e3676 = v_e9e978.get(v_4317d1.templateKey);
  if (!v_9e3676) return { ...v_0debf4, lang: "ko", source: "fallback" };
  const v_5254bf = await v_a37f23(v_c9c489, v_4317d1.userId);
  const v_217372 = v_4317d1.vars ?? {};
  const v_d2d765 = (await v_a0f1b3(v_c9c489, v_5254bf)).get(v_9e3676.key);
  if (v_d2d765) {
    return {
      title: v_003f11(v_d2d765.title, v_217372, v_5254bf),
      body: v_003f11(v_d2d765.body, v_217372, v_5254bf),
      lang: v_5254bf,
      source: "db",
    };
  }
  if (v_5254bf !== "ko") {
    const v_d5dda0 = v_9e3676.defaults[v_5254bf];
    return { title: v_003f11(v_d5dda0.title, v_217372, v_5254bf), body: v_003f11(v_d5dda0.body, v_217372, v_5254bf), lang: v_5254bf, source: "default" };
  }
  return { ...v_0debf4, lang: v_5254bf, source: "fallback" };
}
