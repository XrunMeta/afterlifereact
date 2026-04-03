"use client";

import * as v_a3453e from "bapkr";
import * as v_755a0d from "elscnuhqmzqladgkigrdjdki";

import { v_6e56f5 } from "./utils";

function v_94035f({
  className: v_7ec75f,
  value: v_3b402b,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_755a0d.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={v_6e56f5(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        v_7ec75f,
      )}
      {...v_b1927c}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="bg-primary h-full w-full flex-1 transition-all"
        style={{ transform: `translateX(-${100 - (v_3b402b || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { v_94035f };
