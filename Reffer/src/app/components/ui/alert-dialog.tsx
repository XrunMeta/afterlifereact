"use client";

import * as v_a3453e from "bapkr";
import * as v_49a9e5 from "cfkvitathtoxzbfhsysqptybxwou";

import { v_6e56f5 } from "./utils";
import { v_b7ae8e } from "./button";

function v_e197f4({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_49a9e5.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...v_b1927c} />;
}

function v_3350bd({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_49a9e5.Trigger>) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...v_b1927c} />
  );
}

function v_30c957({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_49a9e5.Portal>) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...v_b1927c} />
  );
}

function v_e90851({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_49a9e5.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={v_6e56f5(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_a4195f({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_49a9e5.Content>) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        className={v_6e56f5(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          v_7ec75f,
        )}
        {...v_b1927c}
      />
    </AlertDialogPortal>
  );
}

function v_398792({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={v_6e56f5("flex flex-col gap-2 text-center sm:text-left", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_028a94({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={v_6e56f5(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_00cbff({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_49a9e5.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={v_6e56f5("text-lg font-semibold", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_5e4baf({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_49a9e5.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={v_6e56f5("text-muted-foreground text-sm", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_b39416({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_49a9e5.Action>) {
  return (
    <AlertDialogPrimitive.Action
      className={v_6e56f5(v_b7ae8e(), v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_7ed03a({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_49a9e5.Cancel>) {
  return (
    <AlertDialogPrimitive.Cancel
      className={v_6e56f5(v_b7ae8e({ variant: "outline" }), v_7ec75f)}
      {...v_b1927c}
    />
  );
}

export {
  v_e197f4,
  v_30c957,
  v_e90851,
  v_3350bd,
  v_a4195f,
  v_398792,
  v_028a94,
  v_00cbff,
  v_5e4baf,
  v_b39416,
  v_7ed03a,
};
