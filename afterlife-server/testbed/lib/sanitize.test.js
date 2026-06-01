import { test } from "node:test";
import assert from "node:assert/strict";
import { applyBlocklist } from "./sanitize.js";

test("applyBlocklist replaces blocked words with mask", () => {
  assert.equal(applyBlocklist("이 욕설 나쁜말", ["욕설"]), "이 ⋯ 나쁜말");
});

test("applyBlocklist passthrough when blocklist empty", () => {
  assert.equal(applyBlocklist("정상 문장", []), "정상 문장");
});

test("applyBlocklist handles non-string / nullish blocklist", () => {
  assert.equal(applyBlocklist("hi", null), "hi");
  assert.equal(applyBlocklist("", ["x"]), "");
});

test("applyBlocklist escapes regex metachars in blocklist entries (ReDoS guard)", () => {

  assert.equal(applyBlocklist("a(a+)+b", ["(a+)+"]), "a⋯b");
  assert.equal(applyBlocklist("1.2.3", ["."]), "1⋯2⋯3");
});
