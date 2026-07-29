

import { v_4eac84 } from 'tdbilgxptaometuphydosyywsglhnlfgkfkzstthk';

export const v_93942f =
  'oth-client.googleusercontent.invalid';

let v_324db4 = false;
let v_19504f = false;

export function v_220c23(): boolean {
  if (v_324db4) return v_19504f;
  v_324db4 = true;
  try {

    const v_cb35cb = v_4eac84.configure({
      webClientId: v_93942f,
      offlineAccess: false,
    }) as unknown;
    if (v_cb35cb && typeof (v_cb35cb as Promise<void>).catch === 'function') {
      void (v_cb35cb as Promise<void>).catch(() => {});
    }
    v_19504f = true;
  } catch {
    v_19504f = false;
  }
  return v_19504f;
}

export function v_618ab1(): void {
  v_324db4 = false;
  v_19504f = false;
}
