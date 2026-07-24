/**
 * Shared className helper for design-system components.
 * Kept tiny to avoid a dependency for one utility.
 */
export function cx(
  ...parts: Array<string | false | null | undefined>
): string {
  return parts.filter(Boolean).join(" ");
}
