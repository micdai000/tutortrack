import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type BackLinkProps = {
  to: string;
  children: ReactNode;
};

/** Shared back-navigation link under the shell. */
export function BackLink({ to, children }: BackLinkProps) {
  return (
    <Link to={to} className="tt-back-link">
      {children}
    </Link>
  );
}
