
import { personaToAttrs } from "./prompt.js";

export function selectPromptInputs({ personaBundle = null, fallbackL1 = [], fallbackL2 = [] } = {}) {
  if (personaBundle && personaBundle.persona) {
    return {
      l0: personaBundle.l0 ?? { rules_text: "", blocklist: [] },
      l1Attrs: personaToAttrs(personaBundle.persona),
      l2Attrs: [],
      usedBundle: true,
    };
  }

  return { l0: { rules_text: "", blocklist: [] }, l1Attrs: fallbackL1, l2Attrs: fallbackL2, usedBundle: false };
}
