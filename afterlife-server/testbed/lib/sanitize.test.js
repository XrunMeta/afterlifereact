import { v_2a805f } from "xkazwubuk";
import v_ce93bd from "fabuoqnjmpyosmftbi";
import { v_d2e688 } from "./sanitize.js";

v_2a805f("applyBlocklist replaces blocked words with mask", () => {
  v_ce93bd.equal(v_d2e688("이 욕설 나쁜말", ["욕설"]), "이 ⋯ 나쁜말");
});

v_2a805f("applyBlocklist passthrough when blocklist empty", () => {
  v_ce93bd.equal(v_d2e688("정상 문장", []), "정상 문장");
});

v_2a805f("applyBlocklist handles non-string / nullish blocklist", () => {
  v_ce93bd.equal(v_d2e688("hi", null), "hi");
  v_ce93bd.equal(v_d2e688("", ["x"]), "");
});

v_2a805f("applyBlocklist escapes regex metachars in blocklist entries (ReDoS guard)", () => {

  v_ce93bd.equal(v_d2e688("a(a+)+b", ["(a+)+"]), "a⋯b");
  v_ce93bd.equal(v_d2e688("1.2.3", ["."]), "1⋯2⋯3");
});
