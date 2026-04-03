"use client";

import * as v_a3453e from "bapkr";
import * as v_a3ae47 from "cblddwrhchbgmntkuwnmba";
import { v_c13621 } from "nchqfqoebgwu";

import { v_6e56f5 } from "./utils";

function v_d88044({ ...v_b1927c }: v_a3453e.ComponentProps<typeof v_a3ae47.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...v_b1927c} />;
}

function v_2476e2({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_a3ae47.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...v_b1927c} />;
}

function v_b1b58f({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_a3ae47.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...v_b1927c} />;
}

function v_05cc84({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_a3ae47.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...v_b1927c} />;
}

function v_679819({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_a3ae47.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={v_6e56f5(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_ce03ec({
  className: v_7ec75f,
  children: v_21f619,
  side: v_fceac7 = "right",
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_a3ae47.Content> & {
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={v_6e56f5(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
          v_fceac7 === "right" &&
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
          v_fceac7 === "left" &&
            "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
          v_fceac7 === "top" &&
            "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b",
          v_fceac7 === "bottom" &&
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t",
          v_7ec75f,
        )}
        {...v_b1927c}
      >
        {v_21f619}
        <SheetPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

function v_ceaec0({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={v_6e56f5("flex flex-col gap-1.5 p-4", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_d49824({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={v_6e56f5("mt-auto flex flex-col gap-2 p-4", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_0c23d4({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_a3ae47.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={v_6e56f5("text-foreground font-semibold", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_e3f982({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_a3ae47.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={v_6e56f5("text-muted-foreground text-sm", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

export {
  v_d88044,
  v_2476e2,
  v_b1b58f,
  v_ce03ec,
  v_ceaec0,
  v_d49824,
  v_0c23d4,
  v_e3f982,
};
