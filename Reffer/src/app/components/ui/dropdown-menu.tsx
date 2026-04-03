"use client";

import * as v_a3453e from "bapkr";
import * as v_8924b8 from "defsnidxfgvxweaicoamuocckkmaf";
import { v_491a35, v_05c375, v_1a2bbc } from "nchqfqoebgwu";

import { v_6e56f5 } from "./utils";

function v_3735f5({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_8924b8.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...v_b1927c} />;
}

function v_2ecca9({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_8924b8.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...v_b1927c} />
  );
}

function v_997ff1({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_8924b8.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...v_b1927c}
    />
  );
}

function v_414a95({
  className: v_7ec75f,
  sideOffset: v_050cd7 = 4,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_8924b8.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={v_050cd7}
        className={v_6e56f5(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
          v_7ec75f,
        )}
        {...v_b1927c}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

function v_042282({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_8924b8.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...v_b1927c} />
  );
}

function v_8ca8b9({
  className: v_7ec75f,
  inset: v_490104,
  variant: v_46e192 = "default",
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_8924b8.Item> & {
  inset?: boolean;
  variant?: "default" | "destructive";
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
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

function v_71782d({
  className: v_7ec75f,
  children: v_21f619,
  checked: v_da90dc,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_8924b8.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={v_6e56f5(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        v_7ec75f,
      )}
      checked={v_da90dc}
      {...v_b1927c}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {v_21f619}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

function v_d5d27f({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_8924b8.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...v_b1927c}
    />
  );
}

function v_3708d2({
  className: v_7ec75f,
  children: v_21f619,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_8924b8.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={v_6e56f5(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        v_7ec75f,
      )}
      {...v_b1927c}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {v_21f619}
    </DropdownMenuPrimitive.RadioItem>
  );
}

function v_d94522({
  className: v_7ec75f,
  inset: v_490104,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_8924b8.Label> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={v_490104}
      className={v_6e56f5(
        "px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_1aa2fc({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_8924b8.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={v_6e56f5("bg-border -mx-1 my-1 h-px", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_d207fe({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={v_6e56f5(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_a72d59({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_8924b8.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...v_b1927c} />;
}

function v_5ad8f9({
  className: v_7ec75f,
  inset: v_490104,
  children: v_21f619,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_8924b8.SubTrigger> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={v_490104}
      className={v_6e56f5(
        "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[inset]:pl-8",
        v_7ec75f,
      )}
      {...v_b1927c}
    >
      {v_21f619}
      <ChevronRightIcon className="ml-auto size-4" />
    </DropdownMenuPrimitive.SubTrigger>
  );
}

function v_b3e851({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_8924b8.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      className={v_6e56f5(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-lg",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

export {
  v_3735f5,
  v_2ecca9,
  v_997ff1,
  v_414a95,
  v_042282,
  v_d94522,
  v_8ca8b9,
  v_71782d,
  v_d5d27f,
  v_3708d2,
  v_1aa2fc,
  v_d207fe,
  v_a72d59,
  v_5ad8f9,
  v_b3e851,
};
