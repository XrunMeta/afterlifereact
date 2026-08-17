

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
    "[PROVISIONAL] 이 섹션은 공동소유자 표시 이름(displayName)을 감싼다(CloneDetailScreen.tsx:190-201). 하지만 그 값을 렌더하는 <Text> 에 지금 testid 가 없다 — '자식이 값을 가진다'고 미룰 손잡이가 없는 상태다. 자식에 testid 를 붙이기 전까지는 아무것도 인덱싱할 수 없다(자식 라벨링은 이 태스크 범위 밖)",

  [TID.myClonesDashboard.followerCount]:
    "[PROVISIONAL] 실제로는 컬럼 값이다 — clone.followersCount 는 clone_stats.followers_count(트리거로 유지되는 진짜 컬럼, migrations/0003_clone_follows.sql)를 그대로 반영한다(MyClonesDashboardScreen.tsx:585-588). users.credits 처럼 format 만 걸면 인덱싱 가능한 형태다. 막는 건 값의 성격이 아니라 이 RN 화면이 아직 SCREENS 에 등록돼 있지 않다는 범위 문제다 — 그 등록이 생기기 전까지 보류",

  [TID.agreements.faceConsentSection]:
    "섹션 컨테이너 — 고정 제목/안내문을 감쌀 뿐, 값은 자식(진입행)이 가진다",
  [TID.agreements.rememberingClonesEntry]:
    "네비게이션 진입행 — 고정 라벨 텍스트, 표시값 없음(RememberingClones 화면으로 이동)",
  [TID.agreements.callLearningConsentSection]:
    "섹션 컨테이너 — 고정 제목/안내문을 감쌀 뿐, 값은 자식 스위치가 가진다",
  [TID.agreements.callLearningConsentToggle]:
    "[PROVISIONAL] 실제로는 컬럼 값이다 — getCallLearningConsent 로 조회한 저장된 동의 상태(users.call_learning_consent)를 그대로 반영하는 스위치다(AgreementsScreen.tsx). 인덱싱을 막는 건 화면 범위가 아니라 assertion 종류다 — Switch 는 텍스트/입력값이 아니라 on/off(checked) 상태를 검증해야 하는데, 러너는 아직 boolean/checked assertion 을 모른다(현재는 표시 요소=텍스트, 텍스트 입력=값 두 종류만 안다). 그 assertion 종류가 생기기 전까지 의도적으로 보류",
  [TID.agreements.faceBiometricConsentSection]:
    "섹션 컨테이너 — 고정 제목/안내문을 감쌀 뿐, 값은 자식 스위치가 가진다",
  [TID.agreements.faceBiometricConsentToggle]:
    "[PROVISIONAL] 실제로는 컬럼 값이다 — getFaceBiometricConsent 로 조회한 저장된 동의 상태(users.face_biometric_consent)를 그대로 반영하는 스위치다(AgreementsScreen.tsx). 인덱싱을 막는 건 화면 범위가 아니라 assertion 종류다 — Switch 는 텍스트/입력값이 아니라 on/off(checked) 상태를 검증해야 하는데, 러너는 아직 boolean/checked assertion 을 모른다(현재는 표시 요소=텍스트, 텍스트 입력=값 두 종류만 안다). 그 assertion 종류가 생기기 전까지 의도적으로 보류",

  [TID.rememberingClones.delete]:
    "동작 버튼(리스트 행의 삭제) — 표시값 없음. rowId(TID.rememberingClones.delete, clone.cloneId) 로 쓰는 행 접두어이지 단일 고정 문자열이 아니다",

  [TID.admin.login.email]: "로그인 입력 — DB 컬럼 값의 표시가 아니라 인증 경로",
  [TID.admin.login.password]: "로그인 입력 — 인증 경로, 화면에 값이 표시되지도 않는다",
  [TID.admin.login.submit]: "동작 버튼 — 표시값 없음",
  [TID.admin.login.totpCode]: "TOTP 코드 입력 — 인증 경로",
  [TID.admin.login.totpSubmit]: "동작 버튼 — 표시값 없음",
};
