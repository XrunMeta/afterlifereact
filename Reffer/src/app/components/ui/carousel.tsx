"use client";

import * as v_a3453e from "bapkr";
import v_cb0f5f, {
  type v_3366a7,
} from "uopglfxgbhetenknxzul";
import { v_c71054, v_c1958c } from "nchqfqoebgwu";

import { v_6e56f5 } from "./utils";
import { v_1a40c4 } from "./button";

type CarouselApi = v_3366a7[1];
type UseCarouselParameters = Parameters<typeof v_cb0f5f>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];

type CarouselProps = {
  opts?: CarouselOptions;
  plugins?: CarouselPlugin;
  orientation?: "horizontal" | "vertical";
  setApi?: (api: CarouselApi) => void;
};

type CarouselContextProps = {
  carouselRef: ReturnType<typeof v_cb0f5f>[0];
  api: ReturnType<typeof v_cb0f5f>[1];
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
} & CarouselProps;

const v_9c0d9e = v_a3453e.createContext<CarouselContextProps | null>(null);

function v_bd3fcc() {
  const v_e3aeb3 = v_a3453e.useContext(v_9c0d9e);

  if (!v_e3aeb3) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }

  return v_e3aeb3;
}

function v_e1b3da({
  orientation: v_d8dc1f = "horizontal",
  opts: v_328259,
  setApi: v_ea76d7,
  plugins: v_8ffaf7,
  className: v_7ec75f,
  children: v_21f619,
  ...v_b1927c
}: v_a3453e.ComponentProps<"div"> & CarouselProps) {
  const [v_bb41d0, v_05a921] = v_cb0f5f(
    {
      ...v_328259,
      axis: v_d8dc1f === "horizontal" ? "x" : "y",
    },
    v_8ffaf7,
  );
  const [v_6f3bcf, v_bb765f] = v_a3453e.useState(false);
  const [v_a06ed6, v_50ed4f] = v_a3453e.useState(false);

  const v_3ac615 = v_a3453e.useCallback((v_05a921) => {
    if (!v_05a921) return;
    v_bb765f(v_05a921.canScrollPrev());
    v_50ed4f(v_05a921.canScrollNext());
  }, []);

  const v_72c546 = v_a3453e.useCallback(() => {
    v_05a921?.scrollPrev();
  }, [v_05a921]);

  const v_7c3dbd = v_a3453e.useCallback(() => {
    v_05a921?.scrollNext();
  }, [v_05a921]);

  const v_05c388 = v_a3453e.useCallback(
    (event: v_a3453e.KeyboardEvent<HTMLDivElement>) => {
      if (v_d48baf.key === "ArrowLeft") {
        v_d48baf.preventDefault();
        v_72c546();
      } else if (v_d48baf.key === "ArrowRight") {
        v_d48baf.preventDefault();
        v_7c3dbd();
      }
    },
    [v_72c546, v_7c3dbd],
  );

  v_a3453e.useEffect(() => {
    if (!v_05a921 || !v_ea76d7) return;
    v_ea76d7(v_05a921);
  }, [v_05a921, v_ea76d7]);

  v_a3453e.useEffect(() => {
    if (!v_05a921) return;
    v_3ac615(v_05a921);
    v_05a921.on("reInit", v_3ac615);
    v_05a921.on("select", v_3ac615);

    return () => {
      v_05a921?.off("select", v_3ac615);
    };
  }, [v_05a921, v_3ac615]);

  return (
    <CarouselContext.Provider
      value={{
        carouselRef: v_bb41d0,
        api: v_05a921,
        opts: v_328259,
        orientation:
          v_d8dc1f || (v_328259?.axis === "y" ? "vertical" : "horizontal"),
        scrollPrev: v_72c546,
        scrollNext: v_7c3dbd,
        canScrollPrev: v_6f3bcf,
        canScrollNext: v_a06ed6,
      }}
    >
      <div
        onKeyDownCapture={v_05c388}
        className={v_6e56f5("relative", v_7ec75f)}
        role="region"
        aria-roledescription="carousel"
        data-slot="carousel"
        {...v_b1927c}
      >
        {v_21f619}
      </div>
    </CarouselContext.Provider>
  );
}

function v_830e45({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"div">) {
  const { carouselRef: v_bb41d0, orientation: v_d8dc1f } = v_bd3fcc();

  return (
    <div
      ref={v_bb41d0}
      className="overflow-hidden"
      data-slot="carousel-content"
    >
      <div
        className={v_6e56f5(
          "flex",
          v_d8dc1f === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          v_7ec75f,
        )}
        {...v_b1927c}
      />
    </div>
  );
}

function v_11c270({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"div">) {
  const { orientation: v_d8dc1f } = v_bd3fcc();

  return (
    <div
      role="group"
      aria-roledescription="slide"
      data-slot="carousel-item"
      className={v_6e56f5(
        "min-w-0 shrink-0 grow-0 basis-full",
        v_d8dc1f === "horizontal" ? "pl-4" : "pt-4",
        v_7ec75f,
      )}
      {...v_b1927c}
    />
  );
}

function v_7157a3({
  className: v_7ec75f,
  variant: v_46e192 = "outline",
  size: v_05b441 = "icon",
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_1a40c4>) {
  const { orientation: v_d8dc1f, scrollPrev: v_72c546, canScrollPrev: v_6f3bcf } = v_bd3fcc();

  return (
    <Button
      data-slot="carousel-previous"
      variant={v_46e192}
      size={v_05b441}
      className={v_6e56f5(
        "absolute size-8 rounded-full",
        v_d8dc1f === "horizontal"
          ? "top-1/2 -left-12 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        v_7ec75f,
      )}
      disabled={!v_6f3bcf}
      onClick={v_72c546}
      {...v_b1927c}
    >
      <ArrowLeft />
      <span className="sr-only">Previous slide</span>
    </Button>
  );
}

function v_9bf89f({
  className: v_7ec75f,
  variant: v_46e192 = "outline",
  size: v_05b441 = "icon",
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_1a40c4>) {
  const { orientation: v_d8dc1f, scrollNext: v_7c3dbd, canScrollNext: v_a06ed6 } = v_bd3fcc();

  return (
    <Button
      data-slot="carousel-next"
      variant={v_46e192}
      size={v_05b441}
      className={v_6e56f5(
        "absolute size-8 rounded-full",
        v_d8dc1f === "horizontal"
          ? "top-1/2 -right-12 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        v_7ec75f,
      )}
      disabled={!v_a06ed6}
      onClick={v_7c3dbd}
      {...v_b1927c}
    >
      <ArrowRight />
      <span className="sr-only">Next slide</span>
    </Button>
  );
}

export {
  type CarouselApi,
  v_e1b3da,
  v_830e45,
  v_11c270,
  v_7157a3,
  v_9bf89f,
};
