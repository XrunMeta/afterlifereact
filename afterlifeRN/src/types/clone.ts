export type CloneType = 'memlow' | 'friend' | 'mentor' | 'celeb';

export type MemlowRelation =
  | 'mother' | 'father' | 'spouse' | 'child'
  | 'sibling' | 'friend' | 'pet' | 'other';

export type CloneStatus = 'active' | 'pending_assets';

export interface Clone {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  coverImageUrl: string;
  type: '멤로우' | '친구' | '멘토' | '셀럽';
  category: string;
  interests: string[];
  description: string;
  visibility: 'public' | 'private' | 'followers';
  learningProgress: number;
  createdBy: string;
  createdAt: string;
  status: CloneStatus;
}

export interface CloneCreationDraft {
  cloneType?: CloneType;
  name?: string;
  username?: string;
  description?: string;
  relation?: MemlowRelation;
  category?: string;
  interests?: string[];
  imageFile?: string;
  rightsAcknowledged?: boolean;
  voiceSampleId?: string;
  voiceFile?: string;
  voiceScriptId?: string;
  recordDuration?: number;
  visibility?: 'public' | 'private' | 'followers';
  coownerInvites?: string[];
}
