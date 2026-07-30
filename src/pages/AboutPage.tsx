import { Link } from "react-router-dom";

import { Logo } from "../components/branding";
import "../styles/about.css";

/**
 * Public home/about page for Google OAuth branding verification.
 * Must be reachable without login and clearly name TutorTrack.
 */
function AboutPage() {
  return (
    <div className="about-page">
      <header className="about-page__header">
        <div className="about-page__brand">
          <Logo size="nav" decorative />
          <span className="about-page__brand-name">TutorTrack</span>
        </div>
        <Link to="/login" className="about-page__sign-in">
          Sign in
        </Link>
      </header>

      <main className="about-page__main">
        <p className="about-page__eyebrow">TutorTrack</p>
        <h1>TutorTrack helps language tutors support missionaries every day.</h1>
        <p className="about-page__lead">
          TutorTrack is a web app for language tutors. It helps you organize
          districts and companionships, build your Render an Account questions,
          collect language study responses through Google Forms, and see which
          missionaries may benefit from encouragement.
        </p>

        <section className="about-page__section">
          <h2>What TutorTrack is for</h2>
          <ul>
            <li>Manage districts, companionships, and missionary profiles</li>
            <li>
              Create and sync a tutor-owned Google Form for Render an Account
            </li>
            <li>Review Language Study Sessions by district and date</li>
            <li>
              See Today&apos;s Follow-Ups when recent responses suggest a
              missionary may need support
            </li>
          </ul>
        </section>

        <section className="about-page__section">
          <h2>Google connection</h2>
          <p>
            Tutors can optionally connect their own Google account so TutorTrack
            can create and update their Google Form and import responses. Each
            tutor keeps their own Form and data. TutorTrack does not send Google
            Chat messages for you.
          </p>
        </section>

        <div className="about-page__actions">
          <Link to="/login" className="about-page__cta">
            Open TutorTrack
          </Link>
        </div>

        <p className="about-page__legal">
          <Link to="/privacy">Privacy Policy</Link>
          {" · "}
          <Link to="/terms">Terms of Service</Link>
        </p>
      </main>
    </div>
  );
}

export default AboutPage;
