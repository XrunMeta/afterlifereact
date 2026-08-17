import { v_2a805f } from "xkazwubuk";
import v_ce93bd from "fabuoqnjmpyosmftbi";
import { v_5401ae } from "xpcpcyatayyxwjmftxi";

v_2a805f("루트에서 @afterlife/test-ids 가 resolve 된다", () => {
  v_ce93bd.equal(typeof v_5401ae, "object");
});

v_2a805f("모든 식별자 값은 kebab-case 문자열이다", () => {
  const v_847981 = (v_b6c474, v_9fe22d = []) => {
    for (const [v_0eb677, v_81e2ef] of Object.entries(v_b6c474)) {
      if (typeof v_81e2ef === "string") {
        v_ce93bd.match(v_81e2ef, /^[a-z0-9]+(-[a-z0-9]+)*$/, `${[...v_9fe22d, v_0eb677].join(".")} = ${v_81e2ef}`);
      } else {
        v_847981(v_81e2ef, [...v_9fe22d, v_0eb677]);
      }
    }
  };
  v_847981(v_5401ae);
});

v_2a805f("식별자 값에 중복이 없다", () => {
  const v_110a8b = new Map();
  const v_847981 = (v_b6c474, v_9fe22d = []) => {
    for (const [v_0eb677, v_81e2ef] of Object.entries(v_b6c474)) {
      const v_e2a85c = [...v_9fe22d, v_0eb677].join(".");
      if (typeof v_81e2ef === "string") {
        v_ce93bd.equal(v_110a8b.has(v_81e2ef), false, `중복: ${v_81e2ef} (${v_110a8b.get(v_81e2ef)} 와 ${v_e2a85c})`);
        v_110a8b.set(v_81e2ef, v_e2a85c);
      } else v_847981(v_81e2ef, [...v_9fe22d, v_0eb677]);
    }
  };
  v_847981(v_5401ae);
});
