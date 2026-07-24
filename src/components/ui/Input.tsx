import type { InputHTMLAttributes } from "react";

import { cx } from "./cx";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

/** Design-system text input. */
export function Input({ className, ...props }: InputProps) {
  return <input className={cx("tt-input", className)} {...props} />;
}
