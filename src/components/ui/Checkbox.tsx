import type { InputHTMLAttributes, ReactNode } from "react";

import { cx } from "./cx";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: ReactNode;
};

/** Design-system checkbox with label. */
export function Checkbox({ label, className, id, ...props }: CheckboxProps) {
  return (
    <label className={cx("tt-checkbox", className)} htmlFor={id}>
      <input id={id} type="checkbox" {...props} />
      <span>{label}</span>
    </label>
  );
}
