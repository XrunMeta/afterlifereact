"use client";

import * as v_a3453e from "bapkr";
import * as v_cad23f from "gsbvymwl";

import { v_6e56f5 } from "./utils";

const v_198980 = { light: "", dark: ".dark" } as const;

export type ChartConfig = {
  [k in string]: {
    label?: v_a3453e.ReactNode;
    icon?: v_a3453e.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof v_198980, string> }
  );
};

type ChartContextProps = {
  config: ChartConfig;
};

const v_85154c = v_a3453e.createContext<ChartContextProps | null>(null);

function v_ec880e() {
  const v_e3aeb3 = v_a3453e.useContext(v_85154c);

  if (!v_e3aeb3) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return v_e3aeb3;
}

function v_fa38b3({
  id: v_389afb,
  className: v_7ec75f,
  children: v_21f619,
  config: v_74a79c,
  ...v_b1927c
}: v_a3453e.ComponentProps<"div"> & {
  config: ChartConfig;
  children: v_a3453e.ComponentProps<
    typeof v_cad23f.ResponsiveContainer
  >["children"];
}) {
  const v_6c35f6 = v_a3453e.useId();
  const v_6e9287 = `chart-${v_389afb || v_6c35f6.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config: v_74a79c }}>
      <div
        data-slot="chart"
        data-chart={v_6e9287}
        className={v_6e56f5(
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border flex aspect-video justify-center text-xs [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
          v_7ec75f,
        )}
        {...v_b1927c}
      >
        <ChartStyle id={v_6e9287} config={v_74a79c} />
        <RechartsPrimitive.ResponsiveContainer>
          {v_21f619}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

const v_430bac = ({ id: v_389afb, config: v_74a79c }: { id: string; config: ChartConfig }) => {
  const v_ce49e4 = Object.entries(v_74a79c).filter(
    ([, v_74a79c]) => v_74a79c.theme || v_74a79c.color,
  );

  if (!v_ce49e4.length) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(v_198980)
          .map(
            ([v_4eaa1a, v_cd931c]) => `
${v_cd931c} [data-chart=${v_389afb}] {
${v_ce49e4
  .map(([v_b24339, v_0a59bb]) => {
    const v_3c2a3a =
      v_0a59bb.theme?.[v_4eaa1a as keyof typeof v_0a59bb.v_4eaa1a] ||
      v_0a59bb.color;
    return v_3c2a3a ? `  --color-${v_b24339}: ${v_3c2a3a};` : null;
  })
  .join("\n")}
}
`,
          )
          .join("\n"),
      }}
    />
  );
};

const v_39cada = v_cad23f.Tooltip;

function v_d499df({
  active: v_f8b770,
  payload: v_931bf0,
  className: v_7ec75f,
  indicator: v_4503e7 = "dot",
  hideLabel: v_6b48e4 = false,
  hideIndicator: v_175661 = false,
  label: v_2869c1,
  labelFormatter: v_ea07ed,
  labelClassName: v_3f400d,
  formatter: v_ed2c42,
  color: v_3c2a3a,
  nameKey: v_a1ac16,
  labelKey: v_34e186,
}: v_a3453e.ComponentProps<typeof v_cad23f.Tooltip> &
  v_a3453e.ComponentProps<"div"> & {
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: "line" | "dot" | "dashed";
    nameKey?: string;
    labelKey?: string;
  }) {
  const { config: v_74a79c } = v_ec880e();

  const v_6a207c = v_a3453e.useMemo(() => {
    if (v_6b48e4 || !v_931bf0?.length) {
      return null;
    }

    const [v_8c0b26] = v_931bf0;
    const v_b24339 = `${v_34e186 || v_8c0b26?.dataKey || v_8c0b26?.name || "value"}`;
    const v_0a59bb = v_611432(v_74a79c, v_8c0b26, v_b24339);
    const v_3b402b =
      !v_34e186 && typeof v_2869c1 === "string"
        ? v_74a79c[v_2869c1 as keyof typeof v_74a79c]?.label || v_2869c1
        : v_0a59bb?.label;

    if (v_ea07ed) {
      return (
        <div className={v_6e56f5("font-medium", v_3f400d)}>
          {v_ea07ed(v_3b402b, v_931bf0)}
        </div>
      );
    }

    if (!v_3b402b) {
      return null;
    }

    return <div className={v_6e56f5("font-medium", v_3f400d)}>{v_3b402b}</div>;
  }, [
    v_2869c1,
    v_ea07ed,
    v_931bf0,
    v_6b48e4,
    v_3f400d,
    v_74a79c,
    v_34e186,
  ]);

  if (!v_f8b770 || !v_931bf0?.length) {
    return null;
  }

  const v_2f9624 = v_931bf0.length === 1 && v_4503e7 !== "dot";

  return (
    <div
      className={v_6e56f5(
        "border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl",
        v_7ec75f,
      )}
    >
      {!v_2f9624 ? v_6a207c : null}
      <div className="grid gap-1.5">
        {v_931bf0.map((v_8c0b26, v_a56041) => {
          const v_b24339 = `${v_a1ac16 || v_8c0b26.name || v_8c0b26.dataKey || "value"}`;
          const v_0a59bb = v_611432(v_74a79c, v_8c0b26, v_b24339);
          const v_041c74 = v_3c2a3a || v_8c0b26.payload.fill || v_8c0b26.color;

          return (
            <div
              key={v_8c0b26.dataKey}
              className={v_6e56f5(
                "[&>svg]:text-muted-foreground flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5",
                v_4503e7 === "dot" && "items-center",
              )}
            >
              {v_ed2c42 && v_8c0b26?.value !== undefined && v_8c0b26.name ? (
                v_ed2c42(v_8c0b26.value, v_8c0b26.name, v_8c0b26, v_a56041, v_8c0b26.payload)
              ) : (
                <>
                  {v_0a59bb?.icon ? (
                    <itemConfig.icon />
                  ) : (
                    !v_175661 && (
                      <div
                        className={v_6e56f5(
                          "shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)",
                          {
                            "h-2.5 w-2.5": v_4503e7 === "dot",
                            "w-1": v_4503e7 === "line",
                            "w-0 border-[1.5px] border-dashed bg-transparent":
                              v_4503e7 === "dashed",
                            "my-0.5": v_2f9624 && v_4503e7 === "dashed",
                          },
                        )}
                        style={
                          {
                            "--color-bg": v_041c74,
                            "--color-border": v_041c74,
                          } as v_a3453e.CSSProperties
                        }
                      />
                    )
                  )}
                  <div
                    className={v_6e56f5(
                      "flex flex-1 justify-between leading-none",
                      v_2f9624 ? "items-end" : "items-center",
                    )}
                  >
                    <div className="grid gap-1.5">
                      {v_2f9624 ? v_6a207c : null}
                      <span className="text-muted-foreground">
                        {v_0a59bb?.label || v_8c0b26.name}
                      </span>
                    </div>
                    {v_8c0b26.value && (
                      <span className="text-foreground font-mono font-medium tabular-nums">
                        {v_8c0b26.value.toLocaleString()}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const v_4b2c9a = v_cad23f.Legend;

function v_9187a6({
  className: v_7ec75f,
  hideIcon: v_6fc226 = false,
  payload: v_931bf0,
  verticalAlign: v_b5ef28 = "bottom",
  nameKey: v_a1ac16,
}: v_a3453e.ComponentProps<"div"> &
  Pick<v_cad23f.LegendProps, "payload" | "verticalAlign"> & {
    hideIcon?: boolean;
    nameKey?: string;
  }) {
  const { config: v_74a79c } = v_ec880e();

  if (!v_931bf0?.length) {
    return null;
  }

  return (
    <div
      className={v_6e56f5(
        "flex items-center justify-center gap-4",
        v_b5ef28 === "top" ? "pb-3" : "pt-3",
        v_7ec75f,
      )}
    >
      {v_931bf0.map((v_8c0b26) => {
        const v_b24339 = `${v_a1ac16 || v_8c0b26.dataKey || "value"}`;
        const v_0a59bb = v_611432(v_74a79c, v_8c0b26, v_b24339);

        return (
          <div
            key={v_8c0b26.value}
            className={v_6e56f5(
              "[&>svg]:text-muted-foreground flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3",
            )}
          >
            {v_0a59bb?.icon && !v_6fc226 ? (
              <itemConfig.icon />
            ) : (
              <div
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{
                  backgroundColor: v_8c0b26.color,
                }}
              />
            )}
            {v_0a59bb?.label}
          </div>
        );
      })}
    </div>
  );
}

function v_611432(
  v_74a79c,
  v_931bf0,
  v_b24339,
) {
  if (typeof v_931bf0 !== "object" || v_931bf0 === null) {
    return undefined;
  }

  const v_7f9179 =
    "payload" in v_931bf0 &&
    typeof v_931bf0.payload === "object" &&
    v_931bf0.payload !== null
      ? v_931bf0.payload
      : undefined;

  let v_461248 = v_b24339;

  if (
    v_b24339 in v_931bf0 &&
    typeof v_931bf0[v_b24339 as keyof typeof v_931bf0] === "string"
  ) {
    v_461248 = v_931bf0[v_b24339 as keyof typeof v_931bf0] as string;
  } else if (
    v_7f9179 &&
    v_b24339 in v_7f9179 &&
    typeof v_7f9179[v_b24339 as keyof typeof v_7f9179] === "string"
  ) {
    v_461248 = v_7f9179[
      v_b24339 as keyof typeof v_7f9179
    ] as string;
  }

  return v_461248 in v_74a79c
    ? v_74a79c[v_461248]
    : v_74a79c[v_b24339 as keyof typeof v_74a79c];
}

export {
  v_fa38b3,
  v_39cada,
  v_d499df,
  v_4b2c9a,
  v_9187a6,
  v_430bac,
};
