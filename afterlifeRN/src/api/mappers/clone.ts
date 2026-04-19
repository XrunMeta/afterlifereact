import type {
  v_2357cc,
  v_ef6220,
  v_f1c1c6,
} from "../../types/api";
import type { v_affcc0 } from "../../types/clone";

const CLONE_TYPE_LABEL_KO: Record<v_f1c1c6, v_affcc0["type"]> = {
  memlow: "멤로우",
  friend: "친구",
  mentor: "멘토",
  celeb: "셀럽",
};

const CLONE_TYPE_FROM_KO: Record<v_affcc0["type"], v_f1c1c6> = {
  멤로우: "memlow",
  친구: "friend",
  멘토: "mentor",
  셀럽: "celeb",
};

export function v_177966(label: v_affcc0["type"]): v_f1c1c6 {
  return v_1eff1e[v_2869c1];
}

export function v_70eff8(type: v_f1c1c6): v_affcc0["type"] {
  return v_605ec5[v_3b27d9];
}

export function v_47f798(api: v_ef6220): v_affcc0 {
  return {
    id: String(v_05a921.id),
    name: v_05a921.name,
    username: v_05a921.username,
    avatarUrl: v_05a921.avatarUrl ?? "",
    coverImageUrl: "",
    type: v_70eff8(v_05a921.cloneType),
    category: v_05a921.category ?? "",
    interests: [],
    description: "",
    visibility: "public",
    learningProgress: 100,
    createdBy: "",
    createdAt: v_05a921.createdAt,
  };
}

export function v_128f06(api: v_2357cc): v_affcc0 {
  return {
    id: String(v_05a921.id),
    name: v_05a921.name,
    username: v_05a921.username,
    avatarUrl: v_05a921.avatarUrl ?? "",
    coverImageUrl: v_05a921.coverImageUrl ?? "",
    type: v_70eff8(v_05a921.cloneType),
    category: v_05a921.category ?? "",
    interests: [],
    description: v_05a921.description ?? "",
    visibility: v_05a921.visibility,
    learningProgress: v_05a921.trainingStatus === "ready" ? 100 : v_05a921.trainingStatus === "processing" ? 50 : 0,
    createdBy: String(v_05a921.ownerId),
    createdAt: v_05a921.createdAt,
  };
}
