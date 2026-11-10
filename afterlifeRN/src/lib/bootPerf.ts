

const v_e0a1fd =
  typeof (globalThis as unknown as { performance?: { now: () => number } }).performance?.now === "function"
    ? (globalThis as unknown as { performance: { now: () => number } }).performance.now()
    : Date.now();

interface Mark {
  name: string;
  t: number; 
  extra?: Record<string, unknown>;
}

const v_d19c6f = [];
let v_07b1f6 = false;

function v_5c2f9f(): number {
  const v_206b88 = globalThis as unknown as { performance?: { now: () => number } };
  const v_8d41d7 = v_206b88.performance?.now ? v_206b88.performance.now() : Date.now();
  return v_8d41d7 - v_e0a1fd;
}

export function v_8f5130(v_1833e7, v_f91f33): void {
  const v_8d41d7 = v_5c2f9f();
  v_d19c6f.push({ name: v_1833e7, t: v_8d41d7, extra: v_f91f33 });
  if (__DEV__) {

    console.log(`[boot] +${v_8d41d7.toFixed(0)}ms  ${v_1833e7}`, v_f91f33 ?? "");
  }
}

export function v_b247cd(v_4412ae = "manual"): void {
  if (v_07b1f6) return;
  v_07b1f6 = true;
  const v_c83285 = v_5c2f9f();
  if (!__DEV__) return;
  const v_18b8bf = v_d19c6f.map((v_35f85c, v_ebec57) => {
    const v_ba2215 = v_ebec57 === 0 ? 0 : v_d19c6f[v_ebec57 - 1].t;
    const v_e9396c = v_35f85c.t - v_ba2215;
    return {
      name: v_35f85c.name,
      t_ms: Math.round(v_35f85c.t),
      delta_ms: Math.round(v_e9396c),
      ...(v_35f85c.extra ?? {}),
    };
  });

  console.log(`\n========== [boot] startup timeline (trigger=${v_4412ae}, total=${v_c83285.toFixed(0)}ms) ==========`);

  console.table(v_18b8bf);

  console.log(`========== [boot] end ==========\n`);
}

export function v_5b384a(): ReadonlyArray<Mark> {
  return v_d19c6f;
}
