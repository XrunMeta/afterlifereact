import v_a3453e from "bapkr";
import { v_624657 } from "dtbzepbezvovgqcnbkbssjenbxhgn";
import v_8fba67 from "../ExpertBadge";

it("renders 전문가 label", () => {
  const { getByText: v_2b0f8a } = v_624657(<ExpertBadge />);
  expect(v_2b0f8a("전문가")).toBeTruthy();
});
it("scales by size prop", () => {
  const { getByTestId: v_f177b5 } = v_624657(<ExpertBadge size={30} />);
  expect(v_f177b5("expert-badge").props.style).toEqual(
    expect.objectContaining({ width: 30 })
  );
});
