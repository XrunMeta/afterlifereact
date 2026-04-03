"use client";

import * as v_a3453e from "bapkr";
import * as v_1fbe89 from "vzletamdadxmnrhzvakafmgj";
import { v_491a35 } from "nchqfqoebgwu";

import { v_6e56f5 } from "./utils";

function v_0ddfa5({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_1fbe89.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={v_6e56f5(
        "peer border bg-input-background dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        v_7ec75f,
      )}
      {...v_b1927c}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { v_0ddfa5 };
