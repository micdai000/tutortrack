import type { ReactNode } from "react";

import { cx } from "../ui/cx";

type StatusBannerProps = {
  children: ReactNode;
  tone?: "success" | "error" | "info";
  role?: "status" | "alert";
};

/** Inline success / error / info banner under page headers. */
export function StatusBanner({
  children,
  tone = "info",
  role = "status",
}: StatusBannerProps) {
  return (
    <p
      className={cx("tt-status-banner", `tt-status-banner--${tone}`)}
      role={role}
    >
      {children}
    </p>
  );
}
