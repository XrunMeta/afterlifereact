

import { v_650cfa } from "ixigazcpvfldbecwtbvavtbi";
import { v_94c936 } from "../navigation/navigationRef";
import { v_f18f70 } from "./cloneShareDeferredLink";

export async function v_a3ff58(): Promise<void> {
  await v_f18f70();
  const v_487a25 = () => {
    if (!v_94c936.isReady()) return false;
    v_94c936.dispatch(
      v_650cfa.reset({
        index: 0,
        routes: [
          {
            name: "Main",
            state: {
              index: 4,
              routes: [
                { name: "HomeTab" },
                { name: "SearchTab" },
                { name: "CreateTab" },
                { name: "ShortsTab" },
                {
                  name: "ClonesTab",
                  state: { index: 0, routes: [{ name: "Dashboard" }] },
                },
                { name: "MyTab" },
              ],
            },
          },
        ],
      }),
    );
    return true;
  };
  if (!v_487a25()) {
    await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 400));
    v_487a25();
  }
}
