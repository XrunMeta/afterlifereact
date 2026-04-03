"use client";

import * as v_a3453e from "bapkr";
import * as v_b293ba from "oyizuhjuinmmbdwqcgzrkz";

import { v_6e56f5 } from "./utils";

function v_2e391c({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_b293ba.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={v_6e56f5(
        "relative flex size-10 shrink-0 overflow-hidden rounded-full",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_375968({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_b293ba.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={v_6e56f5("aspect-square size-full", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_40db37({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_b293ba.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={v_6e56f5(
        "bg-muted flex size-full items-center justify-center rounded-full",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

export { v_2e391c, v_375968, v_40db37 };
