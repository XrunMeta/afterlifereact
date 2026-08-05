import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_929ead } from "../src/lib/cloneFaceScope";

v_469bf2("faceNamespace", () => {
  v_23805a("userId와 cloneId를 콜론으로 결합한다", () => {
    v_4d37e3(v_929ead(7, 42)).toBe("7:42");
  });

  v_23805a("서로 다른 클론은 서로 다른 namespace를 갖는다", () => {
    v_4d37e3(v_929ead(7, 42)).not.toBe(v_929ead(7, 43));
  });

  v_23805a("서로 다른 사용자는 서로 다른 namespace를 갖는다", () => {
    v_4d37e3(v_929ead(7, 42)).not.toBe(v_929ead(8, 42));
  });
});
