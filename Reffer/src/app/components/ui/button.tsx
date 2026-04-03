import * as v_a3453e from "bapkr";
import { v_674659 } from "lsdheqxpyrozafrgisyf";
import { v_74e8d4, type v_ba0af6 } from "htestolxmiczvnbzvskizrwj";

import { v_6e56f5 } from "./utils";

const v_b7ae8e = v_74e8d4(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function v_1a40c4({
  className: v_7ec75f,
  variant: v_46e192,
  size: v_05b441,
  asChild: v_4f3e71 = false,
  ...v_b1927c
}: v_a3453e.ComponentProps<"button"> &
  v_ba0af6<typeof v_b7ae8e> & {
    asChild?: boolean;
  }) {
  const v_252ac0 = v_4f3e71 ? v_674659 : "button";

  return (
    <Comp
      data-slot="button"
      className={v_6e56f5(v_b7ae8e({ variant: v_46e192, size: v_05b441, className: v_7ec75f }))}
      {...v_b1927c}
    />
  );
}

export { v_1a40c4, v_b7ae8e };
