import { Link } from "react-router-dom";

import { Logo } from "../components/branding";
import "../styles/legal.css";

/** Public terms of service for Google OAuth branding and tutors. */
function TermsOfServicePage() {
  return (
    <div className="legal-page">
      <header className="legal-page__header">
        <Link to="/" className="legal-page__brand" aria-label="TutorTrack home">
          <Logo />
        </Link>
      </header>

      <main className="legal-page__main">
        <h1>Terms of Service</h1>
        <p className="legal-page__updated">Last updated: July 30, 2026</p>

        <p>
          These Terms of Service (&quot;Terms&quot;) govern your use of
          TutorTrack. By creating an account or using TutorTrack, you agree to
          these Terms.
        </p>

        <h2>The service</h2>
        <p>
          TutorTrack is a web application that helps tutors manage missionary
          districts, companionships, Render an Account questions, Google Form
          connections, language study responses, and related follow-up
          workflows.
        </p>

        <h2>Accounts</h2>
        <p>
          You are responsible for maintaining the security of your TutorTrack
          account and for activity that occurs under your account. Provide
          accurate information and use the service only for lawful tutoring
          purposes.
        </p>

        <h2>Your content</h2>
        <p>
          You retain ownership of the tutoring content you enter into
          TutorTrack. You give us permission to host and process that content
          only as needed to provide the service.
        </p>

        <h2>Google connection</h2>
        <p>
          Connecting a Google account is optional. If you connect Google, you
          authorize TutorTrack to access Google services within the permissions
          you grant, such as creating and updating Forms and reading responses.
          You remain responsible for your Google account, form sharing, and what
          you send to missionaries.
        </p>

        <h2>Acceptable use</h2>
        <p>You agree not to misuse TutorTrack, including by attempting to:</p>
        <ul>
          <li>Access another tutor&apos;s workspace without permission</li>
          <li>Disrupt or reverse engineer the service</li>
          <li>Use the service for unlawful, harmful, or deceptive purposes</li>
        </ul>

        <h2>Availability</h2>
        <p>
          We aim to keep TutorTrack reliable, but we do not guarantee
          uninterrupted availability. Features that depend on Google may be
          affected by Google service changes or account permissions.
        </p>

        <h2>Disclaimer</h2>
        <p>
          TutorTrack is provided &quot;as is.&quot; Insight recommendations are
          intended to help tutors notice patterns that may warrant encouragement;
          they are not grades, evaluations, or professional counseling advice.
        </p>

        <h2>Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, TutorTrack and its operator
          are not liable for indirect, incidental, special, consequential, or
          punitive damages, or for loss of data, profits, or opportunities
          arising from your use of the service.
        </p>

        <h2>Termination</h2>
        <p>
          You may stop using TutorTrack at any time. We may suspend or end
          access if these Terms are violated or if needed to protect the service
          or other users.
        </p>

        <h2>Changes</h2>
        <p>
          We may update these Terms from time to time. Continued use after
          changes means you accept the updated Terms.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about these Terms:{" "}
          <a href="mailto:daimbd000@gmail.com">daimbd000@gmail.com</a>
        </p>

        <p className="legal-page__nav">
          <Link to="/">Back to TutorTrack</Link>
          {" · "}
          <Link to="/privacy">Privacy Policy</Link>
        </p>
      </main>
    </div>
  );
}

export default TermsOfServicePage;
