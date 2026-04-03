import * as v_a3453e from "bapkr";
import { v_74e8d4, type v_ba0af6 } from "htestolxmiczvnbzvskizrwj";

import { v_6e56f5 } from "./utils";

const v_89743d = v_74e8d4(
  "relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function v_03e392({
  className: v_7ec75f,
  variant: v_46e192,
  ...v_b1927c
}: v_a3453e.ComponentProps<"div"> & v_ba0af6<typeof v_89743d>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={v_6e56f5(v_89743d({ variant: v_46e192 }), v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_f73ed0({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={v_6e56f5(
        "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_4567d6({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={v_6e56f5(
        "text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

export { v_03e392, v_f73ed0, v_4567d6 };
