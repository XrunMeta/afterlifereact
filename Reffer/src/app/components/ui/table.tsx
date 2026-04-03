"use client";

import * as v_a3453e from "bapkr";

import { v_6e56f5 } from "./utils";

function v_f49343({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={v_6e56f5("w-full caption-bottom text-sm", v_7ec75f)}
        {...v_b1927c}
      />
    </div>
  );
}

function v_d2d6b5({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={v_6e56f5("[&_tr]:border-b", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_9f19dd({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={v_6e56f5("[&_tr:last-child]:border-0", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_0bd720({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={v_6e56f5(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_cf8fa1({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={v_6e56f5(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_7e13be({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={v_6e56f5(
        "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_c9863d({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={v_6e56f5(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_ddcb2a({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={v_6e56f5("text-muted-foreground mt-4 text-sm", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

export {
  v_f49343,
  v_d2d6b5,
  v_9f19dd,
  v_0bd720,
  v_7e13be,
  v_cf8fa1,
  v_c9863d,
  v_ddcb2a,
};
