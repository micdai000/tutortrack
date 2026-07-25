import {
  useLayoutEffect,
  useRef,
  type ChangeEvent,
  type TextareaHTMLAttributes,
} from "react";

import { cx } from "../ui/cx";

type AutoResizeTextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "rows"
> & {
  /** Minimum visible lines when content is short. */
  minRows?: number;
};

function resizeTextarea(element: HTMLTextAreaElement, minRows: number) {
  const styles = window.getComputedStyle(element);
  const lineHeight = Number.parseFloat(styles.lineHeight) || 24;
  const paddingTop = Number.parseFloat(styles.paddingTop) || 0;
  const paddingBottom = Number.parseFloat(styles.paddingBottom) || 0;
  const borderTop = Number.parseFloat(styles.borderTopWidth) || 0;
  const borderBottom = Number.parseFloat(styles.borderBottomWidth) || 0;
  const minHeight =
    lineHeight * minRows + paddingTop + paddingBottom + borderTop + borderBottom;

  element.style.height = "0px";
  const nextHeight = Math.max(element.scrollHeight, minHeight);
  element.style.height = `${nextHeight}px`;
}

/**
 * Presentation-only auto-growing textarea.
 * Does not change save behavior — callers still use normal onChange.
 */
export function AutoResizeTextarea({
  minRows = 3,
  className,
  value,
  onChange,
  ...props
}: AutoResizeTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    if (ref.current) {
      resizeTextarea(ref.current, minRows);
    }
  }, [value, minRows]);

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    resizeTextarea(event.currentTarget, minRows);
    onChange?.(event);
  }

  return (
    <textarea
      {...props}
      ref={ref}
      value={value}
      rows={minRows}
      onChange={handleChange}
      className={cx("missionary-autoresize", className)}
    />
  );
}
