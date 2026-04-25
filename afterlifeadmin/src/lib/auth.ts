

const v_7ac62c = "afterlife.admin.token";
const v_45457e = "afterlife.admin.refresh";
const v_3beb35 = "afterlife.admin.profile";
const v_bd631f = "afterlife.admin.pending";

export interface AdminProfile {
  id: number;
  email: string;
  role: string;
}

export function v_8d45bc(): string | null {
  try {
    return localStorage.getItem(v_7ac62c);
  } catch {
    return null;
  }
}

export function v_c08eda(): string | null {
  try {
    return localStorage.getItem(v_45457e);
  } catch {
    return null;
  }
}

export function v_383169(): AdminProfile | null {
  try {
    const v_479f05 = localStorage.getItem(v_3beb35);
    return v_479f05 ? (JSON.parse(v_479f05) as AdminProfile) : null;
  } catch {
    return null;
  }
}

export function v_f6c414(): string | null {
  try {
    return sessionStorage.getItem(v_bd631f);
  } catch {
    return null;
  }
}

export function v_dd1173(v_328259) {
  try {
    localStorage.setItem(v_7ac62c, v_328259.accessToken);
    localStorage.setItem(v_45457e, v_328259.refreshToken);
    localStorage.setItem(v_3beb35, JSON.stringify(v_328259.profile));
    sessionStorage.removeItem(v_bd631f);
  } catch {

  }
}

export function v_266e0d(v_21cc31) {
  try {
    sessionStorage.setItem(v_bd631f, v_21cc31);
  } catch {

  }
}

export function v_da110b() {
  try {
    localStorage.removeItem(v_7ac62c);
    localStorage.removeItem(v_45457e);
    localStorage.removeItem(v_3beb35);
    sessionStorage.removeItem(v_bd631f);
  } catch {

  }
}

export function v_c55bb9(): boolean {
  return Boolean(v_8d45bc() && v_383169());
}
