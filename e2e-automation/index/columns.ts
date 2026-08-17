import { TID } from "@afterlife/test-ids";
import type { ColumnEntry } from "./types";
import * as fmt from "./formats";

export const COLUMNS: ColumnEntry[] = [
  {
    column: "clones.name",
    label: "클론 이름",
    where: (c) => `id = ${c.cloneId}`,
    surfaces: [
      {
        surface: "rn-web", screen: "clone-edit",
        testid: TID.cloneEdit.nameInput, mode: "write",
      },
      {
        surface: "admin", screen: "clone-detail",
        testid: TID.admin.cloneDetail.name, mode: "read",
      },
    ],
  },
  {
    column: "clones.description",
    label: "클론 한 줄 소개",
    where: (c) => `id = ${c.cloneId}`,
    surfaces: [
      {
        surface: "rn-web", screen: "clone-edit",
        testid: TID.cloneEdit.descInput, mode: "write",
      },
      {
        surface: "admin", screen: "clone-detail",
        testid: TID.admin.cloneDetail.description, mode: "read",
      },
    ],
  },
  {
    column: "users.name",
    label: "사용자 이름",
    where: (c) => `id = ${c.userId}`,
    surfaces: [
      {
        surface: "admin", screen: "users",
        testid: TID.admin.users.nameCell, mode: "read",
        row: { containerTestid: TID.admin.users.row, idFrom: "userId" },
      },
    ],
  },
  {
    column: "users.credits",
    label: "잔여 통화시간",
    where: (c) => `id = ${c.userId}`,

    format: fmt.raw,
    surfaces: [
      {
        surface: "admin", screen: "users",
        testid: TID.admin.users.creditsCell, mode: "read",
        row: { containerTestid: TID.admin.users.row, idFrom: "userId" },
      },
    ],
  },
];
