

export function faceBiometricSignupState(agreeFaceBiometric: boolean): 'granted' | 'revoked' {
  return agreeFaceBiometric ? 'granted' : 'revoked';
}
