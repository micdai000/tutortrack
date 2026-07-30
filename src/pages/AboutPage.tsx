import { useEffect } from "react";
import { Link } from "react-router-dom";

import { Logo } from "../components/branding";
import "../styles/about.css";

/**
 * Public home page for Google OAuth branding verification.
 * Must be public, name TutorTrack clearly, and explain the product purpose.
 */
function AboutPage() {
  useEffect(() => {
    document.title = "TutorTrack";
  }, []);

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
        <p className="about-page__eyebrow">Application name: TutorTrack</p>
        <h1>TutorTrack</h1>
        <p className="about-page__lead">
          TutorTrack is a web application for language tutors who support
          missionaries. The purpose of TutorTrack is to help tutors organize
          districts, collect Render an Account responses through Google Forms,
          review Language Study Sessions, and identify missionaries who may
          benefit from encouragement.
        </p>

        <section className="about-page__section">
          <h2>Purpose of TutorTrack</h2>
          <p>
            The purpose of TutorTrack is to help tutors run a simple daily
            language-study workflow: prepare questions, share one Google Form
            link, review missionary submissions, and follow up when recent
            responses suggest extra support may help.
          </p>
        </section>

        <section className="about-page__section">
          <h2>How TutorTrack uses Google user data</h2>
          <p>
            When a tutor chooses to connect their Google account, TutorTrack
            requests access so it can:
          </p>
          <ul>
            <li>
              Create and update a tutor-owned Google Form used for Render an
              Account
            </li>
            <li>
              Create and update a linked Google Sheet that stores form responses
            </li>
            <li>
              Install a small Apps Script trigger so new form submissions can be
              imported into TutorTrack
            </li>
            <li>
              Read form and spreadsheet data needed to show Language Study
              Sessions and follow-up insights inside TutorTrack
            </li>
          </ul>
          <p>
            TutorTrack uses this Google user data only to provide those tutoring
            features for the signed-in tutor. Each tutor connects their own
            Google account and works with their own Forms, Sheets, and
            TutorTrack data.
          </p>
        </section>

        <section className="about-page__section">
          <h2>What you can do in TutorTrack</h2>
          <ul>
            <li>Manage districts, companionships, and missionary profiles</li>
            <li>
              Create and sync a tutor-owned Google Form for Render an Account
            </li>
            <li>Review Language Study Sessions by district and date</li>
            <li>
              View Today&apos;s Follow-Ups based on recent Render an Account
              responses
            </li>
          </ul>
        </section>

        <div className="about-page__actions">
          <Link to="/login" className="about-page__cta">
            Sign in to TutorTrack
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
