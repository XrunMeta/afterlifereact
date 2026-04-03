"use client";

import * as v_a3453e from "bapkr";
import { v_674659 } from "lsdheqxpyrozafrgisyf";
import { v_ba0af6, v_74e8d4 } from "htestolxmiczvnbzvskizrwj";
import { v_4f927a } from "nchqfqoebgwu";

import { v_6de0e0 } from "./use-mobile";
import { v_6e56f5 } from "./utils";
import { v_1a40c4 } from "./button";
import { v_1b353f } from "./input";
import { v_474c83 } from "./separator";
import {
  v_d88044,
  v_ce03ec,
  v_e3f982,
  v_ceaec0,
  v_0c23d4,
} from "./sheet";
import { v_af207a } from "./skeleton";
import {
  v_274201,
  v_f49b7b,
  v_29ed1f,
  v_934e9d,
} from "./tooltip";

const v_3dd187 = "sidebar_state";
const v_4ebd09 = 60 * 60 * 24 * 7;
const v_7a3013 = "16rem";
const v_30172c = "18rem";
const v_bb81b4 = "3rem";
const v_241e77 = "b";

type SidebarContextProps = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const v_ad5075 = v_a3453e.createContext<SidebarContextProps | null>(null);

function v_68f456() {
  const v_e3aeb3 = v_a3453e.useContext(v_ad5075);
  if (!v_e3aeb3) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }

  return v_e3aeb3;
}

function v_e0b14e({
  defaultOpen: v_b1b913 = true,
  open: v_32f4fc,
  onOpenChange: v_2d74ad,
  className: v_7ec75f,
  style: v_7fa4e4,
  children: v_21f619,
  ...v_b1927c
}: v_a3453e.ComponentProps<"div"> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const v_615017 = v_6de0e0();
  const [v_d0cb2e, v_96e43c] = v_a3453e.useState(false);

  const [v_2036b7, v_e35c1a] = v_a3453e.useState(v_b1b913);
  const v_207c31 = v_32f4fc ?? v_2036b7;
  const v_3cc8fd = v_a3453e.useCallback(
    (value: boolean | ((v_3b402b) => boolean)) => {
      const v_b9c72f = typeof v_3b402b === "function" ? v_3b402b(v_207c31) : v_3b402b;
      if (v_2d74ad) {
        v_2d74ad(v_b9c72f);
      } else {
        v_e35c1a(v_b9c72f);
      }

      document.cookie = `${v_3dd187}=${v_b9c72f}; path=/; max-age=${v_4ebd09}`;
    },
    [v_2d74ad, v_207c31],
  );

  const v_e48d67 = v_a3453e.useCallback(() => {
    return v_615017 ? v_96e43c((v_207c31) => !v_207c31) : v_3cc8fd((v_207c31) => !v_207c31);
  }, [v_615017, v_3cc8fd, v_96e43c]);

  v_a3453e.useEffect(() => {
    const v_05c388 = (v_d48baf) => {
      if (
        v_d48baf.key === v_241e77 &&
        (v_d48baf.metaKey || v_d48baf.ctrlKey)
      ) {
        v_d48baf.preventDefault();
        v_e48d67();
      }
    };

    window.addEventListener("keydown", v_05c388);
    return () => window.removeEventListener("keydown", v_05c388);
  }, [v_e48d67]);

  const v_b6e533 = v_207c31 ? "expanded" : "collapsed";

  const v_b17074 = v_a3453e.useMemo<SidebarContextProps>(
    () => ({
      state: v_b6e533,
      open: v_207c31,
      setOpen: v_3cc8fd,
      isMobile: v_615017,
      openMobile: v_d0cb2e,
      setOpenMobile: v_96e43c,
      toggleSidebar: v_e48d67,
    }),
    [v_b6e533, v_207c31, v_3cc8fd, v_615017, v_d0cb2e, v_96e43c, v_e48d67],
  );

  return (
    <SidebarContext.Provider value={v_b17074}>
      <TooltipProvider delayDuration={0}>
        <div
          data-slot="sidebar-wrapper"
          style={
            {
              "--sidebar-width": v_7a3013,
              "--sidebar-width-icon": v_bb81b4,
              ...v_7fa4e4,
            } as v_a3453e.CSSProperties
          }
          className={v_6e56f5(
            "group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full",
            v_7ec75f,
          )}
          {...v_b1927c}
        >
          {v_21f619}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  );
}

function v_0b553a({
  side: v_fceac7 = "left",
  variant: v_46e192 = "sidebar",
  collapsible: v_df449d = "offcanvas",
  className: v_7ec75f,
  children: v_21f619,
  ...v_b1927c
}: v_a3453e.ComponentProps<"div"> & {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
}) {
  const { isMobile: v_615017, state: v_b6e533, openMobile: v_d0cb2e, setOpenMobile: v_96e43c } = v_68f456();

  if (v_df449d === "none") {
    return (
      <div
        data-slot="sidebar"
        className={v_6e56f5(
          "bg-sidebar text-sidebar-foreground flex h-full w-(--sidebar-width) flex-col",
          v_7ec75f,
        )}
        {...v_b1927c}
      >
        {v_21f619}
      </div>
    );
  }

  if (v_615017) {
    return (
      <Sheet open={v_d0cb2e} onOpenChange={v_96e43c} {...v_b1927c}>
        <SheetContent
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className="bg-sidebar text-sidebar-foreground w-(--sidebar-width) p-0 [&>button]:hidden"
          style={
            {
              "--sidebar-width": v_30172c,
            } as v_a3453e.CSSProperties
          }
          side={v_fceac7}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{v_21f619}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      className="group peer text-sidebar-foreground hidden md:block"
      data-state={v_b6e533}
      data-collapsible={v_b6e533 === "collapsed" ? v_df449d : ""}
      data-variant={v_46e192}
      data-side={v_fceac7}
      data-slot="sidebar"
    >
      {}
      <div
        data-slot="sidebar-gap"
        className={v_6e56f5(
          "relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear",
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[side=right]:rotate-180",
          v_46e192 === "floating" || v_46e192 === "inset"
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
        )}
      />
      <div
        data-slot="sidebar-container"
        className={v_6e56f5(
          "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex",
          v_fceac7 === "left"
            ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
            : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",

          v_46e192 === "floating" || v_46e192 === "inset"
            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
          v_7ec75f,
        )}
        {...v_b1927c}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="bg-sidebar group-data-[variant=floating]:border-sidebar-border flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow-sm"
        >
          {v_21f619}
        </div>
      </div>
    </div>
  );
}

function v_dadb10({
  className: v_7ec75f,
  onClick: v_5fb36a,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_1a40c4>) {
  const { toggleSidebar: v_e48d67 } = v_68f456();

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      className={v_6e56f5("size-7", v_7ec75f)}
      onClick={(v_d48baf) => {
        v_5fb36a?.(v_d48baf);
        v_e48d67();
      }}
      {...v_b1927c}
    >
      <PanelLeftIcon />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}

function v_a5dad5({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"button">) {
  const { toggleSidebar: v_e48d67 } = v_68f456();

  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={v_e48d67}
      title="Toggle Sidebar"
      className={v_6e56f5(
        "hover:after:bg-sidebar-border absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] sm:flex",
        "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "hover:group-data-[collapsible=offcanvas]:bg-sidebar group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_196c67({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={v_6e56f5(
        "bg-background relative flex w-full flex-1 flex-col",
        "md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_5e6975({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_1b353f>) {
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={v_6e56f5("bg-background h-8 w-full shadow-none", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_795697({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={v_6e56f5("flex flex-col gap-2 p-2", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_df6412({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={v_6e56f5("flex flex-col gap-2 p-2", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_05df68({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_474c83>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={v_6e56f5("bg-sidebar-border mx-2 w-auto", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_80957a({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={v_6e56f5(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_38ddc4({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={v_6e56f5("relative flex w-full min-w-0 flex-col p-2", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_30b0ce({
  className: v_7ec75f,
  asChild: v_4f3e71 = false,
  ...v_b1927c
}: v_a3453e.ComponentProps<"div"> & { asChild?: boolean }) {
  const v_252ac0 = v_4f3e71 ? v_674659 : "div";

  return (
    <Comp
      data-slot="sidebar-group-label"
      data-sidebar="group-label"
      className={v_6e56f5(
        "text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_96a339({
  className: v_7ec75f,
  asChild: v_4f3e71 = false,
  ...v_b1927c
}: v_a3453e.ComponentProps<"button"> & { asChild?: boolean }) {
  const v_252ac0 = v_4f3e71 ? v_674659 : "button";

  return (
    <Comp
      data-slot="sidebar-group-action"
      data-sidebar="group-action"
      className={v_6e56f5(
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",

        "after:absolute after:-inset-2 md:after:hidden",
        "group-data-[collapsible=icon]:hidden",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_df7f2f({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={v_6e56f5("w-full text-sm", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_5deec6({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={v_6e56f5("flex w-full min-w-0 flex-col gap-1", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_80b5f0({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={v_6e56f5("group/menu-item relative", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

const v_4b0d53 = v_74e8d4(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:p-0!",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function v_e58ba1({
  asChild: v_4f3e71 = false,
  isActive: v_26dce6 = false,
  variant: v_46e192 = "default",
  size: v_05b441 = "default",
  tooltip: v_83105d,
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<"button"> & {
  asChild?: boolean;
  isActive?: boolean;
  tooltip?: string | v_a3453e.ComponentProps<typeof v_f49b7b>;
} & v_ba0af6<typeof v_4b0d53>) {
  const v_252ac0 = v_4f3e71 ? v_674659 : "button";
  const { isMobile: v_615017, state: v_b6e533 } = v_68f456();

  const v_0467a4 = (
    <Comp
      data-slot="sidebar-menu-button"
      data-sidebar="menu-button"
      data-size={v_05b441}
      data-active={v_26dce6}
      className={v_6e56f5(v_4b0d53({ variant: v_46e192, size: v_05b441 }), v_7ec75f)}
      {...v_b1927c}
    />
  );

  if (!v_83105d) {
    return v_0467a4;
  }

  if (typeof v_83105d === "string") {
    v_83105d = {
      children: v_83105d,
    };
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{v_0467a4}</TooltipTrigger>
      <TooltipContent
        side="right"
        align="center"
        hidden={v_b6e533 !== "collapsed" || v_615017}
        {...v_83105d}
      />
    </Tooltip>
  );
}

function v_181529({
  className: v_7ec75f,
  asChild: v_4f3e71 = false,
  showOnHover: v_f62cbc = false,
  ...v_b1927c
}: v_a3453e.ComponentProps<"button"> & {
  asChild?: boolean;
  showOnHover?: boolean;
}) {
  const v_252ac0 = v_4f3e71 ? v_674659 : "button";

  return (
    <Comp
      data-slot="sidebar-menu-action"
      data-sidebar="menu-action"
      className={v_6e56f5(
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground peer-hover/menu-button:text-sidebar-accent-foreground absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",

        "after:absolute after:-inset-2 md:after:hidden",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        v_f62cbc &&
          "peer-data-[active=true]/menu-button:text-sidebar-accent-foreground group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 md:opacity-0",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_d6f09e({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={v_6e56f5(
        "text-sidebar-foreground pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums select-none",
        "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_0cef27({
  className: v_7ec75f,
  showIcon: v_fa8880 = false,
  ...v_b1927c
}: v_a3453e.ComponentProps<"div"> & {
  showIcon?: boolean;
}) {

  const v_8e4fb6 = v_a3453e.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`;
  }, []);

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={v_6e56f5("flex h-8 items-center gap-2 rounded-md px-2", v_7ec75f)}
      {...v_b1927c}
    >
      {v_fa8880 && (
        <Skeleton
          className="size-4 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="h-4 max-w-(--skeleton-width) flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": v_8e4fb6,
          } as v_a3453e.CSSProperties
        }
      />
    </div>
  );
}

function v_b0872a({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={v_6e56f5(
        "border-sidebar-border mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l px-2.5 py-0.5",
        "group-data-[collapsible=icon]:hidden",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_4191d5({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={v_6e56f5("group/menu-sub-item relative", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_c35c61({
  asChild: v_4f3e71 = false,
  size: v_05b441 = "md",
  isActive: v_26dce6 = false,
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<"a"> & {
  asChild?: boolean;
  size?: "sm" | "md";
  isActive?: boolean;
}) {
  const v_252ac0 = v_4f3e71 ? v_674659 : "a";

  return (
    <Comp
      data-slot="sidebar-menu-sub-button"
      data-sidebar="menu-sub-button"
      data-size={v_05b441}
      data-active={v_26dce6}
      className={v_6e56f5(
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground [&>svg]:text-sidebar-accent-foreground flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 outline-hidden focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        v_05b441 === "sm" && "text-xs",
        v_05b441 === "md" && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

export {
  v_0b553a,
  v_80957a,
  v_df6412,
  v_38ddc4,
  v_96a339,
  v_df7f2f,
  v_30b0ce,
  v_795697,
  v_5e6975,
  v_196c67,
  v_5deec6,
  v_181529,
  v_d6f09e,
  v_e58ba1,
  v_80b5f0,
  v_0cef27,
  v_b0872a,
  v_c35c61,
  v_4191d5,
  v_e0b14e,
  v_a5dad5,
  v_05df68,
  v_dadb10,
  v_68f456,
};
