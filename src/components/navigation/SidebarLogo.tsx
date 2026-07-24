type SidebarLogoProps = {
  expanded: boolean;
};

/** Text-only TutorTrack wordmark — no icon. */
export function SidebarLogo({ expanded }: SidebarLogoProps) {
  return (
    <div className="tt-sidebar-logo" aria-label="TutorTrack">
      <span
        className={
          expanded
            ? "tt-sidebar-logo-wordmark tt-sidebar-logo-wordmark--expanded"
            : "tt-sidebar-logo-wordmark"
        }
      >
        {expanded ? "TutorTrack" : "TT"}
      </span>
    </div>
  );
}
