import { Brand } from "./Brand";

type BrandLoadingProps = {
  label?: string;
};

/** Minimal branded loading state — logo + subtle spinner. */
export function BrandLoading({
  label = "Loading...",
}: BrandLoadingProps) {
  return (
    <div className="tt-brand-loading" role="status" aria-live="polite">
      <Brand logoOnly size="nav" tone="primary" align="center" />
      <span className="tt-brand-loading__spinner" aria-hidden="true" />
      <span className="tt-brand-loading__label">{label}</span>
    </div>
  );
}
