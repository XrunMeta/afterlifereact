

import { TID } from "@afterlife/test-ids";

export const EXEMPTIONS: Record<string, string> = {

  [TID.cloneEdit.descCounter]:
    "글자수 카운터 — description 입력값의 길이를 보여주는 파생 표시이지 컬럼 자체가 아니다",
  [TID.cloneEdit.save]: "동작 버튼 — 표시값 없음",
  [TID.cloneEdit.loading]: "로딩 상태 — DB 값이 아니다",
  [TID.cloneEdit.notFound]: "빈 상태 — DB 값이 아니다",

  [TID.rememberMe.button]: "동작 버튼 — 시트를 여는 트리거, 표시값 없음",
  [TID.rememberMe.backdrop]: "배경 오버레이 — 표시값 없음",
  [TID.rememberMe.sheet]: "시트 컨테이너 — 값은 자식 입력이 가진다",
  [TID.rememberMe.name]:
    "새 L2' 레코드를 만들기 위한 이름 입력 — 기존 컬럼 값의 표시/편집이 아니라 빈 값에서 시작하는 신규 입력(소스 확인: RememberMeSheet.tsx)",
  [TID.rememberMe.relation]:
    "새 L2' 레코드를 만들기 위한 관계 입력 — 위와 동일하게 신규 입력",
  [TID.rememberMe.dismiss]: "동작 버튼 — 표시값 없음",
  [TID.rememberMe.submit]: "동작 버튼 — 표시값 없음",

  [TID.expertBadge.badge]:
    "고정 라벨 배지 — 항상 '전문가' 고정 텍스트만 렌더(부모가 렌더 여부만 clone_type 으로 결정, 배지 자체는 컬럼 값을 표시하지 않음)",

  [TID.permissionGate.retry]: "동작 버튼 — 표시값 없음",
  [TID.permissionGate.request]: "동작 버튼 — 표시값 없음",
  [TID.permissionGate.openSettings]: "동작 버튼 — 표시값 없음(OS 설정 앱으로 이동)",
  [TID.permissionGate.logout]: "동작 버튼 — 표시값 없음",

  [TID.cloneCreateStep7.reuploadPhoto]: "동작 버튼 — 표시값 없음",
  [TID.cloneCreateStep7.sharePost]: "동작 버튼 — 표시값 없음",

  [TID.cloneDetail.coownerSection]:
    "섹션 컨테이너 — 공동소유자 값은 안의 자식 요소가 가지고, 컨테이너 자체는 값이 아니다",

  [TID.myClonesDashboard.followerCount]:
    "[PROVISIONAL] 실제로는 컬럼 값이다 — 클론별 구독자 수(clones 구독자 카운트)를 표시한다(RN MyClonesDashboardScreen.tsx). Task 6 은 어드민 4개 화면만 다루므로 정식 컬럼 인덱싱은 후속 태스크로 남기고 사유를 그대로 적어 면제한다",

  [TID.agreements.faceConsentSection]:
    "섹션 컨테이너 — 고정 제목/안내문을 감쌀 뿐, 값은 자식(진입행)이 가진다",
  [TID.agreements.rememberingClonesEntry]:
    "네비게이션 진입행 — 고정 라벨 텍스트, 표시값 없음(RememberingClones 화면으로 이동)",
  [TID.agreements.callLearningConsentSection]:
    "섹션 컨테이너 — 고정 제목/안내문을 감쌀 뿐, 값은 자식 스위치가 가진다",
  [TID.agreements.callLearningConsentToggle]:
    "[PROVISIONAL] 실제로는 컬럼 값이다 — getCallLearningConsent 로 조회한 저장된 동의 상태를 그대로 반영하는 스위치다(AgreementsScreen.tsx). Task 6 은 어드민 4개 화면만 다루므로 정식 컬럼 인덱싱은 후속 태스크로 남기고 사유를 그대로 적어 면제한다",
  [TID.agreements.faceBiometricConsentSection]:
    "섹션 컨테이너 — 고정 제목/안내문을 감쌀 뿐, 값은 자식 스위치가 가진다",
  [TID.agreements.faceBiometricConsentToggle]:
    "[PROVISIONAL] 실제로는 컬럼 값이다 — getFaceBiometricConsent 로 조회한 저장된 동의 상태를 그대로 반영하는 스위치다(AgreementsScreen.tsx). Task 6 은 어드민 4개 화면만 다루므로 정식 컬럼 인덱싱은 후속 태스크로 남기고 사유를 그대로 적어 면제한다",

  [TID.rememberingClones.delete]: "동작 버튼(리스트 행의 삭제) — 표시값 없음",

  [TID.admin.login.email]: "로그인 입력 — DB 컬럼 값의 표시가 아니라 인증 경로",
  [TID.admin.login.password]: "로그인 입력 — 인증 경로, 화면에 값이 표시되지도 않는다",
  [TID.admin.login.submit]: "동작 버튼 — 표시값 없음",
  [TID.admin.login.totpCode]: "TOTP 코드 입력 — 인증 경로",
  [TID.admin.login.totpSubmit]: "동작 버튼 — 표시값 없음",
};
