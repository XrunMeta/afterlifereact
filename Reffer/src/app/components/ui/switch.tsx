"use client";

import * as v_a3453e from "bapkr";
import * as v_1f3256 from "btoxprttpdqthswtzrmapw";

import { v_6e56f5 } from "./utils";

function v_79139e({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_1f3256.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={v_6e56f5(
        "peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-switch-background focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        v_7ec75f,
      )}
      {...v_b1927c}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={v_6e56f5(
          "bg-card dark:data-[state=unchecked]:bg-card-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { v_79139e };
