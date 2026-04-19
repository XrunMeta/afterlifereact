import type { ApiUser } from "../../types/api";
import type { User } from "../../types/user";

export function apiUserToUser(api: ApiUser): User {
  return {
    id: String(api.id),
    name: api.name ?? "",
    email: api.email,
    phone: api.phone ?? "",
    gender: (api.gender ?? "other") as User["gender"],
    age: api.age ?? 0,
    interests: api.interests ?? [],
    avatarUrl: api.avatarUrl ?? "",
    credits: api.credits,
  };
}
