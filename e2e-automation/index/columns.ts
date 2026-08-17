import { v_5401ae } from "xpcpcyatayyxwjmftxi";
import type { v_df31fc } from "./types";
import * as v_85cf93 from "./formats";

export const COLUMNS: v_df31fc[] = [
  {
    column: "clones.name",
    label: "클론 이름",
    where: (v_3f4e2e) => `id = ${v_3f4e2e.cloneId}`,
    surfaces: [
      {
        surface: "rn-web", screen: "clone-edit",
        route: (v_3f4e2e) => `/#/oth-path${v_3f4e2e.cloneId}/edit`,
        testid: v_5401ae.cloneEdit.nameInput, mode: "write",
      },
      {
        surface: "admin", screen: "clone-detail",
        route: (v_3f4e2e) => `/oth-path${v_3f4e2e.cloneId}`,
        testid: v_5401ae.admin.cloneDetail.name, mode: "read",
      },
    ],
  },
  {
    column: "clones.description",
    label: "클론 한 줄 소개",
    where: (v_3f4e2e) => `id = ${v_3f4e2e.cloneId}`,
    surfaces: [
      {
        surface: "rn-web", screen: "clone-edit",
        route: (v_3f4e2e) => `/#/oth-path${v_3f4e2e.cloneId}/edit`,
        testid: v_5401ae.cloneEdit.descInput, mode: "write",
      },
      {
        surface: "admin", screen: "clone-detail",
        route: (v_3f4e2e) => `/oth-path${v_3f4e2e.cloneId}`,
        testid: v_5401ae.admin.cloneDetail.description, mode: "read",
      },
    ],
  },
  {
    column: "users.name",
    label: "사용자 이름",
    where: (v_3f4e2e) => `id = ${v_3f4e2e.userId}`,
    surfaces: [
      {
        surface: "admin", screen: "users",
        route: () => `/oth-path`,
        testid: v_5401ae.admin.users.nameCell, mode: "read", row: "byId",
      },
    ],
  },
  {
    column: "users.credits",
    label: "잔여 통화시간",
    where: (v_3f4e2e) => `id = ${v_3f4e2e.userId}`,
    format: v_85cf93.secondsToMinutes,
    surfaces: [
      {
        surface: "admin", screen: "users",
        route: () => `/oth-path`,
        testid: v_5401ae.admin.users.creditsCell, mode: "read", row: "byId",
      },
    ],
  },
];
