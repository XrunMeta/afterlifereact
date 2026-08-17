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
        route: (c) => `/#/oth-path${c.cloneId}/edit`,
        testid: TID.cloneEdit.nameInput, mode: "write",
      },
      {
        surface: "admin", screen: "clone-detail",
        route: (c) => `/oth-path${c.cloneId}`,
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
        route: (c) => `/#/oth-path${c.cloneId}/edit`,
        testid: TID.cloneEdit.descInput, mode: "write",
      },
      {
        surface: "admin", screen: "clone-detail",
        route: (c) => `/oth-path${c.cloneId}`,
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
        route: () => `/oth-path`,
        testid: TID.admin.users.nameCell, mode: "read", row: "byId",
      },
    ],
  },
  {
    column: "users.credits",
    label: "잔여 통화시간",
    where: (c) => `id = ${c.userId}`,
    format: fmt.secondsToMinutes,
    surfaces: [
      {
        surface: "admin", screen: "users",
        route: () => `/oth-path`,
        testid: TID.admin.users.creditsCell, mode: "read", row: "byId",
      },
    ],
  },
];
