import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../components/AuthProvider";
import { LoginBrandPanel } from "../components/login/LoginBrandPanel";
import { Button, Checkbox, Field, Input } from "../components/ui";
import { getErrorMessage } from "../utils/getErrorMessage";
import "../styles/login.css";

const REMEMBERED_EMAIL_KEY = "tutortrack_remembered_email";
const REMEMBER_ME_KEY = "tutortrack_remember_me";

type AuthMode = "signin" | "signup";

function readRememberedEmail(): string {
  try {
    if (localStorage.getItem(REMEMBER_ME_KEY) !== "true") {
      return "";
    }
    return localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? "";
  } catch {
    return "";
  }
}

function readRememberMePreference(): boolean {
  try {
    return localStorage.getItem(REMEMBER_ME_KEY) === "true";
  } catch {
    return false;
  }
}

/** Closed eye — password is hidden. */
function EyeClosedIcon() {
  return (
    <svg
      className="login-password-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4 13c2.2 2.4 4.8 3.5 8 3.5s5.8-1.1 8-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M5 13.2c2 1.8 4.4 2.6 7 2.6s5-0.8 7-2.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M7.2 12.2l-0.9-1.6M9.6 13l-0.45-1.7M12 13.25v-1.8M14.4 13l0.45-1.7M16.8 12.2l0.9-1.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Open eye — password is visible. */
function EyeOpenIcon() {
  return (
    <svg
      className="login-password-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M2.5 12s3.6-6.5 9.5-6.5S21.5 12 21.5 12 17.9 18.5 12 18.5 2.5 12 2.5 12z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="2.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M7.5 8.6l-0.8-1.4M9.8 7.7l-0.35-1.5M12 7.35V5.7M14.2 7.7l0.35-1.5M16.5 8.6l0.8-1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LoginPage() {
  const { user, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(() => readRememberedEmail());
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => readRememberMePreference());
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const isSignUp = mode === "signup";

  function persistRememberMe(nextEmail: string, shouldRemember: boolean) {
    try {
      if (shouldRemember) {
        localStorage.setItem(REMEMBER_ME_KEY, "true");
        localStorage.setItem(REMEMBERED_EMAIL_KEY, nextEmail.trim());
      } else {
        localStorage.setItem(REMEMBER_ME_KEY, "false");
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }
    } catch {
      // Ignore storage failures (private mode, quota, etc.)
    }
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
    setInfo(null);
    setPassword("");
    setShowPassword(false);
    if (nextMode === "signin") {
      setName("");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);

    try {
      if (isSignUp) {
        const result = await signUp(email, password, name);
        persistRememberMe(email, rememberMe);

        if (!result.sessionCreated) {
          setInfo(
            "Account created. Check your email to confirm your address, then sign in."
          );
          setMode("signin");
          setPassword("");
          setName("");
        }
        // If a session was created, AuthProvider updates `user` and we redirect.
      } else {
        persistRememberMe(email, rememberMe);
        await signIn(email, password);
      }
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          isSignUp
            ? "Unable to create your account. Please try again."
            : "Unable to sign in. Please try again."
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <LoginBrandPanel />

      <main className="login-main">
        <section className="login-card" aria-labelledby="login-heading">
          <p className="login-brand">TutorTrack</p>
          <h1 id="login-heading">
            {isSignUp ? "Create account" : "Welcome back"}
          </h1>
          <p className="login-subtitle">
            {isSignUp
              ? "Create a TutorTrack account to manage language study plans."
              : "Sign in to continue to your tutoring workspace."}
          </p>

          <form className="login-form" onSubmit={handleSubmit}>
            {isSignUp && (
              <Field label="Name" htmlFor="name">
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  autoComplete="name"
                  autoFocus
                  disabled={submitting}
                  placeholder="Your name"
                />
              </Field>
            )}

            <Field label="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                autoFocus={!isSignUp}
                disabled={submitting}
              />
            </Field>

            <Field
              label="Password"
              htmlFor="password"
              hint={isSignUp ? "At least 6 characters." : undefined}
            >
              <div className="login-password-row">
                <Input
                  id="password"
                  className="login-password-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={isSignUp ? 6 : undefined}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  disabled={submitting}
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={submitting}
                >
                  {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                </button>
              </div>
            </Field>

            {!isSignUp && (
              <Checkbox
                id="remember-me"
                label="Remember me"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                disabled={submitting}
              />
            )}

            {error && (
              <p className="tt-form-error" role="alert">
                {error}
              </p>
            )}

            {info && (
              <p className="login-info" role="status">
                {info}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="login-submit"
              disabled={submitting}
            >
              {submitting
                ? isSignUp
                  ? "Creating account..."
                  : "Signing in..."
                : isSignUp
                  ? "Create account"
                  : "Sign in"}
            </Button>
          </form>

          <p className="login-switch">
            {isSignUp ? (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="login-switch-button"
                  onClick={() => switchMode("signin")}
                  disabled={submitting}
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                New to TutorTrack?{" "}
                <button
                  type="button"
                  className="login-switch-button"
                  onClick={() => switchMode("signup")}
                  disabled={submitting}
                >
                  Create account
                </button>
              </>
            )}
          </p>
        </section>
      </main>
    </div>
  );
}

export default LoginPage;
