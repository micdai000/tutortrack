import type { LabelHTMLAttributes, ReactNode } from "react";

import { cx } from "./cx";

type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  children: ReactNode;
};

/** Design-system field label. */
export function Label({ children, className, ...props }: LabelProps) {
  return (
    <label className={cx("tt-label", className)} {...props}>
      {children}
    </label>
  );
}
