import {
  useLayoutEffect,
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
  type TextareaHTMLAttributes,
} from "react";

import { cx } from "../ui/cx";

type AutoResizeTextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "rows"
> & {
  /** Minimum visible lines when content is short. */
  minRows?: number;
  /** Enable Enter-to-continue list behavior for -, *, •, and numbered lines. */
  enableBullets?: boolean;
};

const BULLET_LINE =
  /^(?<indent>[ \t]*)(?<marker>(?:[-*•]|\d+\.))(?<gap>[ \t]+)(?<text>.*)$/;

function resizeTextarea(element: HTMLTextAreaElement, minRows: number) {
  const styles = window.getComputedStyle(element);
  const lineHeight = Number.parseFloat(styles.lineHeight) || 24;
  const paddingTop = Number.parseFloat(styles.paddingTop) || 0;
  const paddingBottom = Number.parseFloat(styles.paddingBottom) || 0;
  const borderTop = Number.parseFloat(styles.borderTopWidth) || 0;
  const borderBottom = Number.parseFloat(styles.borderBottomWidth) || 0;
  const minHeight =
    lineHeight * minRows +
    paddingTop +
    paddingBottom +
    borderTop +
    borderBottom;

  element.style.height = "0px";
  const nextHeight = Math.max(element.scrollHeight, minHeight);
  element.style.height = `${nextHeight}px`;
}

function nextListMarker(marker: string): string {
  const numbered = marker.match(/^(\d+)\.$/);
  if (numbered) {
    return `${Number.parseInt(numbered[1], 10) + 1}.`;
  }
  // Normalize markdown markers to a real bullet on the next line.
  if (marker === "*" || marker === "-" || marker === "•") {
    return "•";
  }
  return marker;
}

/** Turn a freshly typed "* " or "- " at the start of a line into "• ". */
function convertTypedBulletPrefix(
  value: string,
  caret: number
): { value: string; caret: number } | null {
  const lineStart = value.lastIndexOf("\n", caret - 1) + 1;
  const prefix = value.slice(lineStart, caret);
  const match = prefix.match(/^([ \t]*)([*-]) $/);
  if (!match) return null;

  const indent = match[1];
  const replacement = `${indent}• `;
  return {
    value: value.slice(0, lineStart) + replacement + value.slice(caret),
    caret: lineStart + replacement.length,
  };
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
  onKeyDown,
  enableBullets = true,
  ...props
}: AutoResizeTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const pendingCaret = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (ref.current) {
      resizeTextarea(ref.current, minRows);
      if (pendingCaret.current !== null) {
        const caret = pendingCaret.current;
        pendingCaret.current = null;
        ref.current.focus();
        ref.current.setSelectionRange(caret, caret);
      }
    }
  }, [value, minRows]);

  function emitValue(nextValue: string, caret: number) {
    const element = ref.current;
    if (!element || !onChange) return;

    pendingCaret.current = caret;

    const descriptor = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value"
    );
    descriptor?.set?.call(element, nextValue);

    onChange({
      target: element,
      currentTarget: element,
    } as ChangeEvent<HTMLTextAreaElement>);
  }

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const element = event.currentTarget;
    resizeTextarea(element, minRows);

    if (enableBullets) {
      const converted = convertTypedBulletPrefix(
        element.value,
        element.selectionStart
      );
      if (converted) {
        emitValue(converted.value, converted.caret);
        return;
      }
    }

    onChange?.(event);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || !enableBullets) return;
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }

    const element = event.currentTarget;
    const current = element.value;
    const caret = element.selectionStart;
    if (caret !== element.selectionEnd) return;

    const lineStart = current.lastIndexOf("\n", caret - 1) + 1;
    const lineEnd = current.indexOf("\n", caret);
    const line =
      lineEnd === -1
        ? current.slice(lineStart)
        : current.slice(lineStart, lineEnd);
    const match = line.match(BULLET_LINE);
    if (!match?.groups) return;

    const { indent, marker, gap, text } = match.groups;
    event.preventDefault();

    // Empty bullet line → exit the list
    if (text.trim().length === 0) {
      const nextValue =
        current.slice(0, lineStart) +
        (lineEnd === -1 ? "" : current.slice(lineEnd + 1));
      emitValue(nextValue, lineStart);
      return;
    }

    const nextMarker = nextListMarker(marker);
    const insertion = `\n${indent}${nextMarker}${gap}`;
    emitValue(
      current.slice(0, caret) + insertion + current.slice(caret),
      caret + insertion.length
    );
  }

  return (
    <textarea
      {...props}
      ref={ref}
      value={value}
      rows={minRows}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      className={cx("missionary-autoresize", className)}
    />
  );
}
