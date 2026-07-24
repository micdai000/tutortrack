import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cx } from "./cx";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconOnly?: boolean;
  children?: ReactNode;
};

/** Design-system button. Prefer this over ad-hoc button classes in future UI. */
export function Button({
  variant = "primary",
  size = "md",
  iconOnly = false,
  className,
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        "tt-button",
        `tt-button--${variant}`,
        size !== "md" && `tt-button--${size}`,
        iconOnly && "tt-button--icon",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
