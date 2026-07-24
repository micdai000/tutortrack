import type { HTMLAttributes, ReactNode } from "react";

import { cx } from "./cx";
import { Label } from "./Label";

type FieldProps = HTMLAttributes<HTMLDivElement> & {
  label?: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
};

/** Groups label + control + hint/error with consistent form spacing. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
  ...props
}: FieldProps) {
  return (
    <div className={cx("tt-field", className)} {...props}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {hint && !error && <p className="tt-hint">{hint}</p>}
      {error && (
        <p className="tt-form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
