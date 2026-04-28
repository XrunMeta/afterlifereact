export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Chat: { cloneId: number };
  Call: { cloneId: number; name?: string; image?: string | number };
  EmergencyContacts: undefined;
  InheritanceAccept: { token?: string };
  RestoreDeleted: undefined;
  GDPRDelete: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: { google?: { idToken: string; email: string; name?: string | null } } | undefined;
  EmailVerify: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    gender?: "male" | "female" | "other";
    age?: number;
    interests?: string[];
    marketingConsent: boolean;

    pushToken?: string;
    platform?: "ios" | "android" | "web";
    deviceId?: string;
  };
  XrunLogin: undefined;
  XrunOtp: { email: string; pin: string };
  XrunOnboarding:
    | { email: string; pin: string; verificationCode: string; google?: undefined }
    | { email: string; pin?: undefined; verificationCode?: undefined; google: { idToken: string } };
};

export type MainTabParamList = {
  HomeTab: undefined;
  ClonesTab: undefined;
  CreateTab: undefined;
  ShortsTab: undefined;
  MyTab: undefined;
};

export type ClonesStackParamList = {
  Dashboard: undefined;
  CloneDetail: { cloneId: number };
  CloneEdit: { cloneId: number };
  CloneVisibility: { cloneId: number };
  CloneInvite: { cloneId: number };
};

export type ShareStackParamList = {
  ShareRequests: undefined;
};

export type CreateStackParamList = {
  Step1: undefined;
  Step2: undefined;
  Step3: undefined;
  Step4: undefined;
  Step5: undefined;
  Step6: undefined;
  Step7: undefined;
  Step8: { cloneId: number };
};
