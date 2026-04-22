export type { DomainUser as v_1ddb60 } from "./domain";

export interface SignupData {
  name: string;
  email: string;
  password: string;
  phone: string;
  gender: "male" | "female" | "other";
  age: number;
  interests: string[];
}
