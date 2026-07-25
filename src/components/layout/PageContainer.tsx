import type { HTMLAttributes, ReactNode } from "react";

import { cx } from "../ui/cx";

type PageContainerProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** Narrower reading column for Teacher Views. */
  variant?: "workspace" | "document";
};

/** Shared content column for authenticated workspace pages. */
export function PageContainer({
  children,
  variant = "workspace",
  className,
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cx(
        "tt-page-container",
        variant === "document" && "tt-page-container--document",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
