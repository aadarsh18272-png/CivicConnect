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
      const userCredential =
        await signInWithEmailAndPassword(
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
      await sendPasswordResetEmail(
        auth,
        email.trim()
      );

      setResetMessage(
        "Password reset email sent. Please check your inbox."
      );
    } catch (error) {
      console.error(
        "Password reset error:",
        error
      );

      if (
        error.code ===
        "auth/user-not-found"
      ) {
        setError(
          "No account was found with this email address."
        );
      } else if (
        error.code ===
        "auth/invalid-email"
      ) {
        setError(
          "Please enter a valid email address."
        );
      } else {
        setError(
          "Unable to send the reset email. Please try again."
        );
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
      <div className="admin-login-card">

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

        {!forgotPassword ? (
          <>
            <h1>Admin Login</h1>

            <p>
              Sign in to manage civic reports
              and community updates.
            </p>

            <form onSubmit={handleLogin}>

              <label>
                Email

                <div className="admin-input-wrap">
                  <Mail size={18} />

                  <input
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="Admin email"
                    autoComplete="email"
                  />
                </div>
              </label>

              <label>
                Password

                <div className="admin-input-wrap">
                  <LockKeyhole size={18} />

                  <input
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Admin password"
                    autoComplete="current-password"
                  />
                </div>
              </label>

              <button
                type="button"
                className="admin-forgot-button"
                onClick={openForgotPassword}
              >
                Forgot password?
              </button>

              {error && (
                <div className="admin-login-error">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="admin-login-button"
                disabled={loading}
              >
                {loading
                  ? "Signing in..."
                  : "Sign In"}

                {!loading && (
                  <LogIn size={18} />
                )}
              </button>

            </form>
          </>
        ) : (
          <>
            <h1>Reset Password</h1>

            <p>
              Enter your admin email address and
              we'll send you a secure password
              reset link.
            </p>

            <form
              onSubmit={
                handleForgotPassword
              }
            >

              <label>
                Admin Email

                <div className="admin-input-wrap">
                  <Mail size={18} />

                  <input
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="Admin email"
                    autoComplete="email"
                  />
                </div>
              </label>

              {error && (
                <div className="admin-login-error">
                  {error}
                </div>
              )}

              {resetMessage && (
                <div className="admin-login-success">
                  {resetMessage}
                </div>
              )}

              <button
                type="submit"
                className="admin-login-button"
                disabled={resetLoading}
              >
                {resetLoading
                  ? "Sending..."
                  : "Send Reset Link"}

                {!resetLoading && (
                  <Mail size={18} />
                )}
              </button>

              <button
                type="button"
                className="admin-back-login-button"
                onClick={backToLogin}
              >
                <ArrowLeft size={17} />
                Back to Login
              </button>

            </form>
          </>
        )}

      </div>
    </section>
  );
}

export default AdminLogin;