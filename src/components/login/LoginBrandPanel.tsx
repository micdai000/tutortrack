/**
 * Brand identity panel for the login experience.
 * Decorative only — no auth or routing logic.
 */
export function LoginBrandPanel() {
  return (
    <aside className="login-brand-panel">
      <div className="login-brand-panel__geometry" aria-hidden="true">
        <span className="login-geo login-geo--ring" />
        <span className="login-geo login-geo--disc" />
        <span className="login-geo login-geo--line" />
        <span className="login-geo login-geo--square" />
      </div>

      <div className="login-brand-panel__content">
        <p className="login-brand-panel__mark">TutorTrack</p>
        <h2 className="login-brand-panel__headline">
          Helping tutors organize language learning.
        </h2>
        <p className="login-brand-panel__support">
          A calm workspace for tutors to manage language study plans & easily
          share them with teachers.
        </p>
      </div>
    </aside>
  );
}
