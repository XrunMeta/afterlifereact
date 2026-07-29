

import { GoogleSignin } from '@react-native-google-signin/google-signin';

export const GOOGLE_WEB_CLIENT_ID =
  'oth-client.googleusercontent.invalid';

let attempted = false;
let configured = false;

export function ensureGoogleConfigured(): boolean {
  if (attempted) return configured;
  attempted = true;
  try {

    const r = GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: false,
    }) as unknown;
    if (r && typeof (r as Promise<void>).catch === 'function') {
      void (r as Promise<void>).catch(() => {});
    }
    configured = true;
  } catch {
    configured = false;
  }
  return configured;
}

export function __resetGoogleConfiguredForTest(): void {
  attempted = false;
  configured = false;
}
