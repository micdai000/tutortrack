import { Link } from "react-router-dom";

import { Logo } from "../components/branding";
import "../styles/legal.css";

/** Public privacy policy for Google OAuth verification and tutors. */
function PrivacyPolicyPage() {
  return (
    <div className="legal-page">
      <header className="legal-page__header">
        <Link to="/" className="legal-page__brand" aria-label="TutorTrack home">
          <Logo />
        </Link>
      </header>

      <main className="legal-page__main">
        <h1>Privacy Policy</h1>
        <p className="legal-page__updated">Last updated: July 30, 2026</p>

        <p>
          TutorTrack (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) helps language tutors
          organize missionary districts, companionships, language study
          questions, and Google Form responses. This Privacy Policy explains
          what information we collect and how we use it.
        </p>

        <h2>Information we collect</h2>
        <ul>
          <li>
            <strong>Account information.</strong> When you create a TutorTrack
            account, we collect your email address and authentication details
            needed to sign you in.
          </li>
          <li>
            <strong>Tutoring workspace data.</strong> Content you enter in
            TutorTrack, such as district names, missionary display names,
            companionships, Render an Account questions, notes, and related
            tutoring records.
          </li>
          <li>
            <strong>Google account connection (optional).</strong> If you
            connect Google, TutorTrack receives permission to create and manage
            Google Forms and related files in your Google account, and to
            receive form responses you choose to sync into TutorTrack. We store
            connection details such as your Google email and OAuth tokens needed
            to keep that connection working.
          </li>
          <li>
            <strong>Language study responses.</strong> When missionaries submit
            your Google Form, TutorTrack may store those responses and derived
            insight recommendations for your tutoring use.
          </li>
        </ul>

        <h2>How we use information</h2>
        <ul>
          <li>To provide and operate the TutorTrack service</li>
          <li>To authenticate tutors and secure their workspaces</li>
          <li>
            To create, update, and sync Google Forms and response data on your
            behalf when you connect Google
          </li>
          <li>
            To show Language Study Sessions, follow-up recommendations, and
            related tutoring workflows
          </li>
          <li>To improve reliability, security, and support</li>
        </ul>

        <h2>Google user data</h2>
        <p>
          If you connect Google, TutorTrack uses Google APIs only to provide the
          features you request inside TutorTrack (such as creating your Form,
          syncing questions, and importing responses). We do not sell Google
          user data. We do not use Google user data for advertising. Access is
          limited to what is needed for those tutoring features.
        </p>

        <h2>How we share information</h2>
        <p>
          We do not sell personal information. We may share information with
          service providers that help us run TutorTrack (for example, hosting
          and database providers), only as needed to operate the service. We may
          also disclose information if required by law.
        </p>

        <h2>Data storage and security</h2>
        <p>
          TutorTrack stores application data with industry-standard cloud
          providers and uses access controls so tutors generally only see their
          own workspace data. No method of transmission or storage is 100%
          secure, but we take reasonable steps to protect information.
        </p>

        <h2>Data retention</h2>
        <p>
          We retain account and workspace data while your account is active and
          as needed to provide the service. You may request deletion of your
          TutorTrack account data by contacting us. Disconnecting Google stops
          future Google access; previously imported responses may remain in your
          TutorTrack workspace until deleted.
        </p>

        <h2>Your choices</h2>
        <ul>
          <li>You can use TutorTrack without connecting Google</li>
          <li>
            You can disconnect Google from TutorTrack and revoke access in your
            Google Account permissions
          </li>
          <li>You can request support or deletion by emailing us</li>
        </ul>

        <h2>Children</h2>
        <p>
          TutorTrack is intended for adult tutors and language-study workflows.
          It is not directed to children under 13.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          We may update this Privacy Policy from time to time. The &quot;Last
          updated&quot; date at the top will change when we do.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about privacy:{" "}
          <a href="mailto:daimbd000@gmail.com">daimbd000@gmail.com</a>
        </p>

        <p className="legal-page__nav">
          <Link to="/">Back to TutorTrack</Link>
          {" · "}
          <Link to="/terms">Terms of Service</Link>
        </p>
      </main>
    </div>
  );
}

export default PrivacyPolicyPage;
