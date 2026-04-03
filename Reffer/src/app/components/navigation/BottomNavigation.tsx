import { NavLink } from "react-router";
import {
  Home,
  Users,
  PlusCircle,
  Play,
  User,
} from "lucide-react";
import profileImage from "figma:asset/8ef462d0b1826696ebf238bf7e33ad6c3df3baa0.png";

const navItems = [
  { icon: Home, label: "홈", path: "/" },
  { icon: Users, label: "페르소나", path: "/oth-path" },
  {
    icon: PlusCircle,
    label: "생성",
    path: "/clone/create/step1",
    isCenter: true,
  },
  { icon: User, label: "팔로잉", path: "/shorts" },
  { icon: User, label: "마이", path: "/my" },
];

export function BottomNavigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 z-50">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isMyPage = item.path === "/my";

          return (
            <NavLink
              key={index}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-2 px-3 transition-colors ${
                  isActive ? "text-zinc-900" : "text-zinc-400"
                }`
              }
            >
              {isMyPage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <Icon className="w-6 h-6" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}