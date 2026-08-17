import { test } from "node:test";
import assert from "node:assert/strict";
import { TID } from "@afterlife/test-ids";

test("루트에서 @afterlife/test-ids 가 resolve 된다", () => {
  assert.equal(typeof TID, "object");
});

test("모든 식별자 값은 kebab-case 문자열이다", () => {
  const walk = (o, path = []) => {
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === "string") {
        assert.match(v, /^[a-z0-9]+(-[a-z0-9]+)*$/, `${[...path, k].join(".")} = ${v}`);
      } else {
        walk(v, [...path, k]);
      }
    }
  };
  walk(TID);
});

test("식별자 값에 중복이 없다", () => {
  const seen = new Map();
  const walk = (o, path = []) => {
    for (const [k, v] of Object.entries(o)) {
      const p = [...path, k].join(".");
      if (typeof v === "string") {
        assert.equal(seen.has(v), false, `중복: ${v} (${seen.get(v)} 와 ${p})`);
        seen.set(v, p);
      } else walk(v, [...path, k]);
    }
  };
  walk(TID);
});
