"use client";

import * as v_a3453e from "bapkr";
import * as v_ea6fa0 from "zvywzdsehmsgvgrngtpimx";
import { v_74e8d4, type v_ba0af6 } from "htestolxmiczvnbzvskizrwj";

import { v_6e56f5 } from "./utils";

const v_0591ff = v_74e8d4(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium hover:bg-muted hover:text-muted-foreground disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none transition-[color,box-shadow] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-9 px-2 min-w-9",
        sm: "h-8 px-1.5 min-w-8",
        lg: "h-10 px-2.5 min-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function v_3a713c({
  className: v_7ec75f,
  variant: v_46e192,
  size: v_05b441,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_ea6fa0.Root> &
  v_ba0af6<typeof v_0591ff>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={v_6e56f5(v_0591ff({ variant: v_46e192, size: v_05b441, className: v_7ec75f }))}
      {...v_b1927c}
    />
  );
}

export { v_3a713c, v_0591ff };
