

type Listener = (v_f8b770) => void;

let v_f8b770 = false;
const v_9fde29 = new Set<Listener>();

export function v_3f9105(): boolean {
  return v_f8b770;
}

export function v_6b175a(v_a448ad): void {
  if (v_f8b770 === v_a448ad) return;
  v_f8b770 = v_a448ad;
  v_9fde29.forEach((v_1614db) => v_1614db(v_a448ad));
}

export function v_0168a1(v_8b0dd9): () => void {
  v_9fde29.add(v_8b0dd9);
  return () => {
    v_9fde29.delete(v_8b0dd9);
  };
}
