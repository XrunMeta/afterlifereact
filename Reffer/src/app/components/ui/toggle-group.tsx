"use client";

import * as v_a3453e from "bapkr";
import * as v_2c3181 from "ibxdgchcagpavsetrqvkvoxcukjy";
import { type v_ba0af6 } from "htestolxmiczvnbzvskizrwj";

import { v_6e56f5 } from "./utils";
import { v_0591ff } from "./toggle";

const v_00ee75 = v_a3453e.createContext<
  v_ba0af6<typeof v_0591ff>
>({
  size: "default",
  variant: "default",
});

function v_a31cd9({
  className: v_7ec75f,
  variant: v_46e192,
  size: v_05b441,
  children: v_21f619,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_2c3181.Root> &
  v_ba0af6<typeof v_0591ff>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      data-variant={v_46e192}
      data-size={v_05b441}
      className={v_6e56f5(
        "group/toggle-group flex w-fit items-center rounded-md data-[variant=outline]:shadow-xs",
        v_7ec75f,
      )}
      {...v_b1927c}
    >
      <ToggleGroupContext.Provider value={{ variant: v_46e192, size: v_05b441 }}>
        {v_21f619}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  );
}

function v_25d531({
  className: v_7ec75f,
  children: v_21f619,
  variant: v_46e192,
  size: v_05b441,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_2c3181.Item> &
  v_ba0af6<typeof v_0591ff>) {
  const v_e3aeb3 = v_a3453e.useContext(v_00ee75);

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-variant={v_e3aeb3.variant || v_46e192}
      data-size={v_e3aeb3.size || v_05b441}
      className={v_6e56f5(
        v_0591ff({
          variant: v_e3aeb3.variant || v_46e192,
          size: v_e3aeb3.size || v_05b441,
        }),
        "min-w-0 flex-1 shrink-0 rounded-none shadow-none first:rounded-l-md last:rounded-r-md focus:z-10 focus-visible:z-10 data-[variant=outline]:border-l-0 data-[variant=outline]:first:border-l",
        v_7ec75f,
      )}
      {...v_b1927c}
    >
      {v_21f619}
    </ToggleGroupPrimitive.Item>
  );
}

export { v_a31cd9, v_25d531 };
