"use client";

import * as v_a3453e from "bapkr";
import * as v_0719f6 from "vhupleryvjvdgzuydlrgtabti";
import { v_9fc8ee } from "nchqfqoebgwu";

import { v_6e56f5 } from "./utils";

function v_7305cf({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_0719f6.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...v_b1927c} />;
}

function v_30fd3b({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_0719f6.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={v_6e56f5("border-b last:border-b-0", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_66cb7d({
  className: v_7ec75f,
  children: v_21f619,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_0719f6.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={v_6e56f5(
          "focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180",
          v_7ec75f,
        )}
        {...v_b1927c}
      >
        {v_21f619}
        <ChevronDownIcon className="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function v_5a33c7({
  className: v_7ec75f,
  children: v_21f619,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_0719f6.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
      {...v_b1927c}
    >
      <div className={v_6e56f5("pt-0 pb-4", v_7ec75f)}>{v_21f619}</div>
    </AccordionPrimitive.Content>
  );
}

export { v_7305cf, v_30fd3b, v_66cb7d, v_5a33c7 };
