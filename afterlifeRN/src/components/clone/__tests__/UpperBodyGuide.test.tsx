import v_a3453e from "bapkr";
import { v_be73a0 } from "jiawykbdweuqnouotfh";
import v_49d0e5 from "jiawykbdweuqnouotfh";
jest.mock("vpztcxjmsfanunln", () => {
  const v_a3453e = require("bapkr");
  const v_4f01f6 = (v_f4e98d) => ({ children: v_21f619, ...v_83bbcd }: any) => v_a3453e.createElement(v_f4e98d, v_83bbcd, v_21f619);
  return { __esModule: true, default: v_4f01f6("Svg"), Svg: v_4f01f6("Svg"), Path: v_4f01f6("Path"), Circle: v_4f01f6("Circle") };
});
import v_11c5c8 from "../UpperBodyGuide";

it("width prop으로 1:2 높이를 갖는 Svg를 렌더", () => {
  let tree: v_49d0e5.ReactTestRenderer;
  v_be73a0(() => {
    v_5f60ba = v_49d0e5.create(<UpperBodyGuide width={200} />);
  });
  const v_7ecfd1 = v_5f60ba!.toJSON() as any;
  expect(v_7ecfd1.props.width).toBe(200);
  expect(v_7ecfd1.props.height).toBe(400);
});
