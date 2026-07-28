import { forwardRef, type TextareaHTMLAttributes } from "react";

import { cx } from "./cx";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

/** Design-system textarea. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea ref={ref} className={cx("tt-textarea", className)} {...props} />
    );
  }
);
