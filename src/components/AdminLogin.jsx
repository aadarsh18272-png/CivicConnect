import React, { useState } from "react";
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  LockKeyhole,
  Mail,
  LogIn,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { auth } from "../firebase";

function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  const [forgotPassword, setForgotPassword] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setError("");
    setResetMessage("");

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      if (onLogin) {
        onLogin(userCredential.user);
      }
    } catch (error) {
      console.error("Admin login error:", error);
      setError("Invalid admin email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      setError("Please enter your admin email address first.");
      return;
    }

    setResetLoading(true);
    setError("");
    setResetMessage("");

    try {
      await sendPasswordResetEmail(auth, email.trim());

      setResetMessage(
        "Password reset email sent. Please check your inbox."
      );
    } catch (error) {
      console.error("Password reset error:", error);

      if (error.code === "auth/user-not-found") {
        setError("No account was found with this email address.");
      } else if (error.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError("Unable to send the reset email. Please try again.");
      }
    } finally {
      setResetLoading(false);
    }
  };

  const openForgotPassword = () => {
    setForgotPassword(true);
    setError("");
    setResetMessage("");
  };

  const backToLogin = () => {
    setForgotPassword(false);
    setError("");
    setResetMessage("");
  };

  return (
    <section className="admin-login-section">
      <div className="admin-login-shell">
        <div className="admin-login-brand">
          <div className="admin-login-brand-mark">
            <ShieldCheck size={18} />
          </div>
          <span>CivicConnect</span>
          <i />
          <span>Secure Staff Access</span>
        </div>

        <div className="admin-login-card">
          <div className="admin-login-card-glow" aria-hidden="true" />

          <div className="admin-login-topline">
            <div className="admin-login-icon">
              {forgotPassword ? (
                <KeyRound size={24} />
              ) : (
                <LockKeyhole size={24} />
              )}
            </div>

            <span className="admin-login-eyebrow">
              CIVICCONNECT ADMIN
            </span>
          </div>

          {!forgotPassword ? (
            <>
              <h1>Admin Login</h1>

              <p className="admin-login-description">
                Sign in to manage civic reports, review field evidence,
                and coordinate community updates.
              </p>

              <form onSubmit={handleLogin} className="admin-login-form">
                <label>
                  <span>Email</span>

                  <div className="admin-input-wrap">
                    <Mail size={18} aria-hidden="true" />

                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="Admin email"
                      autoComplete="email"
                      disabled={loading}
                    />
                  </div>
                </label>

                <label>
                  <span>Password</span>

                  <div className="admin-input-wrap">
                    <LockKeyhole size={18} aria-hidden="true" />

                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Admin password"
                      autoComplete="current-password"
                      disabled={loading}
                    />
                  </div>
                </label>

                <div className="admin-form-row">
                  <span className="admin-security-note">
                    <ShieldCheck size={14} />
                    Secure Firebase authentication
                  </span>

                  <button
                    type="button"
                    className="admin-forgot-button"
                    onClick={openForgotPassword}
                    disabled={loading}
                  >
                    Forgot password?
                  </button>
                </div>

                {error && (
                  <div className="admin-login-message admin-login-error" role="alert">
                    <span className="admin-message-dot" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="admin-login-button"
                  disabled={loading}
                >
                  <span>{loading ? "Signing in..." : "Sign In"}</span>

                  {!loading ? (
                    <LogIn size={18} />
                  ) : (
                    <span className="admin-button-spinner" aria-hidden="true" />
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1>Reset Password</h1>

              <p className="admin-login-description">
                Enter your admin email address and we'll send you a
                secure password reset link.
              </p>

              <form
                onSubmit={handleForgotPassword}
                className="admin-login-form"
              >
                <label>
                  <span>Admin Email</span>

                  <div className="admin-input-wrap">
                    <Mail size={18} aria-hidden="true" />

                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="Admin email"
                      autoComplete="email"
                      disabled={resetLoading}
                    />
                  </div>
                </label>

                {error && (
                  <div className="admin-login-message admin-login-error" role="alert">
                    <span className="admin-message-dot" />
                    {error}
                  </div>
                )}

                {resetMessage && (
                  <div
                    className="admin-login-message admin-login-success"
                    role="status"
                  >
                    <CheckCircleIcon />
                    {resetMessage}
                  </div>
                )}

                <button
                  type="submit"
                  className="admin-login-button"
                  disabled={resetLoading}
                >
                  <span>{resetLoading ? "Sending..." : "Send Reset Link"}</span>

                  {!resetLoading ? (
                    <Mail size={18} />
                  ) : (
                    <span className="admin-button-spinner" aria-hidden="true" />
                  )}
                </button>

                <button
                  type="button"
                  className="admin-back-login-button"
                  onClick={backToLogin}
                  disabled={resetLoading}
                >
                  <ArrowLeft size={17} />
                  <span>Back to Login</span>
                </button>
              </form>
            </>
          )}

          <div className="admin-login-footer">
            <span className="admin-footer-line" />
            <span>Authorized personnel only</span>
            <span className="admin-footer-line" />
          </div>
        </div>

        <p className="admin-login-disclaimer">
          CivicConnect • Community civic reporting platform
        </p>
      </div>
    </section>
  );
}

function CheckCircleIcon() {
  return (
    <span className="admin-success-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M7 12.5 10.2 15.5 17.5 8.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default AdminLogin;
