

export interface ScreenApiRef {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  note?: string;
}

export const SCREEN_API_MAP: Record<string, ScreenApiRef[]> = {

  Home: [
    { method: 'GET', path: '/oth-path', note: '팔로잉 clone 목록' },
    { method: 'GET', path: '/oth-path', note: '팔로잉별 피드 병합' },
  ],

  Following: [
    { method: 'GET', path: '/oth-path' },
    { method: 'GET', path: '/oth-path', note: '각 팔로잉 피드' },
  ],

  Dashboard: [
    { method: 'GET', path: '/oth-path', note: '내 소유 clones (placeholder)' },
  ],
  CloneDetail: [
    { method: 'GET', path: '/oth-path' },
    { method: 'GET', path: '/oth-path' },
  ],
  CloneEdit: [
    { method: 'GET', path: '/oth-path' },
    { method: 'PATCH', path: '/oth-path', note: '메타 수정' },
  ],
  CloneVisibility: [
    { method: 'PATCH', path: '/oth-path' },
  ],
  CloneInvite: [
    { method: 'POST', path: '/oth-path', note: '공동소유 초대' },
  ],

  Chat: [
    { method: 'GET', path: '/oth-path', note: '세션 히스토리' },
    { method: 'POST', path: '/oth-path', note: '유저 발화 전송 (stub)' },
  ],
  Call: [
    { method: 'POST', path: '/oth-path', note: 'livekit 토큰 발급' },
  ],

  ShareRequests: [
    { method: 'GET', path: '/oth-path' },
    { method: 'PATCH', path: '/oth-path', note: 'accept/decline' },
  ],
  EmergencyContacts: [
    { method: 'GET', path: '/oth-path' },
    { method: 'POST', path: '/oth-path' },
  ],
  InheritanceAccept: [
    { method: 'POST', path: '/oth-path', note: 'token 수락' },
  ],
  RestoreDeleted: [
    { method: 'GET', path: '/oth-path' },
    { method: 'POST', path: '/oth-path' },
  ],
  GDPRDelete: [
    { method: 'POST', path: '/oth-path' },
  ],

  Step1: [],
  PersonaAssistant: [
    { method: 'GET', path: '/oth-path', note: '동적 질문 스키마' },
    { method: 'POST', path: '/oth-path', note: 'gemma 후보 제안' },
    { method: 'GET', path: '/oth-path', note: 'username 중복 체크' },
  ],
  Step3: [],
  Step4: [],
  Step5: [],
  Step7: [
    { method: 'POST', path: '/oth-path', note: 'clone 생성 커밋' },
  ],

  Login: [
    { method: 'POST', path: '/oth-path' },
  ],
  Signup: [
    { method: 'POST', path: '/oth-path' },
  ],
};

export function getApisForRoute(routeName: string | undefined | null): ScreenApiRef[] {
  if (!routeName) return [];
  return SCREEN_API_MAP[routeName] ?? [];
}
