

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

export interface RowSelector {

  containerTestid: string;

  idFrom: "userId" | "cloneId";
}

export interface ColumnSurface {
  surface: SurfaceId;

  screen: string;

  testid: string;
  mode: "read" | "write";
  row?: RowSelector;
}

export interface ColumnEntry {

  column: string;
  label: string;

  where: (ctx: FixtureCtx) => string;

  format?: (v: unknown) => string;
  surfaces: ColumnSurface[];
}
