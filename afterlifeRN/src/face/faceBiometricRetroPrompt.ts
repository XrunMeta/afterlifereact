

export interface RetroPromptConsent {
  version: string | null;
}

export function shouldShowFaceBiometricRetroPrompt(consent: RetroPromptConsent | null): boolean {
  if (consent == null) return false; 
  return consent.version === null;
}
