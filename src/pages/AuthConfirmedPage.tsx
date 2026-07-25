import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../components/AuthProvider";
import { BrandLoading, Logo } from "../components/branding";
import { Button } from "../components/ui";
import { supabase } from "../lib/supabase";
import "../styles/auth-confirmed.css";

type ConfirmState = "loading" | "success" | "error";

/**
 * Landing page for email confirmation links.
 * Supabase redirects here after verify; detectSessionInUrl establishes the session.
 */
function AuthConfirmedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<ConfirmState>("loading");
  const [message, setMessage] = useState(
    "Confirming your email. This only takes a moment…"
  );

  useEffect(() => {
    let cancelled = false;

    async function finishConfirmation() {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(
        window.location.hash.replace(/^#/, "")
      );

      const errorDescription =
        params.get("error_description") ||
        hashParams.get("error_description") ||
        params.get("error") ||
        hashParams.get("error");

      if (errorDescription) {
        if (!cancelled) {
          setState("error");
          setMessage(
            decodeURIComponent(errorDescription.replace(/\+/g, " "))
          );
        }
        return;
      }

      // Give the Supabase client a beat to parse tokens from the URL.
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (cancelled) return;

      if (error) {
        setState("error");
        setMessage(
          error.message ||
            "We couldn’t confirm your email. Try signing in, or request a new confirmation email."
        );
        return;
      }

      // Clean sensitive tokens out of the address bar.
      window.history.replaceState({}, document.title, "/auth/confirmed");

      setState("success");
      setMessage(
        session
          ? "Your email is confirmed. Welcome to TutorTrack."
          : "Your email is confirmed. Sign in to open your workspace."
      );

      if (session) {
        window.setTimeout(() => {
          if (!cancelled) {
            void navigate("/dashboard", { replace: true });
          }
        }, 1400);
      }
    }

    void finishConfirmation();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (user && state === "success") {
    return <Navigate to="/dashboard" replace />;
  }

  if (state === "loading") {
    return <BrandLoading label={message} />;
  }

  return (
    <div className="auth-confirmed-page">
      <div className="auth-confirmed-card">
        <Logo size="login" />
        <h1 className="auth-confirmed-title">
          {state === "success" ? "Email confirmed" : "Confirmation issue"}
        </h1>
        <p className="auth-confirmed-copy">{message}</p>

        {state === "success" ? (
          <Button
            type="button"
            onClick={() => {
              void navigate(user ? "/dashboard" : "/", { replace: true });
            }}
          >
            {user ? "Continue to dashboard" : "Continue to sign in"}
          </Button>
        ) : (
          <div className="auth-confirmed-actions">
            <Button
              type="button"
              onClick={() => {
                void navigate("/", { replace: true });
              }}
            >
              Back to sign in
            </Button>
            <Link to="/" className="auth-confirmed-secondary">
              Need help? Return to TutorTrack
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthConfirmedPage;
