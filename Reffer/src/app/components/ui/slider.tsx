"use client";

import * as v_a3453e from "bapkr";
import * as v_457b77 from "urystvoiuxpsjhpelezzqe";

import { v_6e56f5 } from "./utils";

function v_1710ec({
  className: v_7ec75f,
  defaultValue: v_4ff54d,
  value: v_3b402b,
  min: v_43e24b = 0,
  max: v_d2c6bf = 100,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_457b77.Root>) {
  const v_57a9bd = v_a3453e.useMemo(
    () =>
      Array.isArray(v_3b402b)
        ? v_3b402b
        : Array.isArray(v_4ff54d)
          ? v_4ff54d
          : [v_43e24b, v_d2c6bf],
    [v_3b402b, v_4ff54d, v_43e24b, v_d2c6bf],
  );

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={v_4ff54d}
      value={v_3b402b}
      min={v_43e24b}
      max={v_d2c6bf}
      className={v_6e56f5(
        "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        v_7ec75f,
      )}
      {...v_b1927c}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={v_6e56f5(
          "bg-muted relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-4 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5",
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={v_6e56f5(
            "bg-primary absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full",
          )}
        />
      </SliderPrimitive.Track>
      {Array.from({ length: v_57a9bd.length }, (v_37eab7, v_a56041) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={v_a56041}
          className="border-primary bg-background ring-ring/50 block size-4 shrink-0 rounded-full border shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
    </SliderPrimitive.Root>
  );
}

export { v_1710ec };
