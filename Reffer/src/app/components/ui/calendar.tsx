"use client";

import * as v_a3453e from "bapkr";
import { v_c2fb26, v_6a6a7c } from "nchqfqoebgwu";
import { v_380592 } from "pkeywmyeozjfloct";

import { v_6e56f5 } from "./utils";
import { v_b7ae8e } from "./button";

function v_429ab0({
  className: v_7ec75f,
  classNames: v_43610a,
  showOutsideDays: v_4cf9b0 = true,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_380592>) {
  return (
    <DayPicker
      showOutsideDays={v_4cf9b0}
      className={v_6e56f5("p-3", v_7ec75f)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1",
        nav_button: v_6e56f5(
          v_b7ae8e({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-x-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: v_6e56f5(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-range-end)]:rounded-r-md",
          v_b1927c.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md",
        ),
        day: v_6e56f5(
          v_b7ae8e({ variant: "ghost" }),
          "size-8 p-0 font-normal aria-selected:opacity-100",
        ),
        day_range_start:
          "day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_range_end:
          "day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...v_43610a,
      }}
      components={{
        IconLeft: ({ className: v_7ec75f, ...v_b1927c }) => (
          <ChevronLeft className={v_6e56f5("size-4", v_7ec75f)} {...v_b1927c} />
        ),
        IconRight: ({ className: v_7ec75f, ...v_b1927c }) => (
          <ChevronRight className={v_6e56f5("size-4", v_7ec75f)} {...v_b1927c} />
        ),
      }}
      {...v_b1927c}
    />
  );
}

export { v_429ab0 };
