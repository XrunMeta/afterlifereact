import rawCatalog from "./apiCatalog.json";

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

export const API_CATALOG: ApiEndpoint[] = rawCatalog as ApiEndpoint[];

export const API_CATEGORIES: string[] = Array.from(
  new Set(API_CATALOG.map((e) => e.category)),
).sort();

export function findEndpointById(id: string): ApiEndpoint | undefined {
  return API_CATALOG.find((e) => e.id === id);
}
