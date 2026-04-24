import v_12f0e8 from "./apiCatalog.json";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type AuthLevel = "public" | "required" | "optional" | "admin" | "dev-only";

export interface UiLink {
  app: "rn" | "web";
  route: string;
  label: string;
}

export interface ApiEndpoint {
  id: string;
  method: HttpMethod;
  path: string;
  file: string;
  line: number;
  auth: AuthLevel;
  pathParams: string[];
  queryKeys: string[];
  hasBody: boolean;
  bodyHint: string | null;
  category: string;
  uiLinks: UiLink[];
}

export const v_b4a7e7 = v_12f0e8 as ApiEndpoint[];

export const v_f157f0 = Array.from(
  new Set(v_b4a7e7.map((v_9e86fd) => v_9e86fd.category)),
).sort();

export function v_b672ee(v_389afb): ApiEndpoint | undefined {
  return v_b4a7e7.find((v_9e86fd) => v_9e86fd.id === v_389afb);
}
