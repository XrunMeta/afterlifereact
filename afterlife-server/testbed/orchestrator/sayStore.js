

export function v_458d35() {
  const v_704362 = new Map();
  const v_a268b2 = new Set();
  const v_c0efb6 = new Map();
  return {
    appendTurn(v_be62d3, v_8dbe6c) {
      const v_d0c056 = v_704362.get(v_be62d3) ?? [];
      v_d0c056.push(v_8dbe6c);
      v_704362.set(v_be62d3, v_d0c056);
      const v_a448ad = (v_c0efb6.get(v_be62d3) ?? 0) + 1;
      v_c0efb6.set(v_be62d3, v_a448ad);
      return v_a448ad;
    },

    getHistory(v_be62d3) { return [...(v_704362.get(v_be62d3) ?? [])]; },
    beginTurn(v_be62d3) {
      if (v_a268b2.has(v_be62d3)) return false;
      v_a268b2.add(v_be62d3);
      return true;
    },
    endTurn(v_be62d3) { v_a268b2.delete(v_be62d3); },
    clear(v_be62d3) {
      v_704362.delete(v_be62d3);
      v_a268b2.delete(v_be62d3);
      v_c0efb6.delete(v_be62d3);
    },
  };
}
