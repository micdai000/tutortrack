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
        <h1>TutorTrack</h1>
        <p className="about-page__lead">
          TutorTrack is a web application for language tutors who support
          missionaries. Use TutorTrack to organize districts, collect Render an
          Account responses through Google Forms, review Language Study
          Sessions, and identify missionaries who may benefit from
          encouragement.
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

        <section className="about-page__section">
          <h2>Google account connection</h2>
          <p>
            Tutors may optionally connect their own Google account so TutorTrack
            can create and update their Google Form and import form responses.
            Each tutor uses their own Google Form and their own TutorTrack data.
          </p>
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
