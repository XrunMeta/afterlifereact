"use client";

import * as v_a3453e from "bapkr";
import * as v_f7e504 from "cblddwrhchbgmntkuwnmba";
import { v_c13621 } from "nchqfqoebgwu";

import { v_6e56f5 } from "./utils";

function v_c2fdd1({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_f7e504.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...v_b1927c} />;
}

function v_d49c66({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_f7e504.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...v_b1927c} />;
}

function v_994fd8({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_f7e504.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...v_b1927c} />;
}

function v_c30558({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_f7e504.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...v_b1927c} />;
}

function v_7c95f4({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_f7e504.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={v_6e56f5(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_1efbac({
  className: v_7ec75f,
  children: v_21f619,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_f7e504.Content>) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={v_6e56f5(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          v_7ec75f,
        )}
        {...v_b1927c}
      >
        {v_21f619}
        <DialogPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
          <XIcon />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function v_bdaafa({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={v_6e56f5("flex flex-col gap-2 text-center sm:text-left", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_c5451b({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={v_6e56f5(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_8c709b({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_f7e504.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={v_6e56f5("text-lg leading-none font-semibold", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_0c1bc0({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_f7e504.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={v_6e56f5("text-muted-foreground text-sm", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

export {
  v_c2fdd1,
  v_c30558,
  v_1efbac,
  v_0c1bc0,
  v_c5451b,
  v_bdaafa,
  v_7c95f4,
  v_994fd8,
  v_8c709b,
  v_d49c66,
};
