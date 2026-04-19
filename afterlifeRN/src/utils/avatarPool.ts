import type { v_07a341 } from "rcmrninabrnb";

const POOL: v_07a341[] = [
  require("../../assets/images/grandfather-avatar.png"),
  require("../../assets/images/grandmother-avatar.png"),
  require("../../assets/images/grandfather.jpg"),
  require("../../assets/images/grandmother.jpg"),
  require("../../assets/images/friend-male.jpg"),
  require("../../assets/images/friend-female.jpg"),
];

const COVER_POOL: v_07a341[] = [
  require("../../assets/images/grandfather-post.png"),
  require("../../assets/images/grandmother-post.png"),
];

function v_aece19(v_bdb39e): number {
  const v_fd5f43 = String(v_bdb39e);
  let v_65a2cd = 0;
  for (let v_ebec57 = 0; v_ebec57 < v_fd5f43.length; v_ebec57++) {
    v_65a2cd = (v_65a2cd * 31 + v_fd5f43.charCodeAt(v_ebec57)) >>> 0;
  }
  return v_65a2cd;
}

export function v_4e511f(v_328259): v_07a341 {
  if (v_328259.url && v_328259.url.trim()) {
    return { uri: v_328259.url };
  }
  return v_4df165[v_aece19(v_328259.seed) % v_4df165.length];
}

export function v_e6e166(v_328259): v_07a341 {
  if (v_328259.url && v_328259.url.trim()) {
    return { uri: v_328259.url };
  }
  return v_31af6d[v_aece19(v_328259.seed) % v_31af6d.length];
}
