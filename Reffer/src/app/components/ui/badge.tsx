import * as v_a3453e from "bapkr";
import { v_674659 } from "lsdheqxpyrozafrgisyf";
import { v_74e8d4, type v_ba0af6 } from "htestolxmiczvnbzvskizrwj";

import { v_6e56f5 } from "./utils";

const v_f41369 = v_74e8d4(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function v_6185b9({
  className: v_7ec75f,
  variant: v_46e192,
  asChild: v_4f3e71 = false,
  ...v_b1927c
}: v_a3453e.ComponentProps<"span"> &
  v_ba0af6<typeof v_f41369> & { asChild?: boolean }) {
  const v_252ac0 = v_4f3e71 ? v_674659 : "span";

  return (
    <Comp
      data-slot="badge"
      className={v_6e56f5(v_f41369({ variant: v_46e192 }), v_7ec75f)}
      {...v_b1927c}
    />
  );
}

export { v_6185b9, v_f41369 };
