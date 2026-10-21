import { v_ff0340, v_df5c39 } from "../midCallEnrollHandoff";

describe("midCallEnrollHandoff", () => {
  it("같은 클론이면 한 번 꺼내고 비운다", () => {
    v_ff0340({ cloneId: 9194, personId: 163, displayName: "민수" });
    expect(v_df5c39(9194)).toEqual({ cloneId: 9194, personId: 163, displayName: "민수" });
    expect(v_df5c39(9194)).toBeNull();
  });

  it("다른 클론 통화에서 꺼내면 버린다", () => {
    v_ff0340({ cloneId: 9194, personId: 163, displayName: "민수" });
    expect(v_df5c39(9203)).toBeNull();
    expect(v_df5c39(9194)).toBeNull();
  });

  it("남긴 게 없으면 null", () => {
    expect(v_df5c39(9194)).toBeNull();
  });
});
