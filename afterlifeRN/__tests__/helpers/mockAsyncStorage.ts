

export function v_561033() {
  const v_a73fa2 = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: async (v_0eb677) => (v_a73fa2.has(v_0eb677) ? v_a73fa2.get(v_0eb677)! : null),
      setItem: async (v_0eb677, v_81e2ef) => {
        v_a73fa2.set(v_0eb677, v_81e2ef);
      },
      removeItem: async (v_0eb677) => {
        v_a73fa2.delete(v_0eb677);
      },
      clear: async () => {
        v_a73fa2.clear();
      },
      getAllKeys: async () => Array.from(v_a73fa2.keys()),
      multiGet: async (v_359c3e) => v_359c3e.map((v_0eb677) => [v_0eb677, v_a73fa2.get(v_0eb677) ?? null]),
      multiSet: async (v_015ea2) => {
        v_015ea2.forEach(([v_0eb677, v_81e2ef]) => v_a73fa2.set(v_0eb677, v_81e2ef));
      },
      multiRemove: async (v_359c3e) => {
        v_359c3e.forEach((v_0eb677) => v_a73fa2.delete(v_0eb677));
      },
    },
  };
}
