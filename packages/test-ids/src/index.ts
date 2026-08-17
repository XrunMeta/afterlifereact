

export type TestId = string;

export const TID = {
  cloneEdit: {
    nameInput: "clone-edit-name-input",
    descInput: "clone-edit-desc-input",
    descCounter: "clone-edit-desc-counter",
    save: "clone-edit-save",
    loading: "clone-edit-loading",
    notFound: "clone-edit-not-found",
  },
} as const;

export function rowId(base: string, id: string | number): string {
  return `${base}-${id}`;
}
