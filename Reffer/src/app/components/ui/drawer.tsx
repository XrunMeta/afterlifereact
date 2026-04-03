"use client";

import * as v_a3453e from "bapkr";
import { v_0b94dd as v_a02047 } from "oqkl";

import { v_6e56f5 } from "./utils";

function v_0b94dd({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_a02047.Root>) {
  return <DrawerPrimitive.Root data-slot="drawer" {...v_b1927c} />;
}

function v_46db1c({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_a02047.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...v_b1927c} />;
}

function v_19599b({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_a02047.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...v_b1927c} />;
}

function v_20ce0d({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_a02047.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...v_b1927c} />;
}

function v_52e355({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_a02047.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={v_6e56f5(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_cdffe6({
  className: v_7ec75f,
  children: v_21f619,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_a02047.Content>) {
  return (
    <DrawerPortal data-slot="drawer-portal">
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={v_6e56f5(
          "group/drawer-content bg-background fixed z-50 flex h-auto flex-col",
          "data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:rounded-b-lg data-[vaul-drawer-direction=top]:border-b",
          "data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-t-lg data-[vaul-drawer-direction=bottom]:border-t",
          "data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:sm:max-w-sm",
          "data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:sm:max-w-sm",
          v_7ec75f,
        )}
        {...v_b1927c}
      >
        <div className="bg-muted mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
        {v_21f619}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
}

function v_ede2ee({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={v_6e56f5("flex flex-col gap-1.5 p-4", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_c44b71({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={v_6e56f5("mt-auto flex flex-col gap-2 p-4", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_835f79({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_a02047.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={v_6e56f5("text-foreground font-semibold", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_087467({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_a02047.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={v_6e56f5("text-muted-foreground text-sm", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

export {
  v_0b94dd,
  v_19599b,
  v_52e355,
  v_46db1c,
  v_20ce0d,
  v_cdffe6,
  v_ede2ee,
  v_c44b71,
  v_835f79,
  v_087467,
};
