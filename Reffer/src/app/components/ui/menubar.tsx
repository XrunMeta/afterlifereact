"use client";

import * as v_a3453e from "bapkr";
import * as v_8a8971 from "zpdwmhuflychtzsabmksrej";
import { v_491a35, v_05c375, v_1a2bbc } from "nchqfqoebgwu";

import { v_6e56f5 } from "./utils";

function v_63f47f({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_8a8971.Root>) {
  return (
    <MenubarPrimitive.Root
      data-slot="menubar"
      className={v_6e56f5(
        "bg-background flex h-9 items-center gap-1 rounded-md border p-1 shadow-xs",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_aed4b7({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_8a8971.Menu>) {
  return <MenubarPrimitive.Menu data-slot="menubar-menu" {...v_b1927c} />;
}

function v_e3945b({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_8a8971.Group>) {
  return <MenubarPrimitive.Group data-slot="menubar-group" {...v_b1927c} />;
}

function v_eaee76({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_8a8971.Portal>) {
  return <MenubarPrimitive.Portal data-slot="menubar-portal" {...v_b1927c} />;
}

function v_882508({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_8a8971.RadioGroup>) {
  return (
    <MenubarPrimitive.RadioGroup data-slot="menubar-radio-group" {...v_b1927c} />
  );
}

function v_bfcf10({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_8a8971.Trigger>) {
  return (
    <MenubarPrimitive.Trigger
      data-slot="menubar-trigger"
      className={v_6e56f5(
        "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex items-center rounded-sm px-2 py-1 text-sm font-medium outline-hidden select-none",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_74a3b3({
  className: v_7ec75f,
  align: v_de6e51 = "start",
  alignOffset: v_c3d735 = -4,
  sideOffset: v_050cd7 = 8,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_8a8971.Content>) {
  return (
    <MenubarPortal>
      <MenubarPrimitive.Content
        data-slot="menubar-content"
        align={v_de6e51}
        alignOffset={v_c3d735}
        sideOffset={v_050cd7}
        className={v_6e56f5(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[12rem] origin-(--radix-menubar-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-md",
          v_7ec75f,
        )}
        {...v_b1927c}
      />
    </MenubarPortal>
  );
}

function v_094b04({
  className: v_7ec75f,
  inset: v_490104,
  variant: v_46e192 = "default",
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_8a8971.Item> & {
  inset?: boolean;
  variant?: "default" | "destructive";
}) {
  return (
    <MenubarPrimitive.Item
      data-slot="menubar-item"
      data-inset={v_490104}
      data-variant={v_46e192}
      className={v_6e56f5(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_cf0cbd({
  className: v_7ec75f,
  children: v_21f619,
  checked: v_da90dc,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_8a8971.CheckboxItem>) {
  return (
    <MenubarPrimitive.CheckboxItem
      data-slot="menubar-checkbox-item"
      className={v_6e56f5(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-xs py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        v_7ec75f,
      )}
      checked={v_da90dc}
      {...v_b1927c}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <MenubarPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {v_21f619}
    </MenubarPrimitive.CheckboxItem>
  );
}

function v_03cf4f({
  className: v_7ec75f,
  children: v_21f619,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_8a8971.RadioItem>) {
  return (
    <MenubarPrimitive.RadioItem
      data-slot="menubar-radio-item"
      className={v_6e56f5(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-xs py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        v_7ec75f,
      )}
      {...v_b1927c}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <MenubarPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {v_21f619}
    </MenubarPrimitive.RadioItem>
  );
}

function v_8e9c24({
  className: v_7ec75f,
  inset: v_490104,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_8a8971.Label> & {
  inset?: boolean;
}) {
  return (
    <MenubarPrimitive.Label
      data-slot="menubar-label"
      data-inset={v_490104}
      className={v_6e56f5(
        "px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_c763aa({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_8a8971.Separator>) {
  return (
    <MenubarPrimitive.Separator
      data-slot="menubar-separator"
      className={v_6e56f5("bg-border -mx-1 my-1 h-px", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_055f0a({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<"span">) {
  return (
    <span
      data-slot="menubar-shortcut"
      className={v_6e56f5(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_770233({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_8a8971.Sub>) {
  return <MenubarPrimitive.Sub data-slot="menubar-sub" {...v_b1927c} />;
}

function v_c25a81({
  className: v_7ec75f,
  inset: v_490104,
  children: v_21f619,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_8a8971.SubTrigger> & {
  inset?: boolean;
}) {
  return (
    <MenubarPrimitive.SubTrigger
      data-slot="menubar-sub-trigger"
      data-inset={v_490104}
      className={v_6e56f5(
        "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-none select-none data-[inset]:pl-8",
        v_7ec75f,
      )}
      {...v_b1927c}
    >
      {v_21f619}
      <ChevronRightIcon className="ml-auto h-4 w-4" />
    </MenubarPrimitive.SubTrigger>
  );
}

function v_e7ce6c({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_8a8971.SubContent>) {
  return (
    <MenubarPrimitive.SubContent
      data-slot="menubar-sub-content"
      className={v_6e56f5(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--radix-menubar-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-lg",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

export {
  v_63f47f,
  v_eaee76,
  v_aed4b7,
  v_bfcf10,
  v_74a3b3,
  v_e3945b,
  v_c763aa,
  v_8e9c24,
  v_094b04,
  v_055f0a,
  v_cf0cbd,
  v_882508,
  v_03cf4f,
  v_770233,
  v_c25a81,
  v_e7ce6c,
};
