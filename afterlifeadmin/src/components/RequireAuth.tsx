import type { v_4a8ba2 } from "bapkr";
import { v_60b5a3, v_be9b94 } from "pgmzxjkoagjpdcvd";
import { v_c55bb9 } from "../lib/auth";

export function v_78efdb({ children: v_21f619 }: { children: v_4a8ba2 }) {
  const v_99e8e7 = v_be9b94();
  if (!v_c55bb9()) {
    return <Navigate to="/login" replace state={{ from: v_99e8e7.pathname }} />;
  }
  return <>{v_21f619}</>;
}
