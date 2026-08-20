

import { v_de06a3, v_c4deb2, v_e662ae } from "bapkr";
import { v_4585d1 } from "../api/persons";

const v_cb6d5f = 0.15;

const v_0a8c9f = 30_000;

const v_a78ac8 = 3;

const v_9fe285 = 20;

const v_739e9a = 5;

interface PersonBuffer {

  enrolled: number[][];

  pending: number[][];

  flushInFlight: boolean;
}

function v_859e05(v_779914, v_148ff6): number {
  if (v_779914.length !== v_148ff6.length) return Infinity;
  let v_dce0a8 = 0;
  for (let v_ebec57 = 0; v_ebec57 < v_779914.length; v_ebec57++) {
    const v_d5dda0 = v_779914[v_ebec57]! - v_148ff6[v_ebec57]!;
    v_dce0a8 += v_d5dda0 * v_d5dda0;
  }
  return Math.sqrt(v_dce0a8);
}

function v_87c181(v_46ff7a, v_75fbef): number {
  if (v_75fbef.length === 0) return Infinity;
  let v_35f85c = Infinity;
  for (const v_e2a85c of v_75fbef) {
    const v_d5dda0 = v_859e05(v_46ff7a, v_e2a85c);
    if (v_d5dda0 < v_35f85c) v_35f85c = v_d5dda0;
  }
  return v_35f85c;
}

export interface UseAngleCollectorOptions {
  accessToken: string | null;
  cloneId: number;
  enabled: boolean;
}

export interface UseAngleCollectorResult {

  observe: (personId: number, vector: number[]) => void;

  reset: () => void;
}

export function v_512a0b(v_328259): UseAngleCollectorResult {
  const { accessToken: v_2ca7e0, cloneId: v_6e0fd3, enabled: v_d20c84 } = v_328259;
  const v_b004c2 = v_e662ae<Map<number, PersonBuffer>>(new Map());
  const v_ec9810 = v_e662ae<ReturnType<typeof setInterval> | null>(null);

  const v_57a630 = v_de06a3(
    async (v_ca1ec5, v_83ee53) => {
      if (!v_2ca7e0 || v_83ee53.pending.length === 0 || v_83ee53.flushInFlight) return;
      if (v_83ee53.enrolled.length >= v_9fe285) {

        v_83ee53.pending = [];
        return;
      }
      const v_72aa8e = v_9fe285 - v_83ee53.enrolled.length;
      const v_36e01f = v_83ee53.pending.slice(0, Math.min(5, v_72aa8e)); 
      v_83ee53.pending = v_83ee53.pending.slice(v_36e01f.length);
      v_83ee53.flushInFlight = true;
      try {
        console.log(`[AngleCollector] flushOne START person=${v_ca1ec5} batch=${v_36e01f.length} enrolled=${v_83ee53.enrolled.length}`);

        await v_4585d1(v_2ca7e0, v_ca1ec5, v_36e01f, v_6e0fd3);

        v_83ee53.enrolled.push(...v_36e01f);
        console.log(
          `[AngleCollector] flushOne SUCCESS person=${v_ca1ec5} added=${v_36e01f.length} total=${v_83ee53.enrolled.length}`,
        );
      } catch (v_49263d) {

        console.warn(`[AngleCollector] flushOne FAILED person=${v_ca1ec5}:`, v_49263d);
      } finally {
        v_83ee53.flushInFlight = false;
      }
    },
    [v_2ca7e0, v_6e0fd3],
  );

  v_c4deb2(() => {
    if (!v_d20c84) return;
    v_ec9810.current = setInterval(() => {
      for (const [v_ca1ec5, v_83ee53] of v_b004c2.current) {
        if (v_83ee53.pending.length > 0) void v_57a630(v_ca1ec5, v_83ee53);
      }
    }, v_0a8c9f);
    return () => {
      if (v_ec9810.current) {
        clearInterval(v_ec9810.current);
        v_ec9810.current = null;
      }
    };
  }, [v_d20c84, v_57a630]);

  const v_0f0ff3 = v_de06a3(
    (v_ca1ec5, v_f9a45c) => {
      if (!v_d20c84 || !v_2ca7e0) {
        console.log(`[AngleCollector] observe SKIP enabled=${v_d20c84} hasToken=${!!v_2ca7e0}`);
        return;
      }
      let v_83ee53 = v_b004c2.current.get(v_ca1ec5);
      if (!v_83ee53) {
        v_83ee53 = { enrolled: [], pending: [], flushInFlight: false };
        v_b004c2.current.set(v_ca1ec5, v_83ee53);

        v_83ee53.pending.push(v_f9a45c);
        console.log(`[AngleCollector] FIRST observe person=${v_ca1ec5}, queued 1`);
        return;
      }
      if (v_83ee53.enrolled.length >= v_9fe285) {
        console.log(`[AngleCollector] observe CAP person=${v_ca1ec5} enrolled=${v_83ee53.enrolled.length}`);
        return;
      }
      const v_c83285 = v_83ee53.enrolled.length + v_83ee53.pending.length;

      if (v_c83285 < v_739e9a) {
        v_83ee53.pending.push(v_f9a45c);
        console.log(`[AngleCollector] observe FORCE-QUEUE person=${v_ca1ec5} total=${v_c83285 + 1}/${v_739e9a}`);
      } else {

        const v_75fbef = [...v_83ee53.enrolled, ...v_83ee53.pending];
        const v_bb188d = v_87c181(v_f9a45c, v_75fbef);
        if (v_bb188d < v_cb6d5f) {
          console.log(`[AngleCollector] observe SKIP person=${v_ca1ec5} minL2=${v_bb188d.toFixed(3)} < ${v_cb6d5f}`);
          return; 
        }
        v_83ee53.pending.push(v_f9a45c);
        console.log(`[AngleCollector] observe QUEUE person=${v_ca1ec5} minL2=${v_bb188d.toFixed(3)} pending=${v_83ee53.pending.length}`);
      }
      if (v_83ee53.pending.length >= v_a78ac8) {
        console.log(`[AngleCollector] observe → flush trigger person=${v_ca1ec5}`);
        void v_57a630(v_ca1ec5, v_83ee53);
      }
    },
    [v_d20c84, v_2ca7e0, v_57a630],
  );

  const v_487a25 = v_de06a3(() => {

    for (const [v_ca1ec5, v_83ee53] of v_b004c2.current) {
      if (v_83ee53.pending.length > 0) void v_57a630(v_ca1ec5, v_83ee53);
    }
    v_b004c2.current.clear();
  }, [v_57a630]);

  v_c4deb2(() => {
    return () => {
      v_487a25();
    };
  }, [v_487a25]);

  return { observe: v_0f0ff3, reset: v_487a25 };
}
