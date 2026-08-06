import type { NavigatorScreenParams } from "@react-navigation/native";

export type RootStackParamList = {
  Auth: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  Chat: { cloneId: number };
  Call: { cloneId: number; name?: string; image?: string | number };
  EmergencyContacts: undefined;
  InheritanceAccept: { token?: string };
  RestoreDeleted: undefined;
  GDPRDelete: undefined;

  InviteAccept: { token: string };

  Notifications: undefined;

  UserProfile: { userId: number };

  UserFollowList: { userId: number; mode: "followers" | "following"; userName?: string };

  CloneFeed: {
    feed?: import("../api/clones").DiscoverFeedItem;
    cloneId?: number;

    openComments?: boolean;
  };

  ResetPassword: { email?: string } | undefined;
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

    country?: string;
    mobileCode?: number;
    region?: string;
    marketingConsent: boolean;

    agreeCallLearning?: boolean;

    agreeFaceBiometric?: boolean;

    pushToken?: string;
    platform?: "ios" | "android" | "web";
    deviceId?: string;
  };

  EmailOtpLogin: { email: string; autoLogin: boolean };
  ForgotPassword: undefined;

};

export type MainTabParamList = {
  HomeTab: undefined;

  SearchTab: { initialQuery?: string } | undefined;
  ClonesTab: NavigatorScreenParams<ClonesStackParamList> | undefined;
  CreateTab: undefined;

  ShortsTab: { openIntimacyCloneId?: number } | undefined;
  MyTab: NavigatorScreenParams<MyStackParamList> | undefined;
};

export type ClonesStackParamList = {

  Dashboard:
    | {
        openIntimacyCloneId?: number;
        openStatsCloneId?: number;
        openStatsTab?: "likes" | "comments" | "gifts" | "followers";
      }
    | undefined;
  CloneDetail: { cloneId: number };
  CloneEdit: { cloneId: number };
  CloneVisibility: { cloneId: number };
  CloneInvite: { cloneId: number };
  CloneLearn: { cloneId: number };
  InviteStatus: undefined;
};

export type ShareStackParamList = {
  ShareRequests: undefined;
};

export type CreateStackParamList = {

  Step3: undefined;
  Step4: undefined;
  PersonaAssistant: undefined;
  Step5: undefined;
  Step7: undefined;
  Step8: { cloneId: number };
};

export type MyStackParamList = {
  MyHome: undefined;
  EditProfile: undefined;
  NotificationSettings: undefined;
  PrivacySettings: undefined;
  Agreements: undefined;
  SavedItems: undefined;
  RememberingClones: undefined;
  LanguageSettings: undefined;
  PaymentPin: undefined;
  InviteStatus: undefined;
  BlockedList: undefined;
  Transactions: undefined;
  Purchase: undefined; 
  Reports: { tab?: "made" | "received" } | undefined;
};
