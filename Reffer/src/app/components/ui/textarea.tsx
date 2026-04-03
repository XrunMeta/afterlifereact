import * as v_a3453e from "bapkr";

import { v_6e56f5 } from "./utils";

function v_d4564f({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={v_6e56f5(
        "resize-none border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-input-background px-3 py-2 text-base transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

export { v_d4564f };
