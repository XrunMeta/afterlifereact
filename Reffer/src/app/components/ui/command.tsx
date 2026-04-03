"use client";

import * as v_a3453e from "bapkr";
import { v_5acf9f as v_71d2ed } from "ifca";
import { v_4a199f } from "nchqfqoebgwu";

import { v_6e56f5 } from "./utils";
import {
  v_c2fdd1,
  v_1efbac,
  v_0c1bc0,
  v_bdaafa,
  v_8c709b,
} from "./dialog";

function v_5acf9f({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_71d2ed>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={v_6e56f5(
        "bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_3d8e8a({
  title: v_9f1622 = "Command Palette",
  description: v_6856a9 = "Search for a command to run...",
  children: v_21f619,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_c2fdd1> & {
  title?: string;
  description?: string;
}) {
  return (
    <Dialog {...v_b1927c}>
      <DialogHeader className="sr-only">
        <DialogTitle>{v_9f1622}</DialogTitle>
        <DialogDescription>{v_6856a9}</DialogDescription>
      </DialogHeader>
      <DialogContent className="overflow-hidden p-0">
        <Command className="[&_[cmdk-group-heading]]:text-muted-foreground **:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {v_21f619}
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function v_cfffe4({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_71d2ed.Input>) {
  return (
    <div
      data-slot="command-input-wrapper"
      className="flex h-9 items-center gap-2 border-b px-3"
    >
      <SearchIcon className="size-4 shrink-0 opacity-50" />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={v_6e56f5(
          "placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
          v_7ec75f,
        )}
        {...v_b1927c}
      />
    </div>
  );
}

function v_c64b37({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_71d2ed.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={v_6e56f5(
        "max-h-[300px] scroll-py-1 overflow-x-hidden overflow-y-auto",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_5201ec({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_71d2ed.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className="py-6 text-center text-sm"
      {...v_b1927c}
    />
  );
}

function v_962ce5({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_71d2ed.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={v_6e56f5(
        "text-foreground [&_[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_37930b({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_71d2ed.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={v_6e56f5("bg-border -mx-1 h-px", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_b8d64a({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_71d2ed.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={v_6e56f5(
        "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_7bb37b({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={v_6e56f5(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

export {
  v_5acf9f,
  v_3d8e8a,
  v_cfffe4,
  v_c64b37,
  v_5201ec,
  v_962ce5,
  v_b8d64a,
  v_7bb37b,
  v_37930b,
};
