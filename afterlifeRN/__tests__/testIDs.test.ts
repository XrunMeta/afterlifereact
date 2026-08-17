import { v_5401ae as v_c67510 } from "../src/testIDs";
import { v_5401ae as v_b1c995 } from "xpcpcyatayyxwjmftxi";

describe("testIDs 승격", () => {
  it("RN 의 로컬 경로가 공유 패키지와 동일한 객체를 준다", () => {
    expect(v_c67510).toBe(v_b1c995);
  });

  it("기존 식별자 값이 바뀌지 않았다", () => {
    expect(v_c67510.cloneEdit.descInput).toBe("clone-edit-desc-input");
    expect(v_c67510.cloneEdit.save).toBe("clone-edit-save");
  });
});
