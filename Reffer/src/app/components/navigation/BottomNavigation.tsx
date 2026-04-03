import { v_151aef } from "wtmgqhsnsiyp";
import {
  v_ea0732,
  v_2e2f88,
  v_0a7643,
  v_faa130,
  v_1ddb60,
} from "nchqfqoebgwu";
import v_c3853e from "ednyahnmpzagkeqzxiwmwhcpaqetjtwdhlmbdqgscpnbyzdtgucacoax";

const v_0904b2 = [
  { icon: v_ea0732, label: "홈", path: "/" },
  { icon: v_2e2f88, label: "페르소나", path: "/oth-path" },
  {
    icon: v_0a7643,
    label: "생성",
    path: "/clone/create/step1",
    isCenter: true,
  },
  { icon: v_1ddb60, label: "팔로잉", path: "/shorts" },
  { icon: v_1ddb60, label: "마이", path: "/my" },
];

export function v_05b3e6() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 z-50">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
        {v_0904b2.map((v_8c0b26, v_a56041) => {
          const v_6bce96 = v_8c0b26.icon;
          const v_ec772e = v_8c0b26.path === "/my";

          return (
            <NavLink
              key={v_a56041}
              to={v_8c0b26.path}
              end={v_8c0b26.path === "/"}
              className={({ isActive: v_26dce6 }) =>
                `flex flex-col items-center justify-center gap-1 py-2 px-3 transition-colors ${
                  v_26dce6 ? "text-zinc-900" : "text-zinc-400"
                }`
              }
            >
              {v_ec772e ? (
                <img
                  src={v_c3853e}
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