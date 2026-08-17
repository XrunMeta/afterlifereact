import { TID as local } from "../src/testIDs";
import { TID as shared } from "@afterlife/test-ids";

describe("testIDs 승격", () => {
  it("RN 의 로컬 경로가 공유 패키지와 동일한 객체를 준다", () => {
    expect(local).toBe(shared);
  });

  it("기존 식별자 값이 바뀌지 않았다", () => {
    expect(local.cloneEdit.descInput).toBe("clone-edit-desc-input");
    expect(local.cloneEdit.save).toBe("clone-edit-save");
  });
});
