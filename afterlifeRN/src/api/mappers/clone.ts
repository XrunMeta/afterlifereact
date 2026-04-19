import type {
  ApiCloneDetail,
  ApiCloneSummary,
  ApiCloneType,
} from "../../types/api";
import type { Clone } from "../../types/clone";

const CLONE_TYPE_LABEL_KO: Record<ApiCloneType, Clone["type"]> = {
  memlow: "멤로우",
  friend: "친구",
  mentor: "멘토",
  celeb: "셀럽",
};

const CLONE_TYPE_FROM_KO: Record<Clone["type"], ApiCloneType> = {
  멤로우: "memlow",
  친구: "friend",
  멘토: "mentor",
  셀럽: "celeb",
};

export function cloneTypeToApi(label: Clone["type"]): ApiCloneType {
  return CLONE_TYPE_FROM_KO[label];
}

export function cloneTypeToLabel(type: ApiCloneType): Clone["type"] {
  return CLONE_TYPE_LABEL_KO[type];
}

export function apiCloneSummaryToClone(api: ApiCloneSummary): Clone {
  return {
    id: String(api.id),
    name: api.name,
    username: api.username,
    avatarUrl: api.avatarUrl ?? "",
    coverImageUrl: "",
    type: cloneTypeToLabel(api.cloneType),
    category: api.category ?? "",
    interests: [],
    description: "",
    visibility: "public",
    learningProgress: 100,
    createdBy: "",
    createdAt: api.createdAt,
  };
}

export function apiCloneDetailToClone(api: ApiCloneDetail): Clone {
  return {
    id: String(api.id),
    name: api.name,
    username: api.username,
    avatarUrl: api.avatarUrl ?? "",
    coverImageUrl: api.coverImageUrl ?? "",
    type: cloneTypeToLabel(api.cloneType),
    category: api.category ?? "",
    interests: [],
    description: api.description ?? "",
    visibility: api.visibility,
    learningProgress: api.trainingStatus === "ready" ? 100 : api.trainingStatus === "processing" ? 50 : 0,
    createdBy: String(api.ownerId),
    createdAt: api.createdAt,
  };
}
