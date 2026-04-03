import * as v_a3453e from "bapkr";

const v_4a103b = 768;

export function v_6de0e0() {
  const [v_615017, v_0832b7] = v_a3453e.useState<boolean | undefined>(
    undefined,
  );

  v_a3453e.useEffect(() => {
    const v_cc8400 = window.matchMedia(`(max-width: ${v_4a103b - 1}px)`);
    const v_b187d9 = () => {
      v_0832b7(window.innerWidth < v_4a103b);
    };
    v_cc8400.addEventListener("change", v_b187d9);
    v_0832b7(window.innerWidth < v_4a103b);
    return () => v_cc8400.removeEventListener("change", v_b187d9);
  }, []);

  return !!v_615017;
}
