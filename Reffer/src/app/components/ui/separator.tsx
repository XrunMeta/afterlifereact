"use client";

import * as v_a3453e from "bapkr";
import * as v_ade006 from "fltknulxibirsinvhllqmzgef";

import { v_6e56f5 } from "./utils";

function v_474c83({
  className: v_7ec75f,
  orientation: v_d8dc1f = "horizontal",
  decorative: v_5aec30 = true,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_ade006.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator-root"
      decorative={v_5aec30}
      orientation={v_d8dc1f}
      className={v_6e56f5(
        "bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

export { v_474c83 };
