"use client";

import * as v_a3453e from "bapkr";
import * as v_b5803a from "vtteilnxrpjealnsxulhjnrnaqa";

import { v_6e56f5 } from "./utils";

function v_73de10({
  className: v_7ec75f,
  children: v_21f619,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_b5803a.Root>) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={v_6e56f5("relative", v_7ec75f)}
      {...v_b1927c}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
      >
        {v_21f619}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

function v_9659a5({
  className: v_7ec75f,
  orientation: v_d8dc1f = "vertical",
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_b5803a.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={v_d8dc1f}
      className={v_6e56f5(
        "flex touch-none p-px transition-colors select-none",
        v_d8dc1f === "vertical" &&
          "h-full w-2.5 border-l border-l-transparent",
        v_d8dc1f === "horizontal" &&
          "h-2.5 flex-col border-t border-t-transparent",
        v_7ec75f,
      )}
      {...v_b1927c}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className="bg-border relative flex-1 rounded-full"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
}

export { v_73de10, v_9659a5 };
