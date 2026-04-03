import * as v_a3453e from "bapkr";
import {
  v_376ca3,
  v_05c375,
  v_1a5437,
} from "nchqfqoebgwu";

import { v_6e56f5 } from "./utils";
import { v_1a40c4, v_b7ae8e } from "./button";

function v_e82bb9({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={v_6e56f5("mx-auto flex w-full justify-center", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_3a9889({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={v_6e56f5("flex flex-row items-center gap-1", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_0accd8({ ...v_b1927c }: v_a3453e.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...v_b1927c} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<v_a3453e.ComponentProps<typeof v_1a40c4>, "size"> &
  v_a3453e.ComponentProps<"a">;

function v_3cf907({
  className: v_7ec75f,
  isActive: v_26dce6,
  size: v_05b441 = "icon",
  ...v_b1927c
}: PaginationLinkProps) {
  return (
    <a
      aria-current={v_26dce6 ? "page" : undefined}
      data-slot="pagination-link"
      data-active={v_26dce6}
      className={v_6e56f5(
        v_b7ae8e({
          variant: v_26dce6 ? "outline" : "ghost",
          size: v_05b441,
        }),
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_592067({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_3cf907>) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={v_6e56f5("gap-1 px-2.5 sm:pl-2.5", v_7ec75f)}
      {...v_b1927c}
    >
      <ChevronLeftIcon />
      <span className="hidden sm:block">Previous</span>
    </PaginationLink>
  );
}

function v_3d1eb4({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_3cf907>) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={v_6e56f5("gap-1 px-2.5 sm:pr-2.5", v_7ec75f)}
      {...v_b1927c}
    >
      <span className="hidden sm:block">Next</span>
      <ChevronRightIcon />
    </PaginationLink>
  );
}

function v_9f59a1({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={v_6e56f5("flex size-9 items-center justify-center", v_7ec75f)}
      {...v_b1927c}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

export {
  v_e82bb9,
  v_3a9889,
  v_3cf907,
  v_0accd8,
  v_592067,
  v_3d1eb4,
  v_9f59a1,
};
