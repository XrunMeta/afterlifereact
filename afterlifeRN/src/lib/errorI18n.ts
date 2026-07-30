

import i18n from "../i18n";

interface RegexRule {
  pattern: RegExp;
  key: string;
  extract?: (m: RegExpMatchArray) => Record<string, unknown>;
}

const COMBO_MATCHES: Record<string, string> = {
  "ACCOUNT_DELETED::이미 탈퇴한 계정이에요.": "errors.accountDeleted",
  "ACCOUNT_SUSPENDED::신고 누적으로 계정 사용이 정지되었습니다.": "errors.accountSuspended",
  "ACCOUNT_LOCKED::Account temporarily locked.": "errors.accountLocked",
  "ACCOUNT_LOCKED::Too many failures — try again later.": "errors.tooManyFailures",
  "ACCOUNT_LOCKED::Account locked.": "errors.accountLocked",
  "UNAUTHENTICATED::Invalid credentials.": "errors.invalidCredentials",
  "CONFLICT::Email already registered.": "errors.emailAlreadyRegistered",
  "NOT_FOUND::가입된 이메일이 아닙니다.": "errors.emailNotRegistered",
  "FORBIDDEN::신고 누적으로 계정이 일시 비활성화되어 페르소나를 생성할 수 없어요.":
    "errors.accountSuspendedForPersona",
  "CONFLICT::xrun 계정이 연동되어 있지 않아요.": "errors.xrunNotLinked",
  "CONFLICT::xrun account not linked": "errors.xrunNotLinked",
  "CONFLICT::내 계정에 xrun 이 연동되어 있지 않아요.": "errors.myXrunNotLinked",
  "CONFLICT::중복된 아이디입니다. 다른 아이디를 사용해주세요.": "errors.usernameDuplicate",
  "INSUFFICIENT_FUNDS::XRUN 잔액이 부족해요.": "errors.xrunInsufficient",
  "INSUFFICIENT_FUNDS::Insufficient XRUN balance.": "errors.xrunInsufficient",
  "INSUFFICIENT_CREDITS::Not enough credits to chat.": "errors.notEnoughCreditsChat",
  "INSUFFICIENT_CREDITS::Not enough credits.": "errors.notEnoughCredits",
  "INTERNAL_ERROR::페르소나 생성에 실패했어요.": "errors.personaCreateFailed",
  "QUOTA_EXCEEDED::최대 페르소나 개수(100개)에 도달했어요.": "errors.personaMaxReached",
  "PAYMENT_REQUIRED::Persona creation requires payment.": "errors.personaPaymentRequired",
  "PAYMENT_PIN_REQUIRED::결제 비밀번호가 설정되어 있지 않아요.": "errors.paymentPinNotSet",
  "PAYMENT_PIN_INVALID::결제 비밀번호가 일치하지 않아요.": "errors.paymentPinInvalid",
  "SERVICE_UNAVAILABLE::interpret 서비스가 설정되지 않았어요.":
    "errors.interpretServiceNotConfigured",
  "SERVICE_UNAVAILABLE::follow-up 서비스가 설정되지 않았어요.":
    "errors.followupServiceNotConfigured",
  "UPSTREAM_FAILURE::해석 서비스가 응답하지 않아요.": "errors.interpretServiceNoResponse",
  "UPSTREAM_FAILURE::해석 서비스 오류": "errors.interpretServiceError",
  "INTERNAL_ERROR::L2 저장에 실패했어요.": "errors.l2SaveFailed",
  "SHREDDED::Restore window has expired (90 days).": "errors.restoreWindowExpired",
  "OTP_INVALID::Too many wrong attempts. Request a new code.":
    "errors.otpTooManyAttempts",
  "OTP_EXPIRED::Verification code has expired. Request a new one.":
    "errors.otpExpired",
  "OTP_REQUIRED::No verification code in progress. Request one first.":
    "errors.otpRequired",
  "OTP_REQUIRED::Either verificationCode or googleIdToken is required.":
    "errors.otpOrGoogleRequired",
  "SERVICE_UNAVAILABLE::No call capacity available.": "errors.noCallCapacity",
  "SERVICE_UNAVAILABLE::Not enough credits.": "errors.notEnoughCredits",
};

const EXACT_MATCHES: Record<string, string> = {

  "잘못된 페르소나 ID 에요.": "errors.invalidPersonaId",
  "페르소나를 찾을 수 없어요.": "errors.personaNotFound",
  "소유자만 조회할 수 있어요.": "errors.ownerOnlyView",
  "소유자만 요청할 수 있어요.": "errors.ownerOnlyRequest",
  "소유자만 변경할 수 있어요.": "errors.ownerOnlyEdit",
  "소유자만 열람할 수 있어요.": "errors.ownerOnlyRead",
  "소유자만 가능해요.": "errors.ownerOnly",
  "주 편집자만 페르소나 정보를 수정할 수 있어요.": "errors.primaryEditorOnly",
  "비공개 페르소나예요.": "errors.personaPrivate",
  "팔로워에게만 공개된 페르소나예요.": "errors.personaFollowersOnly",
  "이 페르소나에 접근할 권한이 없어요.": "errors.personaAccessDenied",
  "이 클론에 접근할 수 없어요.": "errors.cloneAccessDenied",
  "비공개 페르소나는 팔로우할 수 없어요.": "errors.privatePersonaCannotFollow",
  "사용자를 찾을 수 없어요.": "errors.userNotFound",
  "자기 자신의 페르소나에는 선물할 수 없어요.": "errors.giftToSelfDenied",

  "questionKey 가 필요해요.": "errors.questionKeyRequired",
  "답변이 비어있거나 너무 길어요.": "errors.answerEmptyOrTooLong",
  "질문을 찾을 수 없어요.": "errors.questionNotFound",
  "질문에 카테고리(slot)가 없어요.": "errors.questionMissingSlot",
  "questionLabel, answer 가 필요해요.": "errors.questionLabelAnswerRequired",

  "잘못된 피드 ID 에요.": "errors.invalidFeedId",
  "잘못된 ID 에요.": "errors.invalidId",
  "피드를 찾을 수 없어요.": "errors.feedNotFound",
  "댓글을 찾을 수 없어요.": "errors.commentNotFound",
  "댓글을 찾을 수 없거나 본인의 댓글이 아니에요.": "errors.commentNotFoundOrNotOwn",
  "부모 댓글이 다른 피드에 속해 있어요.": "errors.parentCommentDifferentFeed",

  "잘못된 유저 ID 에요.": "errors.invalidUserId",
  "본인은 차단할 수 없어요.": "errors.cannotBlockSelf",
  "본인은 신고할 수 없어요.": "errors.cannotReportSelf",

  "이미 등록된 이름입니다.": "errors.nameAlreadyRegistered",
  "vector: 512차원 수치 배열이어야 합니다": "errors.vectorInvalidShape",
  "vectors: 1~5개의 512차원 수치 배열이어야 합니다": "errors.vectorsInvalidShape",
  "person이 존재하지 않습니다.": "errors.personNotFound",
  "얼굴정보 저장 동의(consent granted)가 필요합니다": "errors.faceConsentRequired",
  "enrolledVia는 'card' 또는 'auto_biometric'이어야 합니다.":
    "errors.enrolledViaInvalid",

  "displayName은 문자열이어야 합니다.": "errors.displayNameNotString",
  "displayName은 1~30자여야 합니다.": "errors.displayNameLength",
  "displayName에 제어문자를 사용할 수 없습니다.": "errors.displayNameControlChars",

  "Clone not found.": "errors.cloneNotFound",
  "User not found.": "errors.userNotFound",
  "Feed not found.": "errors.feedNotFound",
  "Message not found.": "errors.messageNotFound",
  "Notification not found.": "errors.notificationNotFound",
  "No access to this clone.": "errors.noAccessToClone",
  "No access to this clone for call.": "errors.noAccessToCloneCall",
  "No access to this clone for session.": "errors.noAccessToCloneSession",
  "Owner role required.": "errors.ownerRoleRequired",
  "Editor role required.": "errors.editorRoleRequired",
  "Invite not found.": "errors.inviteNotFound",
  "Invite already used.": "errors.inviteAlreadyUsed",
  "Invite cancelled by owner.": "errors.inviteCancelled",
  "Invite expired.": "errors.inviteExpired",
  "Invite email does not match.": "errors.inviteEmailMismatch",
  "Access denied for this clone.": "errors.accessDenied",
  "2-of-N owner rule violated.": "errors.ownerRuleViolated",
  "Transfer not found.": "errors.transferNotFound",
  "Transfer already resolved.": "errors.transferAlreadyResolved",
  "Not the transfer recipient.": "errors.notTransferRecipient",
  "Only the primary editor may initiate a transfer.": "errors.primaryEditorOnly",
  "Cannot transfer to self.": "errors.cannotTransferSelf",
  "Recipient must be an accepted coowner.": "errors.recipientMustBeCoowner",
  "Not your conversation.": "errors.notYourConversation",
  "You do not own this resource.": "errors.notYourResource",
  "You do not own this clone.": "errors.notYourClone",
  "Resource is already deleted.": "errors.resourceAlreadyDeleted",
  "Clone is already deleted.": "errors.cloneAlreadyDeleted",
  "Resource not found.": "errors.resourceNotFound",
  "Not found.": "errors.notFound",
  "Cannot follow yourself.": "errors.cannotFollowSelf",
  "Can only view your own follow list.": "errors.followListOwnOnly",
  "Failed to persist user message.": "errors.saveUserMessageFailed",
  "Failed to persist clone reply.": "errors.saveCloneReplyFailed",
  "Failed to create user.": "errors.createUserFailed",
  "Device not found.": "errors.deviceNotFound",
  "device id invalid.": "errors.deviceIdInvalid",
  "Contact not found.": "errors.contactNotFound",
  "Invalid invite token.": "errors.inviteTokenInvalid",
  "Invalid clone id.": "errors.invalidCloneId",
  "Invalid message id.": "errors.invalidMessageId",
  "Invalid file id.": "errors.invalidFileId",
  "Invalid notification id.": "errors.invalidNotificationId",
  "Invalid person id.": "errors.invalidPersonId",
  "Invalid user id.": "errors.invalidUserId2",
  "Invalid id.": "errors.invalidId2",
  "File not found.": "errors.fileNotFound",
  "Object missing in storage.": "errors.objectMissing",
  "Missing 'file' field.": "errors.missingFileField",
  "multipart/form-data required.": "errors.multipartRequired",
  "Source file not found.": "errors.sourceFileNotFound",
  "pin must be 6 digits": "errors.pinMustBe6Digits",
  "Auth required.": "errors.authRequired",
  "Auth required for clone resource.": "errors.authRequired",
  "resourceId invalid.": "errors.resourceIdInvalid",
  "cloneId path param invalid.": "errors.invalidCloneId",
};

const REGEX_RULES: RegexRule[] = [
  {
    pattern: /^Wait (\d+)s before requesting another code\.$/,
    key: "errors.otpCooldown",
    extract: (m) => ({ seconds: Number(m[1]) }),
  },
  {
    pattern: /^Wrong code\. (\d+) attempts? left\.$/,
    key: "errors.otpWrongCodeAttempts",
    extract: (m) => ({ n: Number(m[1]) }),
  },
  {
    pattern: /^Rate limit exceeded \((\d+)\/min\)\.$/,
    key: "errors.rateLimited",
    extract: (m) => ({ limit: Number(m[1]) }),
  },
  {
    pattern: /^얼굴 벡터 인덱스 저장 실패:/,
    key: "errors.faceVectorSaveFailed",
  },
  {
    pattern: /^No access to (clone|user|message|feed) #\d+\.$/,
    key: "errors.noAccessToResource",
  },
  {
    pattern: /^Contact already (pending|accepted|declined|revoked)\.$/,
    key: "errors.contactAlreadyStatus",
    extract: (m) => ({ status: m[1] }),
  },
];

export function translateApiError(code: string, message: string): string {
  if (!message) return message;
  const trimmed = message.trim();

  const comboKey = COMBO_MATCHES[`${code}::${trimmed}`];
  if (comboKey) {
    const translated = i18n.t(comboKey, { defaultValue: "" });
    if (translated && translated !== comboKey) return translated;
  }

  const exactKey = EXACT_MATCHES[trimmed];
  if (exactKey) {
    const translated = i18n.t(exactKey, { defaultValue: "" });
    if (translated && translated !== exactKey) return translated;
  }

  for (const rule of REGEX_RULES) {
    const m = trimmed.match(rule.pattern);
    if (m) {
      const params = rule.extract ? rule.extract(m) : undefined;
      const translated = i18n.t(rule.key, { defaultValue: "", ...(params ?? {}) });
      if (translated && translated !== rule.key) return translated;
    }
  }

  return message;
}
