

export function asyncStorageMock() {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: async (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: async (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: async (k: string) => {
        store.delete(k);
      },
      clear: async () => {
        store.clear();
      },
      getAllKeys: async () => Array.from(store.keys()),
      multiGet: async (ks: string[]) => ks.map((k) => [k, store.get(k) ?? null]),
      multiSet: async (pairs: [string, string][]) => {
        pairs.forEach(([k, v]) => store.set(k, v));
      },
      multiRemove: async (ks: string[]) => {
        ks.forEach((k) => store.delete(k));
      },
    },
  };
}
