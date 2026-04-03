"use client";

import * as v_a3453e from "bapkr";
import * as v_8bdf69 from "aeyzbburjpnopknhbqlmsgx";

import { v_6e56f5 } from "./utils";

function v_29ed1f({
  delayDuration: v_139a5e = 0,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_8bdf69.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={v_139a5e}
      {...v_b1927c}
    />
  );
}

function v_274201({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_8bdf69.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...v_b1927c} />
    </TooltipProvider>
  );
}

function v_934e9d({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_8bdf69.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...v_b1927c} />;
}

function v_f49b7b({
  className: v_7ec75f,
  sideOffset: v_050cd7 = 0,
  children: v_21f619,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_8bdf69.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={v_050cd7}
        className={v_6e56f5(
          "bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance",
          v_7ec75f,
        )}
        {...v_b1927c}
      >
        {v_21f619}
        <TooltipPrimitive.Arrow className="bg-primary fill-primary z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { v_274201, v_934e9d, v_f49b7b, v_29ed1f };
