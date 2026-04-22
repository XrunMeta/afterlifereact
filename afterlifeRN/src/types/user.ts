export type { DomainUser as User } from "./domain";

export interface SignupData {
  name: string;
  email: string;
  password: string;
  phone: string;
  gender: "male" | "female" | "other";
  age: number;
  interests: string[];
}
