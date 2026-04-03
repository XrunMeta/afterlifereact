import { Outlet, useLocation } from "react-router";
import { BottomNavigation } from "../components/navigation/BottomNavigation";

export function MainLayout() {
  const location = useLocation();

  const hideBottomNav = 
    location.pathname.startsWith("/clone/create") ||
    location.pathname.includes("/call") ||
    location.pathname === "/clone/" + location.pathname.split("/")[2];

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <main className={hideBottomNav ? "pb-0" : "pb-16"}>
        <Outlet />
      </main>
      {!hideBottomNav && <BottomNavigation />}
    </div>
  );
}