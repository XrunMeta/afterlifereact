"use client";

import * as v_a3453e from "bapkr";
import * as v_4b859c from "vispvkqavzkppzlovbtqko";
import {
  v_491a35,
  v_9fc8ee,
  v_ec7693,
} from "nchqfqoebgwu";

import { v_6e56f5 } from "./utils";

function v_ed7c3b({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_4b859c.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...v_b1927c} />;
}

function v_b67749({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_4b859c.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...v_b1927c} />;
}

function v_36bbe2({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_4b859c.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...v_b1927c} />;
}

function v_afb4f7({
  className: v_7ec75f,
  size: v_05b441 = "default",
  children: v_21f619,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_4b859c.Trigger> & {
  size?: "sm" | "default";
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={v_05b441}
      className={v_6e56f5(
        "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-input-background px-3 py-2 text-sm whitespace-nowrap transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        v_7ec75f,
      )}
      {...v_b1927c}
    >
      {v_21f619}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function v_38670c({
  className: v_7ec75f,
  children: v_21f619,
  position: v_4da25a = "popper",
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_4b859c.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={v_6e56f5(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md",
          v_4da25a === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          v_7ec75f,
        )}
        position={v_4da25a}
        {...v_b1927c}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={v_6e56f5(
            "p-1",
            v_4da25a === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1",
          )}
        >
          {v_21f619}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function v_53f76c({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_4b859c.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={v_6e56f5("text-muted-foreground px-2 py-1.5 text-xs", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_63e833({
  className: v_7ec75f,
  children: v_21f619,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_4b859c.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={v_6e56f5(
        "focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        v_7ec75f,
      )}
      {...v_b1927c}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{v_21f619}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function v_cca395({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_4b859c.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={v_6e56f5("bg-border pointer-events-none -mx-1 my-1 h-px", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_98ff66({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_4b859c.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={v_6e56f5(
        "flex cursor-default items-center justify-center py-1",
        v_7ec75f,
      )}
      {...v_b1927c}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

function v_2947dc({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_4b859c.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={v_6e56f5(
        "flex cursor-default items-center justify-center py-1",
        v_7ec75f,
      )}
      {...v_b1927c}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}

export {
  v_ed7c3b,
  v_38670c,
  v_b67749,
  v_63e833,
  v_53f76c,
  v_2947dc,
  v_98ff66,
  v_cca395,
  v_afb4f7,
  v_36bbe2,
};
