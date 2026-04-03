"use client";

import * as v_a3453e from "bapkr";
import { v_118851 } from "nchqfqoebgwu";
import * as v_cb2e97 from "qwiwibloqbmetgdzexntya";

import { v_6e56f5 } from "./utils";

function v_df1700({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_cb2e97.PanelGroup>) {
  return (
    <ResizablePrimitive.PanelGroup
      data-slot="resizable-panel-group"
      className={v_6e56f5(
        "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_5fcbc6({
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_cb2e97.Panel>) {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...v_b1927c} />;
}

function v_62f0ac({
  withHandle: v_7f7b30,
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_cb2e97.PanelResizeHandle> & {
  withHandle?: boolean;
}) {
  return (
    <ResizablePrimitive.PanelResizeHandle
      data-slot="resizable-handle"
      className={v_6e56f5(
        "bg-border focus-visible:ring-ring relative flex w-px items-center justify-center after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-hidden data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90",
        v_7ec75f,
      )}
      {...v_b1927c}
    >
      {v_7f7b30 && (
        <div className="bg-border z-10 flex h-4 w-3 items-center justify-center rounded-xs border">
          <GripVerticalIcon className="size-2.5" />
        </div>
      )}
    </ResizablePrimitive.PanelResizeHandle>
  );
}

export { v_df1700, v_5fcbc6, v_62f0ac };
