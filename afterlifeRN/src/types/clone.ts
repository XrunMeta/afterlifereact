export interface Clone {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  coverImageUrl: string;
  type: "멤로우" | "친구" | "멘토" | "셀럽";
  category: string;
  interests: string[];
  description: string;
  visibility: "public" | "private" | "followers";
  learningProgress: number;
  createdBy: string;
  createdAt: string;
}

export interface CloneCreationDraft {
  type?: string;
  category?: string;
  interests?: string[];
  name?: string;
  description?: string;
  imageUri?: string;
  voiceUri?: string;
  visibility?: "public" | "private" | "followers";
}
