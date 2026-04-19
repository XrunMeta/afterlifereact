import type { v_b35f02 } from "../../types/api";
import type { v_1ddb60 } from "../../types/user";

export function v_98af1b(api: v_b35f02): v_1ddb60 {
  return {
    id: String(v_05a921.id),
    name: v_05a921.name ?? "",
    email: v_05a921.email,
    phone: v_05a921.phone ?? "",
    gender: (v_05a921.gender ?? "other") as v_1ddb60["gender"],
    age: v_05a921.age ?? 0,
    interests: v_05a921.interests ?? [],
    avatarUrl: v_05a921.avatarUrl ?? "",
    credits: v_05a921.credits,
  };
}
