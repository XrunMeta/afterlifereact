

const ACCESS_KEY = "afterlife.admin.token";
const REFRESH_KEY = "afterlife.admin.refresh";
const PROFILE_KEY = "afterlife.admin.profile";
const PENDING_KEY = "afterlife.admin.pending";

export interface AdminProfile {
  id: number;
  email: string;
  role: string;
}

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_KEY);
  } catch {
    return null;
  }
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function getProfile(): AdminProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as AdminProfile) : null;
  } catch {
    return null;
  }
}

export function getPendingToken(): string | null {
  try {
    return sessionStorage.getItem(PENDING_KEY);
  } catch {
    return null;
  }
}

export function setSession(opts: {
  accessToken: string;
  refreshToken: string;
  profile: AdminProfile;
}) {
  try {
    localStorage.setItem(ACCESS_KEY, opts.accessToken);
    localStorage.setItem(REFRESH_KEY, opts.refreshToken);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(opts.profile));
    sessionStorage.removeItem(PENDING_KEY);
  } catch {

  }
}

export function setTokens(opts: { accessToken: string; refreshToken: string }) {
  try {
    localStorage.setItem(ACCESS_KEY, opts.accessToken);
    localStorage.setItem(REFRESH_KEY, opts.refreshToken);
  } catch {

  }
}

export function setPending(token: string) {
  try {
    sessionStorage.setItem(PENDING_KEY, token);
  } catch {

  }
}

export function clearSession() {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(PROFILE_KEY);
    sessionStorage.removeItem(PENDING_KEY);
  } catch {

  }
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken() && getProfile());
}
