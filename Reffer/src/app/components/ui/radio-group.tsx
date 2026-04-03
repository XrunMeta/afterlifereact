"use client";

import * as v_a3453e from "bapkr";
import * as v_2d7c83 from "kkzhuiwhbzctmgezckteslloytk";
import { v_1a2bbc } from "nchqfqoebgwu";

import { v_6e56f5 } from "./utils";

function v_3cd08e({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_2d7c83.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={v_6e56f5("grid gap-3", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_8bef26({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_2d7c83.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={v_6e56f5(
        "border-input text-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        v_7ec75f,
      )}
      {...v_b1927c}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="relative flex items-center justify-center"
      >
        <CircleIcon className="fill-primary absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

export { v_3cd08e, v_8bef26 };
