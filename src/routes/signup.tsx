import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/signup")({
  component: SignUpPage,
});

function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="auth-wrap">
      <header className="auth-head">
        <span className="auth-logo" aria-hidden="true">
          <strong>Mo</strong>
          <em>mas</em>
          <small>...technology concern</small>
        </span>
        <p className="auth-tagline">We Make Meter Communication seamless</p>
      </header>

      <section className="auth-card" aria-labelledby="auth-title">
        <h1 id="auth-title" className="auth-title">
          Sign Up
        </h1>

        <form
          className="auth-form"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="auth-field">
            <label htmlFor="business">Business Name</label>
            <input
              id="business"
              type="text"
              name="business"
              autoComplete="organization"
              placeholder="Enter business name"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              type="text"
              name="firstName"
              autoComplete="given-name"
              placeholder="Enter first name"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              type="text"
              name="lastName"
              autoComplete="family-name"
              placeholder="Enter last name"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signupEmail">Email Address</label>
            <input
              id="signupEmail"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="Enter email address"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="phone">Phone Number</label>
            <div className="auth-phone">
              <select
                className="auth-dial"
                name="dialCode"
                aria-label="Country dialing code"
                defaultValue="+234"
              >
                <option value="+234">+234</option>
                <option value="+1">+1</option>
                <option value="+44">+44</option>
                <option value="+233">+233</option>
                <option value="+254">+254</option>
                <option value="+27">+27</option>
              </select>
              <input
                id="phone"
                type="tel"
                name="phone"
                autoComplete="tel"
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="signupPassword">Password</label>
            <div className="auth-input-group">
              <input
                id="signupPassword"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="new-password"
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="auth-toggle"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="auth-input-group">
              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                autoComplete="new-password"
                placeholder="Confirm Password"
              />
              <button
                type="button"
                className="auth-toggle"
                aria-label={showConfirm ? "Hide password" : "Show password"}
                aria-pressed={showConfirm}
                onClick={() => setShowConfirm((value) => !value)}
              >
                {showConfirm ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-submit">
            Sign Up
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">
            Sign In
          </Link>
        </p>

        <p className="auth-terms">
          By continuing, you agree to HES Terms of Service and acknowledge that
          you&rsquo;ve read our Privacy Policy.
        </p>
      </section>
    </div>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9.88 9.88a3 3 0 0 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
