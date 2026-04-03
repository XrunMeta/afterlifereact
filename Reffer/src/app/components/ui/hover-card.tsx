"use client";

import * as v_a3453e from "bapkr";
import * as v_efc416 from "htecxnjvnkshapxtjyfqblpthq";

import { v_6e56f5 } from "./utils";

function v_a632a0({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_efc416.Root>) {
  return <HoverCardPrimitive.Root data-slot="hover-card" {...v_b1927c} />;
}

function v_a0f617({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_efc416.Trigger>) {
  return (
    <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...v_b1927c} />
  );
}

function v_d0873f({
  className: v_7ec75f,
  align: v_de6e51 = "center",
  sideOffset: v_050cd7 = 4,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_efc416.Content>) {
  return (
    <HoverCardPrimitive.Portal data-slot="hover-card-portal">
      <HoverCardPrimitive.Content
        data-slot="hover-card-content"
        align={v_de6e51}
        sideOffset={v_050cd7}
        className={v_6e56f5(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-64 origin-(--radix-hover-card-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden",
          v_7ec75f,
        )}
        {...v_b1927c}
      />
    </HoverCardPrimitive.Portal>
  );
}

export { v_a632a0, v_a0f617, v_d0873f };
