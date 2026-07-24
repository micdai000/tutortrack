import type { TextareaHTMLAttributes } from "react";

import { cx } from "./cx";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

/** Design-system textarea. */
export function Textarea({ className, ...props }: TextareaProps) {
  return <textarea className={cx("tt-textarea", className)} {...props} />;
}
