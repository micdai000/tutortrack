import { Brand } from "../branding";

type SidebarLogoProps = {
  expanded: boolean;
};

/** Sidebar brand lockup — mark only when collapsed; mark + wordmark when expanded. */
export function SidebarLogo({ expanded }: SidebarLogoProps) {
  return (
    <div className="tt-sidebar-logo">
      <Brand
        size="nav"
        tone="primary"
        logoOnly={!expanded}
        showWordmark={expanded}
      />
    </div>
  );
}
