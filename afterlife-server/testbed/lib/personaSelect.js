
import { v_ea9c84 } from "./prompt.js";

export function v_a9f758({ personaBundle: v_ba0fde = null, fallbackL1: v_69681f = [], fallbackL2: v_b533a0 = [] } = {}) {
  if (v_ba0fde && v_ba0fde.persona) {
    return {
      l0: v_ba0fde.l0 ?? { rules_text: "", blocklist: [] },
      l1Attrs: v_ea9c84(v_ba0fde.persona),
      l2Attrs: [],
      usedBundle: true,
    };
  }

  return { l0: { rules_text: "", blocklist: [] }, l1Attrs: v_69681f, l2Attrs: v_b533a0, usedBundle: false };
}
