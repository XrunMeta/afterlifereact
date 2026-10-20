

import { v_c4deb2, v_e662ae } from "bapkr";
import { v_6b5698, v_18ba07 } from "rcmrninabrnb";
import * as v_2b7a17 from "bpebbcghaffswkrsep";

type Data = Record<string, unknown>;

const v_b60993 = "afterlife:chat-updated";
export function v_12f485(v_6e0fd3): void {
  v_18ba07.emit(v_b60993, { cloneId: v_6e0fd3 });
}

function v_f3904a(v_9390e8, v_6e0fd3): boolean {
  if (!v_9390e8) return false;
  const v_f71b56 = typeof v_9390e8.url === "string" ? v_9390e8.url : "";
  const v_bff046 = v_9390e8.chat === true || v_9390e8.type === "clone_message" || v_f71b56.startsWith("afterlife://chat/");
  if (!v_bff046) return false;
  if (v_6e0fd3 === undefined) return true;
  const v_062ae9 = typeof v_9390e8.cloneId === "number" ? v_9390e8.cloneId : Number(v_9390e8.cloneId ?? v_f71b56.match(/chat\/(\d+)/)?.[1] ?? 0);
  return v_062ae9 === v_6e0fd3;
}

export function v_08bca5(v_d5345f, v_6e0fd3): void {
  const v_16dbdb = v_e662ae(v_d5345f);
  v_16dbdb.current = v_d5345f;

  v_c4deb2(() => {
    const v_0e7d44 = v_2b7a17.addNotificationReceivedListener((v_f4e98d) => {
      if (v_f3904a(v_f4e98d.request.content.data as Data | undefined, v_6e0fd3)) v_16dbdb.current();
    });
    const v_1c0da8 = v_18ba07.addListener(v_b60993, (v_9e86fd) => {
      if (v_6e0fd3 === undefined || v_9e86fd?.cloneId === v_6e0fd3) v_16dbdb.current();
    });
    let v_ba2215 = v_6b5698.currentState;
    const v_ec9d85 = v_6b5698.addEventListener("change", (v_fd5f43) => {
      if (v_ba2215 !== "active" && v_fd5f43 === "active") v_16dbdb.current();
      v_ba2215 = v_fd5f43;
    });
    return () => {
      v_0e7d44.remove();
      v_ec9d85.remove();
      v_1c0da8.remove();
    };
  }, [v_6e0fd3]);
}
