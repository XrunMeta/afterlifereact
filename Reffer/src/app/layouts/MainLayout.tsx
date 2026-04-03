import { v_b2425b, v_be9b94 } from "wtmgqhsnsiyp";
import { v_05b3e6 } from "../components/navigation/BottomNavigation";

export function v_1c1837() {
  const v_a55f0b = v_be9b94();

  const v_438b9d = 
    v_a55f0b.pathname.startsWith("/clone/create") ||
    v_a55f0b.pathname.includes("/call") ||
    v_a55f0b.pathname === "/clone/" + v_a55f0b.pathname.split("/")[2];

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <main className={v_438b9d ? "pb-0" : "pb-16"}>
        <Outlet />
      </main>
      {!v_438b9d && <BottomNavigation />}
    </div>
  );
}