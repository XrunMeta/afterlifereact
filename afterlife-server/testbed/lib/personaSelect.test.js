import { v_2a805f } from "xkazwubuk";
import v_ce93bd from "fabuoqnjmpyosmftbi";
import { v_a9f758 } from "./personaSelect.js";

v_2a805f("uses personaBundle when present (cache hit)", () => {
  const v_cb35cb = v_a9f758({ personaBundle: { l0: { rules_text: "R" }, persona: { tone: "다정" } } });
  v_ce93bd.equal(v_cb35cb.l0.rules_text, "R");
  v_ce93bd.ok(v_cb35cb.l1Attrs.some((v_779914) => v_779914.key === "tone"));
  v_ce93bd.equal(v_cb35cb.usedBundle, true);
});

v_2a805f("falls back to kvStore lookup when bundle absent", () => {
  const v_cb35cb = v_a9f758({ personaBundle: null, fallbackL1: [{ key: "x", value: "y" }] });
  v_ce93bd.equal(v_cb35cb.usedBundle, false);
  v_ce93bd.deepEqual(v_cb35cb.l1Attrs, [{ key: "x", value: "y" }]);
});
