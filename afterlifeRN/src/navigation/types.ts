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
  Signup: undefined;
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
