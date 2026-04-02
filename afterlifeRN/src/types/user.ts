export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: "male" | "female" | "other";
  age: number;
  interests: string[];
  avatarUrl: string;
  credits: number;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  phone: string;
  gender: "male" | "female" | "other";
  age: number;
  interests: string[];
}
