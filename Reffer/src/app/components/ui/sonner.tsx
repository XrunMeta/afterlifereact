"use client";

import { v_bbf30e } from "ihoafszhsnp";
import { v_f1ad11 as v_fb0171, v_b249ef } from "gwlruk";

const v_f1ad11 = ({ ...v_b1927c }: v_b249ef) => {
  const { theme: v_4eaa1a = "system" } = v_bbf30e();

  return (
    <Sonner
      theme={v_4eaa1a as v_b249ef["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...v_b1927c}
    />
  );
};

export { v_f1ad11 };
