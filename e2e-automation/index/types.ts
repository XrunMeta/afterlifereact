

export type SurfaceId = "admin" | "rn-web" | "rn-native";

export interface Surface {
  id: SurfaceId;
  label: string;

  automated: boolean;
}

export interface FixtureCtx {
  userId: number;
  cloneId: number;
}

export interface ColumnSurface {
  surface: SurfaceId;

  screen: string;

  route: (ctx: FixtureCtx) => string;

  testid: string;
  mode: "read" | "write";

  row?: "byId";
}

export interface ColumnEntry {

  column: string;
  label: string;

  where: (ctx: FixtureCtx) => string;

  format?: (v: unknown) => string;
  surfaces: ColumnSurface[];
}
