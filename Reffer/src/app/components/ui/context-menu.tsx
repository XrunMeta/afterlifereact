"use client";

import * as v_a3453e from "bapkr";
import * as v_b94523 from "vokzdvxwzmvmizhvciwhzdpucnzz";
import { v_491a35, v_05c375, v_1a2bbc } from "nchqfqoebgwu";

import { v_6e56f5 } from "./utils";

function v_25594b({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_b94523.Root>) {
  return <ContextMenuPrimitive.Root data-slot="context-menu" {...v_b1927c} />;
}

function v_20aebc({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_b94523.Trigger>) {
  return (
    <ContextMenuPrimitive.Trigger data-slot="context-menu-trigger" {...v_b1927c} />
  );
}

function v_6de73d({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_b94523.Group>) {
  return (
    <ContextMenuPrimitive.Group data-slot="context-menu-group" {...v_b1927c} />
  );
}

function v_983ac1({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_b94523.Portal>) {
  return (
    <ContextMenuPrimitive.Portal data-slot="context-menu-portal" {...v_b1927c} />
  );
}

function v_3d322d({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_b94523.Sub>) {
  return <ContextMenuPrimitive.Sub data-slot="context-menu-sub" {...v_b1927c} />;
}

function v_d72aa4({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_b94523.RadioGroup>) {
  return (
    <ContextMenuPrimitive.RadioGroup
      data-slot="context-menu-radio-group"
      {...v_b1927c}
    />
  );
}

function v_9b7e10({
  className: v_7ec75f,
  inset: v_490104,
  children: v_21f619,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_b94523.SubTrigger> & {
  inset?: boolean;
}) {
  return (
    <ContextMenuPrimitive.SubTrigger
      data-slot="context-menu-sub-trigger"
      data-inset={v_490104}
      className={v_6e56f5(
        "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        v_7ec75f,
      )}
      {...v_b1927c}
    >
      {v_21f619}
      <ChevronRightIcon className="ml-auto" />
    </ContextMenuPrimitive.SubTrigger>
  );
}

function v_abf400({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_b94523.SubContent>) {
  return (
    <ContextMenuPrimitive.SubContent
      data-slot="context-menu-sub-content"
      className={v_6e56f5(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--radix-context-menu-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-lg",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_a522eb({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_b94523.Content>) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        data-slot="context-menu-content"
        className={v_6e56f5(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-context-menu-content-available-height) min-w-[8rem] origin-(--radix-context-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
          v_7ec75f,
        )}
        {...v_b1927c}
      />
    </ContextMenuPrimitive.Portal>
  );
}

function v_fbd7b0({
  className: v_7ec75f,
  inset: v_490104,
  variant: v_46e192 = "default",
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_b94523.Item> & {
  inset?: boolean;
  variant?: "default" | "destructive";
}) {
  return (
    <ContextMenuPrimitive.Item
      data-slot="context-menu-item"
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

function v_488b9e({
  className: v_7ec75f,
  children: v_21f619,
  checked: v_da90dc,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_b94523.CheckboxItem>) {
  return (
    <ContextMenuPrimitive.CheckboxItem
      data-slot="context-menu-checkbox-item"
      className={v_6e56f5(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        v_7ec75f,
      )}
      checked={v_da90dc}
      {...v_b1927c}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <ContextMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {v_21f619}
    </ContextMenuPrimitive.CheckboxItem>
  );
}

function v_9bb6bc({
  className: v_7ec75f,
  children: v_21f619,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_b94523.RadioItem>) {
  return (
    <ContextMenuPrimitive.RadioItem
      data-slot="context-menu-radio-item"
      className={v_6e56f5(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        v_7ec75f,
      )}
      {...v_b1927c}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <ContextMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {v_21f619}
    </ContextMenuPrimitive.RadioItem>
  );
}

function v_aa5fac({
  className: v_7ec75f,
  inset: v_490104,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_b94523.Label> & {
  inset?: boolean;
}) {
  return (
    <ContextMenuPrimitive.Label
      data-slot="context-menu-label"
      data-inset={v_490104}
      className={v_6e56f5(
        "text-foreground px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_f104f2({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_b94523.Separator>) {
  return (
    <ContextMenuPrimitive.Separator
      data-slot="context-menu-separator"
      className={v_6e56f5("bg-border -mx-1 my-1 h-px", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_307714({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<"span">) {
  return (
    <span
      data-slot="context-menu-shortcut"
      className={v_6e56f5(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

export {
  v_25594b,
  v_20aebc,
  v_a522eb,
  v_fbd7b0,
  v_488b9e,
  v_9bb6bc,
  v_aa5fac,
  v_f104f2,
  v_307714,
  v_6de73d,
  v_983ac1,
  v_3d322d,
  v_abf400,
  v_9b7e10,
  v_d72aa4,
};
