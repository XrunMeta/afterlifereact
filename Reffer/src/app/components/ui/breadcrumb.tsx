import * as v_a3453e from "bapkr";
import { v_674659 } from "lsdheqxpyrozafrgisyf";
import { v_6a6a7c, v_5b105c } from "nchqfqoebgwu";

import { v_6e56f5 } from "./utils";

function v_057167({ ...v_b1927c }: v_a3453e.ComponentProps<"nav">) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...v_b1927c} />;
}

function v_2da62a({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={v_6e56f5(
        "text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_2eff36({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={v_6e56f5("inline-flex items-center gap-1.5", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_337c8d({
  asChild: v_4f3e71,
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<"a"> & {
  asChild?: boolean;
}) {
  const v_252ac0 = v_4f3e71 ? v_674659 : "a";

  return (
    <Comp
      data-slot="breadcrumb-link"
      className={v_6e56f5("hover:text-foreground transition-colors", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_472259({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={v_6e56f5("text-foreground font-normal", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_80003e({
  children: v_21f619,
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={v_6e56f5("[&>svg]:size-3.5", v_7ec75f)}
      {...v_b1927c}
    >
      {v_21f619 ?? <ChevronRight />}
    </li>
  );
}

function v_c37113({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={v_6e56f5("flex size-9 items-center justify-center", v_7ec75f)}
      {...v_b1927c}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More</span>
    </span>
  );
}

export {
  v_057167,
  v_2da62a,
  v_2eff36,
  v_337c8d,
  v_472259,
  v_80003e,
  v_c37113,
};
