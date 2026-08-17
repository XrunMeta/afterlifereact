

export type TestId = string;

export const v_5401ae = {
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
} as const;

export function v_a8269d(v_694b25, v_389afb): string {
  return `${v_694b25}-${v_389afb}`;
}
