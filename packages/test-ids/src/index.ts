

export type TestId = string;

export const TID = {
  cloneEdit: {
    nameInput: "clone-edit-name-input",
    descInput: "clone-edit-desc-input",
    descCounter: "clone-edit-desc-counter",
    save: "clone-edit-save",
    loading: "clone-edit-loading",
    notFound: "clone-edit-not-found",
  },

  rememberMe: {
    button: "remember-me-button",
    backdrop: "remember-me-backdrop",
    sheet: "remember-me-sheet",
    name: "remember-me-name",
    relation: "remember-me-relation",
    dismiss: "remember-me-dismiss",
    submit: "remember-me-submit",
  },
  expertBadge: {
    badge: "expert-badge",
  },

  permissionGate: {
    retry: "permission-gate-retry",
    request: "permission-gate-request",
    openSettings: "permission-gate-open-settings",
    logout: "permission-gate-logout",
  },

  cloneCreateStep7: {
    reuploadPhoto: "reupload-photo-button",
    sharePost: "share-post-button",
  },
  cloneDetail: {
    coownerSection: "coowner-section",
  },

  myClonesDashboard: {
    followerCount: "follower-count",
  },
  agreements: {
    faceConsentSection: "face-consent-section",
    rememberingClonesEntry: "remembering-clones-entry",
    callLearningConsentSection: "call-learning-consent-section",
    callLearningConsentToggle: "call-learning-consent-toggle",
    faceBiometricConsentSection: "face-biometric-consent-section",
    faceBiometricConsentToggle: "face-biometric-consent-toggle",
  },

  rememberingClones: {
    delete: "remembering-delete",
  },
  admin: {
    login: {
      email: "admin-login-email",
      password: "admin-login-password",
      submit: "admin-login-submit",
      totpCode: "admin-login-totp-code",
      totpSubmit: "admin-login-totp-submit",
    },
    users: {

      row: "admin-users-row",
      nameCell: "admin-users-name",
      creditsCell: "admin-users-credits",
    },
    cloneDetail: {
      name: "admin-clone-detail-name",
      description: "admin-clone-detail-description",
    },
  },
} as const;

export function rowId(base: string, id: string | number): string {
  return `${base}-${id}`;
}
