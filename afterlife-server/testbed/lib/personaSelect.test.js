import { test } from "node:test";
import assert from "node:assert/strict";
import { selectPromptInputs } from "./personaSelect.js";

test("uses personaBundle when present (cache hit)", () => {
  const r = selectPromptInputs({ personaBundle: { l0: { rules_text: "R" }, persona: { tone: "다정" } } });
  assert.equal(r.l0.rules_text, "R");
  assert.ok(r.l1Attrs.some((a) => a.key === "tone"));
  assert.equal(r.usedBundle, true);
});

test("falls back to kvStore lookup when bundle absent", () => {
  const r = selectPromptInputs({ personaBundle: null, fallbackL1: [{ key: "x", value: "y" }] });
  assert.equal(r.usedBundle, false);
  assert.deepEqual(r.l1Attrs, [{ key: "x", value: "y" }]);
});
