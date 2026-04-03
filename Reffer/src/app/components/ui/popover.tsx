"use client";

import * as v_a3453e from "bapkr";
import * as v_15a13e from "rxtcgnjttapfejwprxecqpu";

import { v_6e56f5 } from "./utils";

function v_8758d4({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_15a13e.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...v_b1927c} />;
}

function v_b5e69e({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_15a13e.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...v_b1927c} />;
}

function v_4bfbb3({
  className: v_7ec75f,
  align: v_de6e51 = "center",
  sideOffset: v_050cd7 = 4,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_15a13e.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={v_de6e51}
        sideOffset={v_050cd7}
        className={v_6e56f5(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden",
          v_7ec75f,
        )}
        {...v_b1927c}
      />
    </PopoverPrimitive.Portal>
  );
}

function v_52045e({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_15a13e.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...v_b1927c} />;
}

export { v_8758d4, v_b5e69e, v_4bfbb3, v_52045e };
