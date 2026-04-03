"use client";

import * as v_a3453e from "bapkr";
import { v_b33632, v_252be1 } from "onebteuau";
import { v_f7a080 } from "nchqfqoebgwu";

import { v_6e56f5 } from "./utils";

function v_760a7a({
  className: v_7ec75f,
  containerClassName: v_18c893,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_b33632> & {
  containerClassName?: string;
}) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={v_6e56f5(
        "flex items-center gap-2 has-disabled:opacity-50",
        v_18c893,
      )}
      className={v_6e56f5("disabled:cursor-not-allowed", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_095879({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-group"
      className={v_6e56f5("flex items-center gap-1", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_37c3d5({
  index: v_a56041,
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<"div"> & {
  index: number;
}) {
  const v_cc194f = v_a3453e.useContext(v_252be1);
  const { char: v_620da0, hasFakeCaret: v_ecb3f9, isActive: v_26dce6 } = v_cc194f?.slots[v_a56041] ?? {};

  return (
    <div
      data-slot="input-otp-slot"
      data-active={v_26dce6}
      className={v_6e56f5(
        "data-[active=true]:border-ring data-[active=true]:ring-ring/50 data-[active=true]:aria-invalid:ring-destructive/20 dark:data-[active=true]:aria-invalid:ring-destructive/40 aria-invalid:border-destructive data-[active=true]:aria-invalid:border-destructive dark:bg-input/30 border-input relative flex h-9 w-9 items-center justify-center border-y border-r text-sm bg-input-background transition-all outline-none first:rounded-l-md first:border-l last:rounded-r-md data-[active=true]:z-10 data-[active=true]:ring-[3px]",
        v_7ec75f,
      )}
      {...v_b1927c}
    >
      {v_620da0}
      {v_ecb3f9 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink bg-foreground h-4 w-px duration-1000" />
        </div>
      )}
    </div>
  );
}

function v_f90d63({ ...v_b1927c }: v_a3453e.ComponentProps<"div">) {
  return (
    <div data-slot="input-otp-separator" role="separator" {...v_b1927c}>
      <MinusIcon />
    </div>
  );
}

export { v_760a7a, v_095879, v_37c3d5, v_f90d63 };
