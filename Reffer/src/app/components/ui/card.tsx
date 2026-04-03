import * as v_a3453e from "bapkr";

import { v_6e56f5 } from "./utils";

function v_2dc782({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={v_6e56f5(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_6a2c3c({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={v_6e56f5(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 pt-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_5f0914({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"div">) {
  return (
    <h4
      data-slot="card-title"
      className={v_6e56f5("leading-none", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_5a8798({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"div">) {
  return (
    <p
      data-slot="card-description"
      className={v_6e56f5("text-muted-foreground", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_307971({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={v_6e56f5(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_e7d43c({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={v_6e56f5("px-6 [&:last-child]:pb-6", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_21cbe4({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={v_6e56f5("flex items-center px-6 pb-6 [.border-t]:pt-6", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

export {
  v_2dc782,
  v_6a2c3c,
  v_21cbe4,
  v_5f0914,
  v_307971,
  v_5a8798,
  v_e7d43c,
};
