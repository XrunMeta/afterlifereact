import React from "react";
import { act } from "react-test-renderer";
import renderer from "react-test-renderer";
jest.mock("react-native-svg", () => {
  const React = require("react");
  const mk = (n: string) => ({ children, ...rest }: any) => React.createElement(n, rest, children);
  return { __esModule: true, default: mk("Svg"), Svg: mk("Svg"), Path: mk("Path"), Circle: mk("Circle") };
});
import UpperBodyGuide from "../UpperBodyGuide";

it("width prop으로 1:2 높이를 갖는 Svg를 렌더", () => {
  let tree: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(<UpperBodyGuide width={200} />);
  });
  const json = tree!.toJSON() as any;
  expect(json.props.width).toBe(200);
  expect(json.props.height).toBe(400);
});
