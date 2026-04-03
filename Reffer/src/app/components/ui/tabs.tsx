"use client";

import * as v_a3453e from "bapkr";
import * as v_51fe71 from "uvaqmadchidvcegvyuoo";

import { v_6e56f5 } from "./utils";

function v_373248({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_51fe71.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={v_6e56f5("flex flex-col gap-2", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_2b3568({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_51fe71.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={v_6e56f5(
        "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-xl p-[3px] flex",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_40f7a7({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_51fe71.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={v_6e56f5(
        "data-[state=active]:bg-card dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-xl border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_ed7019({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_51fe71.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={v_6e56f5("flex-1 outline-none", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

export { v_373248, v_2b3568, v_40f7a7, v_ed7019 };
