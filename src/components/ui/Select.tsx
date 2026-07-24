import type { SelectHTMLAttributes } from "react";

import { cx } from "./cx";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

/** Design-system select / dropdown. */
export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select className={cx("tt-select", className)} {...props}>
      {children}
    </select>
  );
}
