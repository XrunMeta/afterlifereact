
export interface RequestGate {
  begin(): number;
  cancel(): void;
  isCurrent(id: number): boolean;
}

export function v_f8616b(): RequestGate {
  let v_a936b7 = 0;
  return {
    begin: () => ++v_a936b7,
    cancel: () => {
      v_a936b7++;
    },
    isCurrent: (v_389afb) => v_389afb === v_a936b7,
  };
}
