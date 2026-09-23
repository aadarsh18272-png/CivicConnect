import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
} from "firebase/auth";

import {
  HardHat,
  Mail,
  LockKeyhole,
  LogIn,
  ArrowLeft,
  UserRound,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  ArrowUpRight,
  Radio,
} from "lucide-react";

import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

/* =========================================================
   IMPORTANT:
   WorkerInput MUST be outside WorkerLogin.
   This prevents React from remounting the input on every
   keystroke and losing keyboard focus.
========================================================= */

function WorkerInput({
  icon: Icon,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  passwordToggle = false,
  showValue = false,
  onToggle,
}) {
  return (
    <div className="worker-login-input-wrap">
      <Icon
        size={17}
        className="worker-login-input-icon"
      />

      <input
        className="worker-login-input"
        type={
          passwordToggle
            ? showValue
              ? "text"
              : "password"
            : type
        }
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />

      {passwordToggle && (
        <button
          type="button"
          className="worker-login-eye"
          onClick={onToggle}
          aria-label={
            showValue
              ? "Hide password"
              : "Show password"
          }
        >
          {showValue ? (
            <EyeOff size={17} />
          ) : (
            <Eye size={17} />
          )}
        </button>
      )}
    </div>
  );
}

/* =========================================================
   WORKER LOGIN
========================================================= */

function WorkerLogin({ onLogin }) {
  const [mode, setMode] = useState("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /* =======================================================
     CLEAR MESSAGES
  ======================================================= */

  const clearMessages = () => {
    setError("");
    setMessage("");
  };

  /* =======================================================
     SWITCH MODE
  ======================================================= */

  const switchMode = (nextMode) => {
    setMode(nextMode);
    clearMessages();
  };

  /* =======================================================
     WORKER LOGIN
  ======================================================= */

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError(
        "Please enter your email and password."
      );
      return;
    }

    setLoading(true);
    clearMessages();

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
      console.error(
        "Worker login error:",
        error
      );

      if (
        error.code ===
          "auth/invalid-credential" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found"
      ) {
        setError(
          "Incorrect email or password."
        );
      } else if (
        error.code === "auth/invalid-email"
      ) {
        setError(
          "Please enter a valid email address."
        );
      } else {
        setError(
          "Unable to sign in. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     WORKER SIGN UP
  ======================================================= */

  const handleSignUp = async (event) => {
    event.preventDefault();

    if (
      !name.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (name.trim().length < 2) {
      setError(
        "Please enter your full name."
      );
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

      const worker = userCredential.user;

      await setDoc(
        doc(db, "workers", worker.uid),
        {
          uid: worker.uid,
          name: name.trim(),
          email: worker.email,
          role: "worker",
          status: "active",
          createdAt:
            new Date().toISOString(),
        }
      );

      if (onLogin) {
        onLogin(worker);
      }
    } catch (error) {
      console.error(
        "Worker signup error:",
        error
      );

      if (
        error.code ===
        "auth/email-already-in-use"
      ) {
        setError(
          "An account already exists with this email."
        );
      } else if (
        error.code === "auth/invalid-email"
      ) {
        setError(
          "Please enter a valid email address."
        );
      } else if (
        error.code === "auth/weak-password"
      ) {
        setError(
          "Password is too weak. Use at least 6 characters."
        );
      } else if (
        error.code === "permission-denied"
      ) {
        setError(
          "Account created, but the worker profile could not be saved. Check Firestore permissions."
        );
      } else {
        setError(
          "Unable to create the worker account. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     FORGOT PASSWORD
  ======================================================= */

  const handleForgotPassword = async (
    event
  ) => {
    event.preventDefault();

    if (!email.trim()) {
      setError(
        "Please enter your worker email address."
      );
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      await sendPasswordResetEmail(
        auth,
        email.trim()
      );

      setMessage(
        "Password reset email sent. Please check your inbox."
      );
    } catch (error) {
      console.error(
        "Worker password reset error:",
        error
      );

      if (
        error.code === "auth/invalid-email"
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
      setLoading(false);
    }
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <section className="worker-login-page">

      {/* BACKGROUND EFFECTS */}
      <div className="worker-login-grid" />

      <div className="worker-login-glow worker-glow-one" />
      <div className="worker-login-glow worker-glow-two" />

      {/* ===================================================
          TOP BAR
      =================================================== */}

      <header className="worker-login-topbar">

        <div className="worker-login-brand">

          <div className="worker-login-brand-mark">
            <HardHat size={20} />
          </div>

          <div>
            <div className="worker-login-brand-name">
              CivicConnect
            </div>

            <div className="worker-login-brand-sub">
              FIELD OPERATIONS
            </div>
          </div>

        </div>

        <div className="worker-login-top-status">

          <span className="worker-login-live-dot" />

          FIELD SYSTEM ONLINE

        </div>

      </header>

      {/* ===================================================
          MAIN CONTENT
      =================================================== */}

      <main className="worker-login-main">

        {/* =================================================
            LEFT SIDE
        ================================================= */}

        <div className="worker-login-side">

          <div>

            <div className="worker-login-kicker">
              <Radio size={14} />

              CIVIC FIELD NETWORK
            </div>

            <h1>
              Work happens
              <br />
              <span>here.</span>
            </h1>

            <p className="worker-login-side-description">
              CivicConnect gives field workers
              a focused workspace to handle
              assigned civic issues, document
              real-world progress and close
              the loop with evidence.
            </p>

          </div>

          {/* FIELD MODULE */}

          <div className="worker-login-field-module">

            <div className="worker-login-module-head">

              <div>
                <span>
                  ACTIVE FIELD SYSTEM
                </span>

                <strong>
                  Worker Operations
                </strong>
              </div>

              <ArrowUpRight
                size={19}
              />

            </div>

            <div className="worker-login-module-grid">

              <div>
                <span>01</span>
                <strong>ASSIGN</strong>
              </div>

              <div>
                <span>02</span>
                <strong>DOCUMENT</strong>
              </div>

              <div>
                <span>03</span>
                <strong>ACT</strong>
              </div>

              <div>
                <span>04</span>
                <strong>REPORT</strong>
              </div>

            </div>

          </div>

          {/* FEATURES */}

          <div className="worker-login-features">

            <div className="worker-login-feature">

              <div className="worker-login-feature-icon">
                <CheckCircle2 size={16} />
              </div>

              <div>
                <strong>
                  Assigned Work
                </strong>

                <span>
                  See civic issues assigned to you.
                </span>
              </div>

            </div>

            <div className="worker-login-feature">

              <div className="worker-login-feature-icon">
                <CheckCircle2 size={16} />
              </div>

              <div>
                <strong>
                  Field Evidence
                </strong>

                <span>
                  Upload before and after evidence.
                </span>
              </div>

            </div>

            <div className="worker-login-feature">

              <div className="worker-login-feature-icon">
                <CheckCircle2 size={16} />
              </div>

              <div>
                <strong>
                  Action Tracking
                </strong>

                <span>
                  Record work completed on-site.
                </span>
              </div>

            </div>

          </div>

        </div>

        {/* =================================================
            RIGHT LOGIN CARD
        ================================================= */}

        <div className="worker-login-card">

          <div className="worker-login-card-top">

            <div className="worker-login-security">

              <ShieldCheck size={15} />

              SECURE FIELD ACCESS

            </div>

            <div className="worker-login-card-index">
              01 / ACCESS
            </div>

          </div>

          {/* HEADING */}

          <div className="worker-login-heading">

            <h2>

              {mode === "login"
                ? "Worker Login"
                : mode === "signup"
                ? "Create Worker Account"
                : "Reset Password"}

            </h2>

            <p>

              {mode === "login"
                ? "Sign in to access your assigned civic work."
                : mode === "signup"
                ? "Create your account for CivicConnect field operations."
                : "We'll send a secure password reset link to your email."}

            </p>

          </div>

          {/* =================================================
              LOGIN
          ================================================= */}

          {mode === "login" && (

            <form
              className="worker-login-form"
              onSubmit={handleLogin}
            >

              {/* EMAIL */}

              <div className="worker-login-field">

                <label>
                  WORKER EMAIL
                </label>

                <WorkerInput
                  icon={Mail}
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  placeholder="worker@example.com"
                  autoComplete="email"
                />

              </div>

              {/* PASSWORD */}

              <div className="worker-login-field">

                <label>
                  PASSWORD
                </label>

                <WorkerInput
                  icon={LockKeyhole}
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  passwordToggle
                  showValue={showPassword}
                  onToggle={() =>
                    setShowPassword(
                      (previous) =>
                        !previous
                    )
                  }
                />

              </div>

              {/* FORGOT */}

              <div className="worker-login-forgot-row">

                <button
                  type="button"
                  className="worker-login-forgot"
                  onClick={() =>
                    switchMode("forgot")
                  }
                >
                  Forgot password?
                </button>

              </div>

              {/* ERROR */}

              {error && (

                <div className="worker-login-message worker-login-error">

                  <span className="worker-login-message-dot" />

                  {error}

                </div>

              )}

              {/* SUBMIT */}

              <button
                type="submit"
                className="worker-login-submit"
                disabled={loading}
              >

                <span>

                  {loading
                    ? "AUTHENTICATING..."
                    : "ENTER FIELD CONSOLE"}

                </span>

                {!loading && (
                  <LogIn size={17} />
                )}

              </button>

              {/* DIVIDER */}

              <div className="worker-login-divider">

                <span />

                <small>
                  NEW FIELD WORKER?
                </small>

                <span />

              </div>

              {/* SIGNUP */}

              <button
                type="button"
                className="worker-login-secondary"
                onClick={() =>
                  switchMode("signup")
                }
              >

                CREATE WORKER ACCOUNT

                <ArrowUpRight
                  size={16}
                />

              </button>

            </form>

          )}

          {/* =================================================
              SIGN UP
          ================================================= */}

          {mode === "signup" && (

            <form
              className="worker-login-form"
              onSubmit={handleSignUp}
            >

              {/* NAME */}

              <div className="worker-login-field">

                <label>
                  FULL NAME
                </label>

                <WorkerInput
                  icon={UserRound}
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  placeholder="Enter your full name"
                  autoComplete="name"
                />

              </div>

              {/* EMAIL */}

              <div className="worker-login-field">

                <label>
                  WORKER EMAIL
                </label>

                <WorkerInput
                  icon={Mail}
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  placeholder="worker@example.com"
                  autoComplete="email"
                />

              </div>

              {/* PASSWORD */}

              <div className="worker-login-field">

                <label>
                  PASSWORD
                </label>

                <WorkerInput
                  icon={LockKeyhole}
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Minimum 6 characters"
                  autoComplete="new-password"
                  passwordToggle
                  showValue={showPassword}
                  onToggle={() =>
                    setShowPassword(
                      (previous) =>
                        !previous
                    )
                  }
                />

              </div>

              {/* CONFIRM PASSWORD */}

              <div className="worker-login-field">

                <label>
                  CONFIRM PASSWORD
                </label>

                <WorkerInput
                  icon={LockKeyhole}
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  passwordToggle
                  showValue={
                    showConfirmPassword
                  }
                  onToggle={() =>
                    setShowConfirmPassword(
                      (previous) =>
                        !previous
                    )
                  }
                />

              </div>

              {/* ERROR */}

              {error && (

                <div className="worker-login-message worker-login-error">

                  <span className="worker-login-message-dot" />

                  {error}

                </div>

              )}

              {/* CREATE */}

              <button
                type="submit"
                className="worker-login-submit"
                disabled={loading}
              >

                <span>

                  {loading
                    ? "CREATING ACCOUNT..."
                    : "CREATE FIELD ACCOUNT"}

                </span>

                {!loading && (
                  <CheckCircle2
                    size={17}
                  />
                )}

              </button>

              {/* BACK */}

              <button
                type="button"
                className="worker-login-back"
                onClick={() =>
                  switchMode("login")
                }
              >

                <ArrowLeft size={16} />

                BACK TO WORKER LOGIN

              </button>

            </form>

          )}

          {/* =================================================
              FORGOT PASSWORD
          ================================================= */}

          {mode === "forgot" && (

            <form
              className="worker-login-form"
              onSubmit={
                handleForgotPassword
              }
            >

              {/* EMAIL */}

              <div className="worker-login-field">

                <label>
                  WORKER EMAIL
                </label>

                <WorkerInput
                  icon={Mail}
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  placeholder="worker@example.com"
                  autoComplete="email"
                />

              </div>

              {/* ERROR */}

              {error && (

                <div className="worker-login-message worker-login-error">

                  <span className="worker-login-message-dot" />

                  {error}

                </div>

              )}

              {/* SUCCESS */}

              {message && (

                <div className="worker-login-message worker-login-success">

                  <CheckCircle2
                    size={16}
                  />

                  {message}

                </div>

              )}

              {/* RESET */}

              <button
                type="submit"
                className="worker-login-submit"
                disabled={loading}
              >

                <span>

                  {loading
                    ? "SENDING..."
                    : "SEND RESET LINK"}

                </span>

                {!loading && (
                  <Mail size={17} />
                )}

              </button>

              {/* BACK */}

              <button
                type="button"
                className="worker-login-back"
                onClick={() =>
                  switchMode("login")
                }
              >

                <ArrowLeft size={16} />

                BACK TO WORKER LOGIN

              </button>

            </form>

          )}

          {/* FOOTER */}

          <div className="worker-login-footer">

            <ShieldCheck size={14} />

            <span>
              Protected CivicConnect field access
            </span>

            <span className="worker-login-footer-dot">
              •
            </span>

            <span>
              Secure session
            </span>

          </div>

        </div>

      </main>

    </section>
  );
}

export default WorkerLogin;