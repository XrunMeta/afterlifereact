import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "../lib/auth";

export function RequireAuth({ children }: { children: ReactNode }) {
  const loc = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }
  return <>{children}</>;
}
