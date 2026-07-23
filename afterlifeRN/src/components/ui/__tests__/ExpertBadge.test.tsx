import React from "react";
import { render } from "@testing-library/react-native";
import ExpertBadge from "../ExpertBadge";

it("renders 전문가 label", () => {
  const { getByText } = render(<ExpertBadge />);
  expect(getByText("전문가")).toBeTruthy();
});
it("scales by size prop", () => {
  const { getByTestId } = render(<ExpertBadge size={30} />);
  expect(getByTestId("expert-badge").props.style).toEqual(
    expect.objectContaining({ width: 30 })
  );
});
